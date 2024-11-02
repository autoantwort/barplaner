<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="form-group mb-1">
          <input type="text" class="mt-3 form-control" placeholder="Search" v-on:input="filter" />
        </div>
        <div class="form-group mb-1">
          <SharedTextArea class="mt-3 form-control" />
        </div>
        <input class="m-1 align-middle" type="checkbox" id="onlyUnchecked" v-model="onlyUnchecked" />
        <label class="pt-2 align-middle" for="onlyUnchecked">Only show unchecked entries</label>
        <button class="ml-3 py-0 btn btn-primary btn-sm align-middle" @click="clearSelection">Clear Selection</button>

        <div v-if="!connected" class="alert alert-danger" role="alert"><strong>Connection lost!</strong> Trying to reconnect...</div>
        <div class="mt-1 mb-3">
          <div v-if="itemGroups.length !== 0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">Item Group</th>
                  <th scope="col">Minimum Count</th>
                  <th scope="col">In Stock</th>
                  <th scope="col">Ideal Count</th>
                  <th scope="col">Buy</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="itemGroup in visibleItemGroups" :key="itemGroup.id" :class="itemGroup.class">
                  <td><input type="checkbox" v-model="itemGroup.checked" @click="onEntryChecked($event, itemGroup.id)" /></td>
                  <td>
                    <router-link :to="{ name: 'itemGroup', params: { itemGroupId: itemGroup.id, itemGroup } }">
                      {{ itemGroup.name }}
                    </router-link>
                  </td>
                  <td>{{ itemGroup.minimumCount }}</td>
                  <td>{{ itemGroup.inStock }}</td>
                  <td>{{ itemGroup.idealCount }}</td>
                  <td>{{ itemGroup.buy }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';
import phoneticsFilter from '@/phoneticsFilter';
import SharedTextArea from '@/components/SharedTextArea.vue';

export default {
  name: 'itemGroupStock',
  components: {
    SharedTextArea,
  },
  data() {
    return {
      itemGroups: [],
      filteredItemGroups: [],
      selectedPosition: null,
      onlyUnchecked: false,
      connected: 2,
    };
  },
  computed: {
    visibleItemGroups() {
      if (this.onlyUnchecked) {
        return this.filteredItemGroups.filter(itemGroup => !itemGroup.checked);
      }
      return this.filteredItemGroups;
    },
  },
  methods: {
    /* eslint-disable no-console */
    filter(event) {
      this.filteredItemGroups = phoneticsFilter(this.itemGroups, event.target.value);
    },
    retrieveItemGroupStock() {
      http
        .get('/itemGroupStock')
        .then(response => {
          const itemGroups = response.data;
          const nonNull = (e, other) => (e ? e : other);
          for (let i of itemGroups) {
            // Folgende Zeile ist in langer Diskussion entstanden und durch viel experimentieren entstanden
            // rank ist Faktor von minimumCount zu inStock multipliziert mit Faktor von idealCount zu minimumCount, darauf addiert eine gewichtete Differenz von idealCount zu inStock um Sachen die oft verbraucht werden zu bevorzugen. Falls zwei Items den gleichen Rank haben, entscheidet die Differenz von idealCount zu minimumCount.
            i.rank =
              (i.minimumCount / nonNull(i.inStock, 0.001)) * (nonNull(i.idealCount, i.minimumCount) / nonNull(i.minimumCount, 1)) +
              (nonNull(i.idealCount, i.inStock - 1) - i.inStock) * 0.5 +
              (nonNull(i.idealCount, i.minimumCount) - i.minimumCount) / 100;
            if (i.inStock < i.minimumCount) {
              i.class = 'table-danger';
              if (i.idealCount) {
                i.buy = 'Buy ' + (i.idealCount - i.inStock) + ' items';
              } else {
                i.buy = 'Buy';
              }
            } else if (i.inStock < i.idealCount) {
              i.buy = 'Buy ' + (i.idealCount - i.inStock) + ' items';
              i.class = 'table-warning';
            } else {
              i.buy = '';
            }
            i.checked = false;
          }
          itemGroups.sort((a, b) => {
            return b.rank - a.rank;
          });
          this.itemGroups = itemGroups;
          this.filteredItemGroups = this.itemGroups;
          this.initWebSocket();
          setTimeout(() => {
            if (this.connected === 2) {
              this.connected = false;
            }
          }, 2000);
        })
        .catch(e => {
          console.log(e);
        });
    },
    onEntryChecked(event, id) {
      this.webSocket.send(event.target.checked ? 'Add:' + id : 'Remove:' + id);
    },
    clearSelection() {
      this.itemGroups.forEach(i => (i.checked = false));
      this.webSocket.send('Clear');
    },
    initWebSocket() {
      this.webSocket = new WebSocket(http.defaults.baseWsURL + '/shoppingListState');
      this.webSocket.onopen = () => {
        this.connected = true;
      };
      this.webSocket.onclose = () => {
        this.connected = false;
        setTimeout(() => {
          this.initWebSocket();
        }, 2000);
      };
      this.webSocket.onmessage = event => {
        const msg = event.data.split(':');
        if (msg[0] === 'Add') {
          this.itemGroups.find(i => i.id === Number(msg[1])).checked = true;
        } else if (msg[0] === 'Remove') {
          this.itemGroups.find(i => i.id === Number(msg[1])).checked = false;
        } else if (msg[0] === 'Clear') {
          this.itemGroups.forEach(i => (i.checked = false));
        } else if (msg[0] === 'Init') {
          const ids = new Set(msg[1].split(',').map(id => Number(id)));
          this.itemGroups.forEach(i => {
            i.checked = ids.has(i.id);
          });
        } else {
          console.error('Unknown message: ' + event.data);
        }
      };
    },
    /* eslint-enable no-console */
  },
  mounted() {
    this.retrieveItemGroupStock();
  },
  beforeDestroy() {
    if (this.webSocket) {
      this.webSocket.close();
    }
  },
};
</script>

<style></style>
