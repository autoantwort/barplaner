<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="form-group">
          <input type="text" class="mt-3 form-control" placeholder="Search" v-on:input="filter" />
        </div>
        <div class="mt-3 mb-3">
          <div v-if="itemGroups.length !== 0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Item Group</th>
                  <th scope="col">Minimum Count</th>
                  <th scope="col">In Stock</th>
                  <th scope="col">Ideal Count</th>
                  <th scope="col">Buy</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="itemGroup in filteredItemGroups" :key="itemGroup.id" :class="itemGroup.class">
                  <td>
                    <router-link :to="{ name: 'itemGroup', params: { itemGroupId: itemGroup.id, itemGroup } }">{{
                      itemGroup.name
                    }}</router-link>
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
import http from "../../http-common";
import phoneticsFilter from "../../phoneticsFilter";

export default {
  name: "itemGroupStock",
  data() {
    return {
      itemGroups: [],
      filteredItemGroups: [],
      selectedPosition: null,
    };
  },
  methods: {
    /* eslint-disable no-console */
    filter(event) {
      this.filteredItemGroups = phoneticsFilter(this.itemGroups, event.target.value);
    },
    retrieveItemGroupStock() {
      http
        .get("/itemGroupStock")
        .then((response) => {
          this.itemGroups = response.data;
          const nonNull = (e, other) => e ? e : other;
          for (let i of this.itemGroups) {
            // Folgende Zeile ist in langer Diskussion entstanden und durch viel experimentieren entstanden
            // rank ist Faktor von minimumCount zu inStock multipliziert mit Faktor von idealCount zu minimumCount, darauf addiert eine gewichtete Differenz von idealCount zu inStock um Sachen die oft verbraucht werden zu bevorzugen. Falls zwei Items den gleichen Rank haben, entscheidet die Differenz von idealCount zu minimumCount.
            i.rank = (i.minimumCount / nonNull(i.inStock, 0.001)) * (nonNull(i.idealCount, i.minimumCount) / nonNull(i.minimumCount, 1)) + ((nonNull(i.idealCount, i.inStock - 1) - i.inStock)) * 0.5 + (nonNull(i.idealCount, i.minimumCount) - i.minimumCount) / 100;
            if (i.inStock < i.minimumCount) {
              i.class = "table-danger";
              if (i.idealCount) {
                i.buy = "Buy " + (i.idealCount - i.inStock) + " items";
              } else {
                i.buy = "Buy";
              }
            } else if (i.inStock < i.idealCount) {
              i.buy = "Buy " + (i.idealCount - i.inStock) + " items";
              i.class = "table-warning";
            } else {
              i.buy = "";
            }
          }
          this.itemGroups.sort((a, b) => {
            return b.rank - a.rank;
          });
          this.filteredItemGroups = this.itemGroups;
        })
        .catch((e) => {
          console.log(e);
        });
    },
    /* eslint-enable no-console */
  },
  mounted() {
    this.retrieveItemGroupStock();
  },
};
</script>

<style>
</style>
