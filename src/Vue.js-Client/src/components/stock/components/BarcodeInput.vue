<template>
  <input
    type="text"
    class="form-control"
    id="barcode"
    :value="value"
    ref="barcode"
    v-on:input="onInput"
    name="barcode"
    v-on:keyup.enter="$emit('enter')"
  />
</template>

<script>
import http from "../../../http-common";

export default {
  name: "barcode-input",
  props: ["value"],
  methods: {
    onInput(e) {
      this.$emit("input", e.target.value.trim());
    },
  },
  created() {
    this.webSocket = new WebSocket(
      http.defaults.baseWsURL + "/scannerConsumer"
    );
    this.webSocket.onmessage = (e) => {
      this.$refs.barcode.value = e.data;
      this.$emit("input", e.data.trim());
      this.$emit("enter");
    };
  },
  beforeDestroy() {
    this.webSocket.close();
  },
};
</script>
<style>
</style>
