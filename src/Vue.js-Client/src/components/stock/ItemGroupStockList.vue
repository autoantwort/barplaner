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
          for (let i of this.itemGroups) {
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
