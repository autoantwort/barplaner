<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="d-flex justify-content-end">
          <router-link class="btn btn-success mt-3 mr-3" to="/addItem">Add Item</router-link>
        </div>
        <div class="form-group">
          <input type="text" class="mt-3 form-control" placeholder="Search" v-on:input="filter" />
        </div>
        <div class="mt-3 mb-3">
          <div v-if="items.length!==0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">ItemGroup</th>
                  <th scope="col">In Stock</th>
                  <th scope="col">Min Price</th>
                  <th scope="col">Avg Price</th>
                  <th scope="col">Max Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredItems" :key="item.id">
                  <td>
                    <router-link :to="{ name: 'item',params:{ itemId: item.itemId} }">{{item.stockItem.name}}</router-link>
                  </td>
                  <td>
                    <router-link
                      v-if="item.stockItem.itemGroup"
                      :to="{ name: 'itemGroup',params:{ itemGroupId: item.stockItem.itemGroup.id } }"
                    >{{item.stockItem.itemGroup.name}}</router-link>
                  </td>
                  <td>{{item.inStock}}</td>
                  <td>{{item.minPrice}}</td>
                  <td>{{item.avgPrice}}</td>
                  <td>{{item.maxPrice}}</td>
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
  name: "item-stock-list",
  data() {
    return {
      items: [],
      filteredItems: []
    };
  },
  methods: {
    /* eslint-disable no-console */
    filter(event) {
      this.filteredItems = phoneticsFilter(this.items, event.target.value);
    },
    retrieveItemStock() {
      http
        .get("/itemStock")
        .then(response => {
          this.filteredItems = this.items = response.data;
        })
        .catch(e => {
          console.error(e);
        });
    }
  },
  mounted() {
    this.retrieveItemStock();
    /* eslint-enable no-console */
  }
};
</script>

<style>
</style>
