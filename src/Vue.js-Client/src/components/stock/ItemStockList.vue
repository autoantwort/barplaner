<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="d-flex justify-content-end">
          <router-link class="btn btn-success m-3" to="/addItem">Add Item</router-link>
        </div>
        <div class="form-group">
          <barcode-input placeholder="Search" v-on:input="filter" />
        </div>
        <div class="mt-3 mb-3">
          <div v-if="items.length !== 0" class="table-responsive">
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
                    <router-link :to="{ name: 'item', params: { itemId: item.itemId } }">{{
                      item.stockItem.name
                    }}</router-link>
                  </td>
                  <td>
                    <router-link
                      v-if="item.stockItem.itemGroup"
                      :to="{ name: 'itemGroup', params: { itemGroupId: item.stockItem.itemGroup.id } }"
                      >{{ item.stockItem.itemGroup.name }}</router-link
                    >
                  </td>
                  <td>{{ item.inStock }}</td>
                  <td>{{ print(item.minBrottoPrice) }}</td>
                  <td>{{ print(item.avgBrottoPrice) }}</td>
                  <td>{{ print(item.maxBrottoPrice) }}</td>
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
import BarcodeInput from "./components/BarcodeInput.vue";

export default {
  name: "item-stock-list",
  components: {
    BarcodeInput,
  },
  data() {
    return {
      items: [],
      filteredItems: [],
    };
  },
  methods: {
    /* eslint-disable no-console */
    filter(value) {
      this.filteredItems = phoneticsFilter(this.items, value, (item) => item.barcode === value);
    },
    print(price) {
      if (price === null) return null;
      return price.toFixed(2) + " €";
    },
    retrieveItemStock() {
      http
        .get("/itemStock")
        .then((response) => {
          this.filteredItems = this.items = response.data;
          for (let item of this.items) {
            item.nameColognePhonetics = item.stockItem.nameColognePhonetics;
          }
        })
        .catch((e) => {
          console.error(e);
        });
    },
  },
  mounted() {
    this.retrieveItemStock();
    /* eslint-enable no-console */
  },
};
</script>

<style>
</style>
