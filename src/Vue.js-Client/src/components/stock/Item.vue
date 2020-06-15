<template>
  <div class="container">
    <div class="row mt-3">
      <div v-if="realItem" class="col-12 col-md-8 offset-md-2">
        <div class="form-group row">
          <label class="col-4">Name</label>
          <label class="col-8">{{realItem.name}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Barcode</label>
          <label class="col-8">{{realItem.barcode}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Article Number</label>
          <label class="col-8">{{realItem.articleNumber}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Seller</label>
          <label class="col-8">{{realItem.seller}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Content</label>
          <label class="col-8">{{realItem.amount}} {{realItem.unit?realItem.unit:''}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">ItemGroup</label>
          <label class="col-8">
            <router-link
              v-if="realItem.itemGroup"
              :to="{ name: 'itemGroup',params:{ itemGroupId: realItem.itemGroup.id , itemGroup: realItem.itemGroup} }"
            >{{realItem.itemGroup.name}}</router-link>
            <template v-else>None</template>
          </label>
        </div>
        <div class="form-group row">
          <label class="col-4">Image</label>
          <label class="col-8">
            <button v-if="realItem.imageId !== null" class="ml-2 btn btn-sm btn-sm-flat btn-secondary" type="button" v-on:click="openImage">
              <font-awesome-icon icon="image" />
            </button>
            <template v-else>None</template>
          </label>
        </div>
        <div class="form-group row">
          <label class="col-4">Position</label>
          <label class="col-8">
            <template v-if="realItem.stockPosition">
              <router-link
                :to="{ name: 'position',params:{ positionId: realItem.stockPosition.id , position: realItem.stockPosition} }"
              >{{realItem.stockPosition.name}}</router-link>
              <button
                v-if="realItem.stockPosition.imageId !== null"
                class="ml-2 btn btn-sm btn-sm-flat btn-secondary"
                type="button"
                v-on:click="openModal(realItem.stockPosition)"
              >
                <font-awesome-icon icon="image" />
              </button>
            </template>
            <template v-else-if="realItem.itemGroup && realItem.itemGroup.stockPosition">
              <router-link
                :to="{ name: 'position',params:{ positionId: realItem.itemGroup.stockPosition.id , position: realItem.itemGroup.stockPosition} }"
              >{{realItem.itemGroup.stockPosition.name}}</router-link>
              <button
                v-if="realItem.itemGroup.stockPosition.imageId !== null"
                class="ml-2 btn btn-sm btn-sm-flat btn-secondary"
                type="button"
                v-on:click="openModal(realItem.itemGroup.stockPosition)"
              >
                <font-awesome-icon icon="image" />
              </button>
            </template>
            <span v-else>None</span>
          </label>
        </div>
        <div class="form-group row">
          <label class="col-4">In Stock</label>
          <label class="col-8">{{stock === undefined ? "Loading..." : stock ? stock.inStock : "0"}}</label>
        </div>
        <div class="row" v-if="stockChanges && stockChanges.length > 0">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Amount</th>
                <th scope="col">Brotto Price</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="change in stockChanges" :key="change.id">
                <td>{{change.date | asDateTime}}</td>
                <td>{{change.amount}}</td>
                <td>{{change.brottoPrice}}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <b-modal ref="modal" hide-footer no-fade centered :title="selectedPosition && selectedPosition.name">
          <positionImage :position="selectedPosition"></positionImage>
        </b-modal>
        <b-modal ref="image" hide-footer no-fade centered :title="realItem && realItem.name">
          <div v-if="loading === true" class="justify-content-center" style="display: flex;">
            <b-spinner class="center" label="Loading..."></b-spinner>
          </div>
          <img v-if="imageId" style="width:100%" :src="baseURL+imageId" v-on:load="loading = false" />
        </b-modal>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../../http-common";
import PositionImage from "./PositionImage";

export default {
  name: "item",
  props: {
    item: {
      type: Object,
      default: null
    }
  },
  components: {
    PositionImage
  },
  data() {
    return {
      selectedPosition: null,
      realItem: null,
      imageId: null,
      loading: false,
      stock: undefined,
      stockChanges: null
    };
  },
  methods: {
    /* eslint-disable no-console */
    openModal(position) {
      this.selectedPosition = position;
      this.$refs.modal.show();
    },
    openImage() {
      this.loading = true;
      http
        .get("/image/" + this.realItem.imageId)
        .then(response => {
          this.imageId = response.data.original;
        })
        .catch(e => {
          console.log(e);
        });
      this.$refs.image.show();
    },
    retrieveItem() {
      http
        .get("/item/" + this.$route.params.itemId)
        .then(response => {
          this.realItem = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrieveStock() {
      const itemId =
        this.item === null ? this.$route.params.itemId : this.item.id;
      http
        .get("/item/" + itemId + "/stock")
        .then(response => {
          this.stock = response.data;
          console.log(this.stock);
        })
        .catch(console.error);
    },
    retrieveStockChanges() {
      const itemId =
        this.item === null ? this.$route.params.itemId : this.item.id;
      http
        .get("/item/" + itemId + "/stockChanges")
        .then(response => {
          this.stockChanges = response.data;
        })
        .catch(console.error);
    }
  },
  created() {
    this.baseURL = http.defaults.baseURL + "/file/";
  },
  mounted() {
    if (this.item === null) {
      this.retrieveItem();
    } else {
      this.realItem = this.item;
    }
    this.retrieveStock();
    this.retrieveStockChanges();
  }
  /* eslint-enable no-console */
};
</script>

<style>
.btn-sm-flat {
  padding-top: 0 !important;
  padding-bottom: 0px !important;
}
</style>
