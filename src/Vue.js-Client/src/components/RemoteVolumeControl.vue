<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2">
        <div
          v-if="!connected"
          class="alert alert-danger text-center"
          role="alert"
        >Currently not connected</div>
        <table class="table">
          <thead>
            <tr>
              <th style="width: 30%" scope="col">Device</th>
              <th style="width: 10%" scope="col"></th>
              <th style="width: 60%" scope="col">System Volume</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(client, index) in clients" :key="index">
              <td>{{client.name}}</td>
              <td class="text-right" style="padding-right: 0px">{{client.value}}%</td>
              <td>
                <input
                  type="range"
                  form="0"
                  to="100"
                  style="width: 100%"
                  v-model="client.value"
                  @input="updateDevice(client.name,$event.target.value)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
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
    updateDevice(name, value) {
      this.webSocket.send(name + ":" + value / 100);
    },
    initialize() {
      this.webSocket.onopen = () => {
        this.connected = true;
      };
      this.webSocket.onclose = () => {
        this.connected = false;
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
            this.clients.slice(this.clients.indexOf(c), 1);
          }
        } else if (msg[0] === "Rename") {
          const c = this.clients.find(c => c.name === msg[1]);
          if (c !== undefined) {
            c.name = msg[2];
          }
        } else if (msg[0] === "Value") {
          const c = this.clients.find(c => c.name === msg[1]);
          if (c !== undefined) {            
            c.value = Number(msg[2]);
          }
        }
      };
    }
    /* eslint-enable no-console */
  },
  created() {
    this.webSocket = new WebSocket(
      "wss://orga.symposion.hilton.rwth-aachen.de/volumeMaster"      
    );
    this.initialize();
  },
  mounted() {}
};
</script>

<style>
</style>
