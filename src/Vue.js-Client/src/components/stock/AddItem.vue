<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3">
        <form class="was-validated" id="form">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" class="form-control" id="name" required v-model.trim="item.name" name="name" />
            <div class="invalid-feedback">Required</div>
          </div>
          <div class="form-group">
            <label for="image">Image</label>
            <image-input ref="imageInput" />
          </div>
          <div class="form-group">
            <label for="barcode">Barcode (Scan with the barcode scanner)</label>
            <barcode-input v-model="item.barcode" />
          </div>
          <div class="form-group">
            <label for="articleNumber">Article Number (e.g. ASIN for Amazon, Art.-Nr. for Kachouri)</label>
            <input type="text" class="form-control" id="articleNumber" v-model="item.articleNumber" name="articleNumber" />
          </div>
          <div class="form-group">
            <label for="seller">Seller</label>
            <select class="form-control" id="seller" v-model="item.seller">
              <option>Amazon</option>
              <option>Metro</option>
              <option>Aldi</option>
              <option>Conalco</option>
              <option>Rewe</option>
              <option>Netto</option>
              <option>Donation</option>
              <option>Other</option>
              <option>Unknown</option>
            </select>
          </div>
          <div class="form-group">
            <position-card ref="position" :usedForItem="true" />
          </div>
          <div class="form-group">
            <label for="unit">Content</label>
            <content-input :object="item" />
          </div>
          <div class="form-group">
            <item-group-card ref="itemGroup" />
          </div>
          <div class="my-2 text-danger" v-if="errorString.length !== 0">{{errorString}}</div>
          <div class="my-3">
            <button type="button" class="btn btn-success mr-2 mb-2" v-on:click="addPosition">Add and add another</button>
            <button type="button" class="btn btn-success mr-2 mb-2" v-on:click="addPosition('items')">Add and view item list</button>
            <button type="button" class="btn btn-success mr-2" v-on:click="addPosition('addStockChange')">Add and add change</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../../http-common";

import BarcodeInput from "./components/BarcodeInput";
import ImageInput from "./components/ImageInput";
import ContentInput from "./components/ContentInput";
import PositionCard from "./components/PositionCard";
import ItemGroupCard from "./components/ItemGroupCard";

export default {
  name: "add-item",
  components: {
    BarcodeInput,
    ImageInput,
    ContentInput,
    PositionCard,
    ItemGroupCard,
  },
  props: {
    initialItem: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      item: {
        id: 0,
        name: "",
        barcode: null,
        articleNumber: null,
        seller: "Unknown",
        amount: null,
        unit: "Units",
      },
      errorString: "",
    };
  },
  methods: {
    /* eslint-disable no-console */
    async addPosition(redirectAfter) {
      //check if form is valid
      if (document.getElementById("form").checkValidity() === false) {
        this.errorString = "The form has invalid fields.\n";
        return;
      } else {
        this.errorString = "";
      }

      const formData = new FormData();
      // handle normal fields
      formData.set("name", this.item.name);
      if (this.item.barcode !== null) {
        formData.set("barcode", this.item.barcode);
      }
      if (this.item.articleNumber !== null) {
        formData.set("articleNumber", this.item.articleNumber);
      }
      if (this.item.seller !== "Unknown") {
        formData.set("seller", this.item.seller);
      }
      if (this.item.amount !== null) formData.set("amount", this.item.amount);
      if (this.item.unit !== "Units") {
        formData.set("unit", this.item.unit.toLowerCase());
      }

      // handle item position
      let result = await this.$refs.position.savePosition();
      if (typeof result === "number") {
        formData.set("stockPositionId", result);
      } else if (result !== null) {
        this.errorString = "Error while creating position: " + result;
        return;
      }

      // handle image
      const image = this.$refs.imageInput.getData();
      if (image.imageBlob !== null) {
        formData.set("itemImage", image.imageBlob);
      } else if (image.imageURL !== null) {
        formData.set("itemImageURL", image.imageURL);
      }

      // handle item group
      result = await this.$refs.itemGroup.saveItemGroup();
      if (typeof result === "number") {
        formData.set("itemGroupId", result);
      } else if (result !== null) {
        this.errorString = "Error while creating item group: " + result;
        return;
      }
      http
        .post("/item", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          validateStatus: () => true,
        })
        .then((response) => {
          if (response !== undefined) {
            if (response.status === 201) {
              if (redirectAfter !== undefined) {
                if (redirectAfter === "addStockChange") {
                  this.$router.push({
                    name: "addStockChange",
                    params: { itemId: response.data.id },
                  });
                } else {
                  this.$router.push(redirectAfter);
                }
              }
              this.errorString = "Item created";
            } else {
              this.errorString = response.data;
            }
          } else {
            this.errorString = "Network error :(";
          }
        });
    },
  },
  mounted() {
    if (this.initialItem !== null) {
      for (let p in this.initialItem) {
        this.item[p] = this.initialItem[p];
      }
    }
  },
};
/* eslint-enable no-console */
</script>

<style>
</style>
