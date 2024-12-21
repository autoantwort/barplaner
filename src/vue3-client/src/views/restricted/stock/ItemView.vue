<template>
  <div class="container">
    <div class="row mt-3">
      <div v-if="realItem" class="col-12 col-md-8 offset-md-2 was-validated">
        <div class="d-flex justify-content-end">
          <router-link class="btn btn-sm btn-success mb-3 me-3" :to="{ name: 'addStockChange' }" @click="setNavigationData({ itemId: realItem.id })"
            >Add Change</router-link
          >
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Name</label>
          <generic-input-component :object="realItem" property="name" endpoint="/item/:id" required :minLength="4" />
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Barcode</label>
          <edit-barcode-component :object="realItem" property="barcode" />
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Barcode of Carton</label>
          <edit-barcode-component :object="realItem" property="barcodePack" />
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Article Number</label>
          <generic-input-component :object="realItem" property="articleNumber" endpoint="/item/:id" />
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Seller</label>
          <label class="col-9">{{ realItem.seller }}</label>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Content</label>
          <edit-content-component :object="realItem" />
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Alcohol by volume</label>
          <edit-percent-component :object="realItem" property="alcoholByVolume" endpoint="/item/:id" />
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">ItemGroup</label>
          <edit-item-group-component :object="realItem" />
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Image</label>
          <label class="col-9">
            <button v-if="realItem.imageId !== null" class="ms-2 btn btn-sm btn-sm-flat btn-secondary" type="button" v-on:click="openImage">
              <i-fa-image />
            </button>
            <template v-else>None</template>
          </label>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Position</label>
          <edit-position-component :object="realItem" endpoint="/item/:id" :usedForItem="true" />
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">In Stock</label>
          <label class="col-9">{{ stock === undefined ? 'Loading...' : stock ? stock.inStock : '0' }}</label>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Website</label>
          <edit-url-component :object="realItem" property="website" />
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Interal Note</label>
          <edit-textarea-component :object="realItem" property="internalNote" endpoint="/item/:id" />
        </div>
        <div class="row" v-if="stockChanges && stockChanges.length > 0">
          <stock-changes-list :changes="stockChanges" :showItem="false" />
        </div>
        <b-modal ref="image" hide-footer no-fade centered :title="realItem && realItem.name">
          <div v-if="loading === true" class="justify-content-center" style="display: flex">
            <b-spinner class="center" label="Loading..."></b-spinner>
          </div>
          <img v-if="imageId" style="width: 100%; height: 80dvh; object-fit: contain" :src="baseURL + imageId" v-on:load="loading = false" />
        </b-modal>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';
import GenericInputComponent from '@/components/GenericInputComponent.vue';
import EditPositionComponent from '@/components/EditPositionComponent.vue';
import EditBarcodeComponent from '@/components/EditBarcodeComponent.vue';
import EditContentComponent from '@/components/EditContentComponent.vue';
import EditItemGroupComponent from '@/components/EditItemGroupComponent.vue';
import EditTextareaComponent from '@/components/EditTextareaComponent.vue';
import EditUrlComponent from '@/components/EditUrlComponent.vue';
import EditPercentComponent from '@/components/EditPercentComponent.vue';

import StockChangesList from './StockChangesListView.vue';

import NavigationDataService from '@/router/navigationDataService';

export default {
  props: {
    item: {
      type: Object,
      default: null,
    },
  },
  components: {
    GenericInputComponent,
    EditPositionComponent,
    EditBarcodeComponent,
    EditContentComponent,
    EditItemGroupComponent,
    EditTextareaComponent,
    EditUrlComponent,
    EditPercentComponent,
    StockChangesList,
  },
  data() {
    return {
      realItem: null,
      imageId: null,
      loading: false,
      stock: undefined,
      stockChanges: null,
    };
  },
  methods: {
    openImage() {
      this.loading = true;
      http
        .get('/image/' + this.realItem.imageId)
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
        .get('/item/' + this.$route.params.itemId)
        .then(response => {
          this.realItem = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrieveStock() {
      const itemId = this.item === null ? this.$route.params.itemId : this.item.id;
      http
        .get('/item/' + itemId + '/stock')
        .then(response => {
          this.stock = response.data;
          console.log(this.stock);
        })
        .catch(console.error);
    },
    retrieveStockChanges() {
      const itemId = this.item === null ? this.$route.params.itemId : this.item.id;
      http
        .get('/item/' + itemId + '/stockChanges')
        .then(response => {
          this.stockChanges = response.data;
        })
        .catch(console.error);
    },
    setNavigationData(item) {
      NavigationDataService.set(item);
    },
  },
  created() {
    this.baseURL = http.defaults.baseURL + '/file/';
  },
  mounted() {
    const navData = NavigationDataService.get();
    if (this.item === null && !navData?.item) {
      this.retrieveItem();
    } else {
      this.realItem = this.item ?? navData.item;
    }
    this.retrieveStock();
    this.retrieveStockChanges();
  },
};
</script>

<style>
.btn-sm-flat {
  padding-top: 0 !important;
  padding-bottom: 0px !important;
}
</style>
