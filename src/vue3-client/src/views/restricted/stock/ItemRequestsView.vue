<template>
  <div class="container col-12 col-lg-8 mt-3">
    <div class="row">
      <div class="">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Requested Item</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(request, index) in quere" :key="index" @click="deleteRequest(index)">
              <td>{{ request.stockItem.name }}</td>
              <td>{{ request.amount }}x</td>
              <td><button class="btn btn-outline-danger"><i-fa-trash-can class="icon-btn" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import mqtt from 'mqtt';
import http from '@/http-common';

export default {
  data() {
    return {
      quere: [],
    };
  },
  methods: {
    deleteRequest(index) {
      http
        .delete('/itemRequest/' + this.quere[index].id)
        .catch(console.error);
    },
  },
  created() {
    this.baseURL = http.defaults.baseURL + '/file/';
    console.log('Connecting to MQTT started');
    this.client = mqtt.connect('wss://mqtt-ws.hilton.rwth-aachen.de'); // create a client
    this.client.on('error', err => {
      console.log('Error: ', err);
    });
    this.client.on('connect', () => {
      console.log('Connected to MQTT');
      this.client.subscribe('barplaner/itemRequest/quere', err => {
        if (!err) {
          console.log('Subscribed to itemRequest/quere');
        }
      });
    });
    this.client.on('message', (topic, message) => {
      if (topic === 'barplaner/itemRequest/quere') {
        this.quere = JSON.parse(message.toString());
      }
    });
  },
  beforeUnmount() {
    this.client.end();
  },
};
</script>

<style>
.btn-sm-flat {
  padding-top: 0 !important;
  padding-bottom: 0px !important;
}

.large-text {
  font-size: 60px;
}

.no-cursor {
  cursor: none;
}

.number-width {
  font-variant-numeric: tabular-nums;
}

.row-other {
  margin-top: -2rem;
  margin-bottom: -1rem;
}
</style>
