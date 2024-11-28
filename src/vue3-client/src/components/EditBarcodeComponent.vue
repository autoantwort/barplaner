<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <label>{{ object[property] }}</label>
    <template v-slot:edit>
      <barcode-input v-model="barcodeValue" v-on:enter="$refs.edit.save" />
    </template>
  </edit-component>
</template>

<script>
import EditComponent from './EditComponent.vue';
import BarcodeInput from './BarcodeInput.vue';
import http from '@/http-common';

export default {
  name: 'edit-barcode-component',
  components: {
    EditComponent,
    BarcodeInput,
  },
  props: {
    object: {
      type: Object,
    },
    property: {
      type: String,
      default: 'barcode',
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
        .put('/item/' + this.object.id, { [this.property]: barcode })
        .then(response => {
          this.object[this.property] = response.data[this.property];
        })
        .catch(alert);
    },
    edit() {
      this.barcodeValue = this.object[this.property];
    },
  },
};
</script>
<style></style>
