<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <label>{{object.barcode}}</label>
    <template v-slot:edit>
      <barcode-input v-model="barcodeValue" v-on:enter="$refs.edit.save" />
    </template>
  </edit-component>
</template>


<script>
import EditComponent from "./EditComponent";
import BarcodeInput from "./BarcodeInput";
import http from "../../../http-common";

export default {
  name: "edit-barcode-component",
  components: {
    EditComponent,
    BarcodeInput,
  },
  props: {
    object: {
      type: Object,
    },
  },
  data() {
    return {
      barcodeValue: null,
    };
  },
  methods: {
    save() {
      const value = this.barcodeValue;
      const barcode = value && value.length > 0 ? value : null;
      http
        .put("/item/" + this.object.id, { barcode })
        .then((response) => {
          this.object.barcode = response.data.barcode;
        })
        .catch(alert);
    },
    edit() {
      this.barcodeValue = this.object.barcode;
    },
  },
};
</script>
<style>
</style>
