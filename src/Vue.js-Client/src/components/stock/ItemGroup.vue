<template>
  <div class="container">
    <div class="row mt-3">
      <div v-if="realItemGroup" class="col-12 col-md-8 offset-md-2">
        <div class="form-group row">
          <label class="col-4">Name</label>
          <label class="col-8">{{realItemGroup.name}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Minimum Count</label>
          <label class="col-8">{{realItemGroup.minimumCount}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Ideal Count</label>
          <label class="col-8">{{realItemGroup.idealCount}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">In Stock</label>
          <label class="col-8">
            {{inStock}}
            <span
              v-if="inStock && inStock<realItemGroup.idealCount"
              class="badge ml-2 vert"
              style="vertical-align: text-top;"
              v-bind:class="[inStock<realItemGroup.minimumCount ? 'badge-danger' : 'badge-warning']"
            >Buy {{realItemGroup.idealCount - inStock}} item{{(realItemGroup.idealCount - inStock)>1?'s':''}}</span>
          </label>
        </div>
        <div class="form-group row">
          <label class="col-4">Position</label>
          <label class="col-8">
            <router-link
              v-if="realItemGroup.stockPosition"
              :to="{ name: 'position',params:{ positionId: realItemGroup.stockPosition.id , position:realItemGroup.stockPosition} }"
            >{{realItemGroup.stockPosition.name}}</router-link>
            <span v-else>None</span>
          </label>
        </div>
        <div class="row" v-if="itemStock && itemStock.length > 0">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Seller</th>
                <th scope="col">Content</th>
                <th scope="col">In Stock</th>
                <th scope="col">Min</th>
                <th scope="col">Avg</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itemStock" :key="item.id">
                <td>
                  <router-link :to="{ name: 'item',params:{ itemId: item.id } }">{{item.name}}</router-link>
                </td>
                <td>{{item.seller}}</td>
                <td>{{item.amount}} {{item.unit}}</td>
                <td>{{item.inStock}}</td>
                <td>{{item.minBrottoPrice}}</td>
                <td>{{item.avgBrottoPrice}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../../http-common";

export default {
  name: "itemGroup",
  props: {
    itemGroup: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      items: "",
      realItemGroup: null,
      itemStock: [],
      inStock: null
    };
  },
  methods: {
    /* eslint-disable no-console */

    retrieveitemGroup() {
      http
        .get("/itemGroup/" + this.$route.params.itemGroupId)
        .then(response => {
          this.realItemGroup = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrieveItemStock() {
      const itemGroupId =
        this.itemGroup !== null
          ? this.itemGroup.id
          : this.$route.params.itemGroupId;
      http
        .get("/itemGroup/" + itemGroupId + "/itemStock")
        .then(response => {
          this.itemStock = response.data;
          let inStock = 0;
          for (let i of this.itemStock) {
            inStock += i.inStock;
          }
          this.inStock = inStock;
        })
        .catch(console.error);
    }
  },
  mounted() {
    if (this.itemGroup === null) {
      this.retrieveitemGroup();
    } else {
      this.realItemGroup = this.itemGroup;
    }
    this.retrieveItemStock();
  }
  /* eslint-enable no-console */
};
</script>

<style>
</style>
