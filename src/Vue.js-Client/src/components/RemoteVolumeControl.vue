<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2">
        <div v-if="!connected" class="alert alert-danger text-center" role="alert">Currently not connected</div>
        <table class="table">
          <thead>
            <tr>
              <th style="width: 25%" scope="col">Device</th>
              <th style="width: 10%" scope="col"></th>
              <th style="width: 55%" scope="col">System Volume</th>
              <th style="width: 10%" scope="col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(client, index) in clients" :key="index">
              <td>{{ client.name }}</td>
              <td class="text-right" style="padding-right: 0px">{{ client.value }}%</td>
              <td>
                <input type="range" form="0" to="100" style="width: 100%" v-model="client.value" @input="updateDevice(client, $event.target.value)" />
              </td>
              <td style="padding: .5rem; padding-left: 0px; padding-right: 0px;">
                <div class="btn-group btn-group-sm" role="group" aria-label="First group">
                  <button type="button" class="btn btn-secondary" :disabled="client.value < 1"
                    v-on:click="updateDevice(client, client.value = Math.max(0, client.value - 5))">-5</button>
                  <button type="button" class="btn btn-secondary" :disabled="client.value < 1" v-on:click="updateDevice(client, --client.value)">-1</button>
                  <button type="button" class="btn btn-secondary" :disabled="client.value > 99" v-on:click="updateDevice(client, ++client.value)">+1</button>
                  <button type="button" class="btn btn-secondary" :disabled="client.value > 99"
                    v-on:click="updateDevice(client, client.value = Math.min(100, client.value - (-5)))">+5</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../http-common";

export default {
  name: "remote-volume-control",
  data() {
    return {
      connected: false,
      clients: []
    };
  },
  methods: {
    /* eslint-disable no-console */
    updateDevice(client, value) {
      this.webSocket.send(client.name + ":" + value / 100);
    },
    initWebSocket() {
      this.webSocket = new WebSocket(
        http.defaults.baseWsURL + "/volumeMaster"
      );
      this.webSocket.onopen = () => {
        this.connected = true;
      };
      this.webSocket.onclose = () => {
        this.connected = false;
        setTimeout(() => {
          this.initWebSocket();
        }, 2000);
      };
      this.webSocket.onmessage = event => {
        const msg = event.data.split(":");
        if (msg[0] === "Add") {
          this.clients.push({
            name: msg[1],
            value: 0
          });
        } else if (msg[0] === "Remove") {
          const name = msg[1];
          const c = this.clients.find(c => c.name === name);
          if (c !== undefined) {
            this.clients.splice(this.clients.indexOf(c), 1);
          }
        } else if (msg[0] === "Rename") {
          const c = this.clients.find(c => c.name === msg[1]);
          if (c !== undefined) {
            c.name = msg[2];
          }
        } else if (msg[0] === "Value") {
          const c = this.clients.find(c => c.name === msg[1]);
          if (c !== undefined) {
            c.value = (Number(msg[2]) * 100).toFixed(0);
          }
        }
      };
    }
    /* eslint-enable no-console */
  },
  created() {
    this.initWebSocket();
  },
  beforeDestroy() {
    if (this.webSocket) {
      this.webSocket.close();
    }
  }
};
</script>

<style></style>
