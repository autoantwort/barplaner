<template>
  <div>
    <barcode-scanner ref="scanner" :callback="onBarcodeInput" />
    <div class="input-group">
      <input v-bind="$attrs" type="text" class="form-control" ref="barcode" v-on:input="onInput" v-on:keyup.enter="$emit('enter')" :placeholder="placeholder" />
      <button class="btn btn-success" type="button" v-on:click="$refs.scanner.loadDevicesAndPlay()">Scan</button>
    </div>
  </div>
</template>

<script>
import BarcodeScanner from './BarcodeScanner.vue';
import http from '@/http-common';

export default {
  name: 'barcode-input',
  props: ['value', 'placeholder'],
  components: {
    BarcodeScanner,
  },
  methods: {
    onBarcodeInput(value) {
      this.$emit('input', value);
      this.$refs.barcode.value = value;
    },
    onInput(e) {
      this.$emit('input', e.target.value.trim());
    },
  },
  created() {
    this.webSocket = new WebSocket(http.defaults.baseWsURL + '/scannerConsumer');
    this.webSocket.onmessage = e => {
      this.$refs.barcode.value = e.data;
      this.$emit('input', e.data.trim());
      this.$emit('enter');
    };
  },
  beforeUnmount() {
    this.webSocket.close();
  },
};
</script>
<style></style>
