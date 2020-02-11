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
          <label class="col-8">{{realItem.itemGroup?realItem.itemGroup.name:'None'}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Image</label>
          <label class="col-8">
            <button v-if="realItem.image !== null" class="ml-2 btn btn-sm btn-sm-flat btn-secondary" type="button" v-on:click="openImage">
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
      items: "",
      realItem: null,
      imageId: null,
      loading: false
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
        .get("/image/" + this.realItem.image)
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
