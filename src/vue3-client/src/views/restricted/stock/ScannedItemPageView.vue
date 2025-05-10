<template>
  <div class="">
    <div class="ms-3 large-text font-weight-bold">
      <div class="row mt-3 align-items-baseline">
        <div class="col-4 text-nowrap text-truncate" style="font-size: smaller">{{ user ?? 'Scan Name' }}</div>
        <div class="col-8 text-nowrap text-truncate" :style="{ color: reasonColor }">{{ reason ?? 'Scan Reason' }}</div>
      </div>
      <div class="row mt-3" v-if="currentRequest && !showTextBelow">
        <div class="col-12 text-nowrap text-truncate text-center" style="font-size: 70%">
          <span class="text-nowrap text-truncate">Angefragt: {{ currentRequest.amount }}x {{ currentRequest.stockItem.itemGroup?.name ??
            currentRequest.stockItem.name }}</span>
        </div>
      </div>
      <div class="row">
        <div class="col-12 text-nowrap text-truncate text-center" style="font-size: 70%">{{ item?.name }}</div>
      </div>
      <div class="row" v-if="item !== null">
        <div class="col-12 text-center number-width">
          <span style="font-size: 150%">{{ itemAmount }}
            <template v-if="changeAmount !== 0">
              <span v-if="changeType === '+'" style="color: green">+ {{ changeAmount }}</span>
              <span v-if="changeType === '-'" style="color: red">- {{ Math.abs(changeAmount) }}</span>
              = {{ itemAmount + changeAmount }}
            </template>
          </span>
          im Lager
        </div>
      </div>
      <div class="row mt-5" v-else-if="reason">
        <div class="col-4"></div>
        <label class="col-8">Scan Item</label>
      </div>
      <div class="row mt-3" v-if="currentRequest && showTextBelow">
        <div class="col-12 text-nowrap text-truncate text-center" style="font-size: 70%">
          <span class="text-nowrap text-truncate">Angefragt: {{ currentRequest.amount }}x {{ currentRequest.stockItem.itemGroup?.name ??
            currentRequest.stockItem.name }}</span>
        </div>
      </div>
      <div class="row row-other" v-if="otherAmount && item?.itemGroup">
        <label class="col-12 ps-5 text-center text-nowrap text-truncate">
          {{ otherAmount }} {{ otherAmount === 1 ? 'anderer' : 'andere' }} {{ item?.itemGroup?.name }}
        </label>
      </div>
    </div>
    <div class="row mt-3" style="width: 100vw">
      <div class="col-6">
        <img v-if="fileURL" style="width: 100%; height: 65dvh; object-fit: contain" :src="fileURL" />
      </div>
      <div class="col-6" v-show="position">
        <div style="font-size: 50px">{{ position?.name }}</div>
        <positionImage :max-height="2000" style="height: 65dvh" :position="position"> </positionImage>
      </div>
    </div>
  </div>
</template>

<script>
import mqtt from 'mqtt';

import http from '@/http-common';
import PositionImage from '@/components/PositionImage.vue';

function doesItemMatch(request, item) {
  if (request.stockItem.id === item.id) {
    return true;
  }
  if (item.itemGroup !== null && request.stockItem.itemGroup !== null && request.stockItem.itemGroup.id === item.itemGroup.id) {
    return true;
  }
  return false;
}

export default {
  components: {
    PositionImage,
  },
  data() {
    return {
      user: null,
      reason: null,
      itemAmount: null,
      groupAmount: null,
      changeAmount: null,
      item: null,
      imageFileURL: null,
      changeType: '=',
      reasonColor: 'black',
      itemPosition: null,
      selectedQuereIndex: null,
      quere: [],
      preferRequestImages: false,
    };
  },
  methods: {
    retrieveStockChanges() {
      const itemId = this.item === null ? this.$route.params.itemId : this.item.id;
      http
        .get('/item/' + itemId + '/stockChanges')
        .then(response => {
          this.stockChanges = response.data;
        })
        .catch(console.error);
    },
  },
  computed: {
    otherAmount() {
      return Math.max(0, this.groupAmount - Math.max(0, this.itemAmount));
    },
    currentRequest() {
      if (this.selectedQuereIndex !== null && this.quere.length > 0) {
        return this.quere[this.selectedQuereIndex];
      }
      return null;
    },
    requestPosition() {
      return this.currentRequest?.stockItem?.stockPosition ?? this.currentRequest?.stockItem?.itemGroup?.stockPosition;
    },
    position() {
      return (this.item !== null && !this.preferRequestImages) ? this.itemPosition ?? this.requestPosition : this.requestPosition;
    },
    fileURL() {
      if (this.item !== null && !this.preferRequestImages) {
        const fileId = this.item.image?.original;
        return fileId ? http.getFile(fileId) : null;
      }
      const fileId = this.currentRequest?.stockItem?.image?.original;
      return fileId ? http.getFile(fileId) : null;
    },
    showTextBelow() {
      return this.preferRequestImages || this.item === null;
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
      this.client.subscribe('barplaner/#', err => {
        if (!err) {
          console.log('Subscribed to stockChange');
        }
      });
    });
    this.client.on('message', (topic, message) => {
      if (topic !== 'barplaner/debug') {
        console.log('Received message: ', message.toString(), ' on topic: ', topic);
      }
      if (topic === 'barplaner/user') {
        const user = message.toString();
        this.user = user.length > 0 ? user : null;
      } else if (topic === 'barplaner/reasonName') {
        const reason = message.toString();
        this.reason = reason.length > 0 ? reason : null;
      } else if (topic === 'barplaner/itemAmount') {
        this.itemAmount = Number(message.toString());
      } else if (topic === 'barplaner/changeAmount') {
        this.changeAmount = Number(message.toString());
      } else if (topic === 'barplaner/groupAmount') {
        this.groupAmount = Number(message.toString());
      } else if (topic === 'barplaner/item') {
        this.item = JSON.parse(message.toString());
        if (this.item !== null) {
          this.preferRequestImages = false;
        }
      } else if (topic === 'barplaner/position') {
        this.itemPosition = JSON.parse(message.toString());
      } else if (topic === 'barplaner/reasonIndex') {
        const index = Number(message.toString());
        if (index >= 100 || index === 0) {
          this.changeType = '=';
          this.reasonColor = 'black';
        } else if (index < 0) {
          this.changeType = '-';
          this.reasonColor = 'red';
        } else {
          this.changeType = '+';
          this.reasonColor = 'green';
        }
      } else if (topic === 'barplaner/itemRequest/quere') {
        const quere = JSON.parse(message.toString());
        if (this.item !== null && this.selectedQuereIndex !== null) {
          // Currently selected item was in the quere. Check if it is still in the quere and if we should show the next request
          if (doesItemMatch(this.quere[this.selectedQuereIndex], this.item)) {
            // Item was the current item
            if (this.selectedQuereIndex >= quere.length || !doesItemMatch(quere[this.selectedQuereIndex], this.item)) {
              // Item is not in the quere anymore => show next request
              this.selectedQuereIndex = this.selectedQuereIndex % quere.length;
              this.preferRequestImages = true;
            }
          }
        }
        this.quere = quere;
        if (this.selectedQuereIndex === null || this.selectedQuereIndex >= this.quere.length) {
          this.selectedQuereIndex = 0;
        }
        if (this.quere.length === 0) {
          this.selectedQuereIndex = null;
        }
        if (this.item !== null) {
          const newIndex = quere.findIndex(request => doesItemMatch(request, this.item));
          if (newIndex >= 0) {
            this.selectedQuereIndex = newIndex;
          }
        }
      } else if (topic === 'barplaner/itemRequest/next') {
        if (this.quere.length > 0) {
          this.preferRequestImages = true;
          if (this.selectedQuereIndex === null) {
            this.selectedQuereIndex = 0;
          } else {
            this.selectedQuereIndex = (this.selectedQuereIndex + 1) % this.quere.length;
          }
        }
      } else if (topic === 'barplaner/itemRequest/previous') {
        if (this.quere.length > 0) {
          this.preferRequestImages = true;
          if (this.selectedQuereIndex === null) {
            this.selectedQuereIndex = 0;
          } else {
            this.selectedQuereIndex = (this.selectedQuereIndex - 1 + this.quere.length) % this.quere.length;
          }
        }
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
