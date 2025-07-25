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
import { subscribeMqtt } from '@/mqttSub';
import BarcodeScanner from './BarcodeScanner.vue';

export default {
  name: 'barcode-input',
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue', 'enter'],
  components: {
    BarcodeScanner,
  },
  methods: {
    onBarcodeInput(value) {
      this.$emit('update:modelValue', value);
      this.$refs.barcode.value = value;
    },
    onInput(e) {
      this.$emit('update:modelValue', e.target.value.trim());
    },
  },
  created() {
    this.client = subscribeMqtt('barplaner/scanner');
    this.client.on('message', (topic, message) => {
      if (topic === 'barplaner/scanner') {
        const value = message.toString().trim();
        this.$refs.barcode.value = value;
        this.$emit('update:modelValue', value);
        this.$emit('enter');
      }
    });
  },
  beforeUnmount() {
    this.client.end();
  },
};
</script>
<style></style>
