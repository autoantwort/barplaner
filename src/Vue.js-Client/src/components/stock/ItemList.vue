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
          <div v-if="items.length !== 0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">ItemGroup</th>
                  <th scope="col">Position</th>
                  <th scope="col">Seller</th>
                  <th scope="col">Content</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredItems" :key="item.id">
                  <td>
                    <router-link :to="{ name: 'item', params: { itemId: item.id, item: item } }">{{
                      item.name
                    }}</router-link>
                    <button
                      v-if="item.imageId !== null"
                      class="ml-2 btn btn-sm btn-sm-flat btn-secondary"
                      type="button"
                      v-on:click="openImage(item)"
                    >
                      <font-awesome-icon icon="image" />
                    </button>
                  </td>
                  <td>
                    <router-link
                      v-if="item.itemGroup"
                      :to="{ name: 'itemGroup', params: { itemGroupId: item.itemGroup.id, itemGroup: item.itemGroup } }"
                      >{{ item.itemGroup.name }}</router-link
                    >
                  </td>
                  <td>
                    <template v-if="item.stockPosition">
                      <router-link
                        :to="{
                          name: 'position',
                          params: { positionId: item.stockPosition.id, position: item.stockPosition },
                        }"
                        >{{ item.stockPosition.name }}</router-link
                      >
                      <button
                        v-if="item.stockPosition.imageId !== null"
                        class="ml-2 btn btn-sm btn-sm-flat btn-secondary"
                        type="button"
                        v-on:click="openModal(item.stockPosition)"
                      >
                        <font-awesome-icon icon="image" />
                      </button>
                    </template>
                    <template v-else-if="item.itemGroup && item.itemGroup.stockPosition">
                      <router-link
                        :to="{
                          name: 'position',
                          params: { positionId: item.itemGroup.stockPosition.id, position: item.itemGroup.stockPosition },
                        }"
                        >{{ item.itemGroup.stockPosition.name }}</router-link
                      >
                      <button
                        v-if="item.itemGroup.stockPosition.imageId !== null"
                        class="ml-2 btn btn-sm btn-sm-flat btn-secondary"
                        type="button"
                        v-on:click="openModal(item.itemGroup.stockPosition)"
                      >
                        <font-awesome-icon icon="image" />
                      </button>
                    </template>
                  </td>
                  <td>{{ item.seller }}</td>
                  <td>{{ item.amount }} {{ item.unit === "unknown" ? "" : item.unit }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <b-modal ref="modal" hide-footer no-fade centered :title="selectedPosition && selectedPosition.name">
      <positionImage :position="selectedPosition"></positionImage>
    </b-modal>
    <b-modal ref="image" hide-footer no-fade centered :title="selectedItem && selectedItem.name">
      <div v-if="loading === true" class="justify-content-center" style="display: flex">
        <b-spinner class="center" label="Loading..."></b-spinner>
      </div>
      <img v-if="selectedImageId" style="width: 100%" :src="baseURL + selectedImageId" v-on:load="loading = false" />
    </b-modal>
  </div>
</template>

<script>
import http from "../../http-common";
import phoneticsFilter from "../../phoneticsFilter";
import PositionImage from "./PositionImage";

export default {
  name: "item-list",
  data() {
    return {
      items: [],
      filteredItems: [],
      selectedPosition: null,
      selectedItem: null,
      selectedImageId: null,
      loading: false,
    };
  },
  components: {
    PositionImage,
  },
  methods: {
    /* eslint-disable no-console */
    filter(event) {
      this.filteredItems = phoneticsFilter(this.items, event.target.value);
    },
    openModal(position) {
      this.selectedPosition = position;
      this.$refs.modal.show();
    },
    openImage(item) {
      this.selectedImageId = null;
      this.selectedItem = item;
      this.loading = true;
      http
        .get("/image/" + item.imageId)
        .then((response) => {
          this.selectedImageId = response.data.original;
        })
        .catch((e) => {
          console.log(e);
        });
      this.$refs.image.show();
    },
    retrieveItems() {
      http
        .get("/itemsWithGroupsAndPositions")
        .then((response) => {
          this.filteredItems = this.items = response.data;
        })
        .catch((e) => {
          console.log(e);
        });
    },
  },
  created() {
    this.baseURL = http.defaults.baseURL + "/file/";
  },
  mounted() {
    this.retrieveItems();
    /* eslint-enable no-console */
  },
};
</script>


<style>
.btn-sm-flat {
  padding-top: 0 !important;
  padding-bottom: 0px !important;
}
</style>
