<template>
  <textarea v-bind="$attrs" style="border: none" :rows="rows" v-model="text" v-on:input.self="onInput" :disabled="disabled" />
</template>

<script>
import http from '@/http-common';

export default {
  data() {
    return {
      text: 'Connecting...',
      disabled: true,
      rows: 2,
    };
  },
  methods: {
    onInput() {
      this.webSocket.send(this.text);
    },
    initWebSocket() {
      this.webSocket = new WebSocket(http.defaults.baseWsURL + '/shoppingListText');
      this.webSocket.onopen = () => {
        this.disabled = false;
      };
      this.webSocket.onclose = () => {
        this.disabled = true;
        setTimeout(() => {
          this.initWebSocket();
        }, 2000);
      };
      this.webSocket.onmessage = event => {
        clearInterval(this.interval);
        if (this.interval) {
          this.disabled = true;
          this.interval = setTimeout(() => {
            this.disabled = false;
          }, 1000);
        } else {
          this.rows = event.data.split('\n').length;
        }
        this.text = event.data;
        window.localStorage.setItem('shoppingListText', event.data);
      };
    },
  },
  created() {
    this.text = window.localStorage.getItem('shoppingListText') || this.text;
    this.rows = this.text.split('\n').length;
    this.initWebSocket();
  },
  beforeUnmount() {
    this.webSocket.close();
  },
};
</script>
<style></style>
