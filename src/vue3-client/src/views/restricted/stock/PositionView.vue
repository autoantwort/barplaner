<template>
  <div class="container">
    <div class="row mt-3">
      <div v-if="realPosition" class="col-12 col-md-8 offset-md-2">
        <div class="mb-3 row">
          <label class="col-3 form-label">Name</label>
          <generic-input-component :object="realPosition" property="name" endpoint="/position/:id" required :minLength="4" />
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Description</label>
          <label class="col-9">{{ realPosition.description }}</label>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Room</label>
          <label class="col-9">{{ realPosition.room }}</label>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Item Groups</label>
          <label class="col-9">
            <router-link v-for="group in itemGroups" :key="group.id" :to="{ name: 'itemGroup', params: { itemGroupId: group.id, itemGroup: group } }">{{
              group.name
            }}</router-link>
            {{ itemGroups.length === 0 ? 'None' : '' }}
          </label>
        </div>
        <positionImage ref="image" v-bind:position="realPosition"></positionImage>
        <div class="row" v-if="itemStock && itemStock.length > 0">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Item Group</th>
                <th scope="col">Position</th>
                <th scope="col">Content</th>
                <th scope="col">In Stock</th>
                <th scope="col">Min</th>
                <th scope="col">Avg</th>
                <th scope="col">Max</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itemStock" :key="item.id">
                <td>
                  <router-link :to="{ name: 'item', params: { itemId: item.id } }">{{ item.name }}</router-link>
                </td>
                <td>
                  <router-link v-if="item.itemGroupId !== null" :to="{ name: 'itemGroup', params: { itemGroupId: item.itemGroupId } }">{{
                    item.itemGroupName
                  }}</router-link>
                </td>
                <td>{{ item.itemPos ? 'From Item' : 'From Item Group' }}</td>
                <td>{{ item.amount }} {{ item.unit }}</td>
                <td>{{ item.inStock }}</td>
                <td>{{ item.minBrottoPrice }}</td>
                <td>{{ item.avgBrottoPrice }}</td>
                <td>{{ item.maxBrottoPrice }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';
import PositionImage from '@/components/PositionImage.vue';
import GenericInputComponent from '@/components/GenericInputComponent.vue';

export default {
  props: {
    position: {
      type: Object,
      default: null,
    },
  },
  components: {
    PositionImage,
    GenericInputComponent,
  },
  data() {
    return {
      items: '',
      realPosition: null,
      itemStock: [],
      itemGroups: [],
    };
  },
  methods: {
    retrievePosition() {
      http
        .get('/position/' + this.$route.params.positionId)
        .then(response => {
          this.realPosition = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrieveItemStock(positionId) {
      http
        .get('/position/' + positionId + '/itemStock')
        .then(response => {
          this.itemStock = response.data;
        })
        .catch(console.error);
    },
    retrieveItemGroups(positionId) {
      http
        .get('/position/' + positionId + '/itemGroups')
        .then(response => {
          this.itemGroups = response.data;
        })
        .catch(console.error);
    },
  },
  mounted() {
    if (this.realPosition === null) {
      this.retrievePosition();
    } else {
      this.realPosition = this.position;
    }
    const positionId = this.position !== null ? this.position.id : this.$route.params.positionId;
    this.retrieveItemStock(positionId);
    this.retrieveItemGroups(positionId);
  },
};
</script>

<style></style>
