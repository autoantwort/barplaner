<template>
  <div class="">

    <div class="ml-3 large-text font-weight-bold">
      <div class="row mt-3 align-items-baseline">
        <div class="col-4 text-nowrap text-truncate" style="font-size: smaller;">{{ user ?? "Scan Name" }}</div>
        <div class="col-8 text-nowrap text-truncate" :style="{ color: reasonColor }">{{ reason ?? "Scan Reason" }}</div>
      </div>
      <div class="row">
        <div class="col-12 text-nowrap text-truncate text-center" style="font-size: 70%;">{{ item?.name }} </div>
      </div>
      <div class="row" v-if="item !== null">
        <div class="col-12 text-center number-width">
          <span style="font-size: 150%;">{{ itemAmount }}
            <template v-if="changeAmount !== 0">
              <span v-if="changeType === '+'" style="color: green;">+ {{ changeAmount }}</span>
              <span v-if="changeType === '-'" style="color: red;">- {{ Math.abs(changeAmount) }}</span>
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
      <div class="row row-other" v-if="otherAmount && item?.itemGroup">
        <label class="col-12 pl-5 text-center text-nowrap text-truncate">
          {{ otherAmount }} {{ otherAmount === 1 ? "anderer" : "andere" }} {{ item?.itemGroup?.name }}
        </label>
      </div>
    </div>
    <div class="row mt-3" style="width: 100vw;">
      <div class="col-6">
        <img v-if="fileURL" style="width: 100%; height: 65dvh; object-fit: contain;" :src="fileURL" />
      </div>
      <div class="col-6" v-show="position">
        <div style="font-size: 50px;">{{ position?.name }}</div>
        <positionImage :max-height="2000" style="height: 65dvh;" :position="position"> </positionImage>
      </div>
    </div>
  </div>
</template>

<script>
import mqtt from "mqtt";

import http from "../../http-common";
import PositionImage from "./PositionImage";

export default {
  name: "item",
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
      fileURL: null,
      position: null,
    };
  },
  methods: {
    /* eslint-disable no-console */
    retrieveStockChanges() {
      const itemId = this.item === null ? this.$route.params.itemId : this.item.id;
      http
        .get("/item/" + itemId + "/stockChanges")
        .then((response) => {
          this.stockChanges = response.data;
        })
        .catch(console.error);
    },
  },
  computed: {
    otherAmount() {
      return Math.max(0, this.groupAmount - Math.max(0, this.itemAmount));
    },
  },
  created() {
    this.baseURL = http.defaults.baseURL + "/file/";
    console.log("Connecting to MQTT started");
    this.client = mqtt.connect("ws://mqtt.hilton.rwth-aachen.de:8080"); // create a client
    this.client.on("error", (err) => {
      console.log("Error: ", err);
    });
    this.client.on("connect", () => {
      console.log("Connected to MQTT");
      this.client.subscribe("barplaner/#", (err) => {
        if (!err) {
          console.log("Subscribed to stockChange");
        }
      });
    });
    this.client.on("message", (topic, message) => {
      if (topic !== "barplaner/debug") {
        console.log("Received message: ", message.toString(), " on topic: ", topic);
      }
      if (topic === "barplaner/user") {
        const user = message.toString();
        this.user = user.length > 0 ? user : null;
      } else if (topic === "barplaner/reasonName") {
        const reason = message.toString();
        this.reason = reason.length > 0 ? reason : null;
      } else if (topic === "barplaner/itemAmount") {
        this.itemAmount = Number(message.toString());
      } else if (topic === "barplaner/changeAmount") {
        this.changeAmount = Number(message.toString());
      } else if (topic === "barplaner/groupAmount") {
        this.groupAmount = Number(message.toString());
      } else if (topic === "barplaner/item") {
        this.item = JSON.parse(message.toString());
        const fileId = this.item?.image?.original;
        this.fileURL = fileId ? http.getFile(fileId) : null;
      } else if (topic === "barplaner/position") {
        this.position = JSON.parse(message.toString());
      } else if (topic === "barplaner/reasonIndex") {
        const index = Number(message.toString());
        if (index >= 100 || index === 0) {
          this.changeType = "=";
          this.reasonColor = "black";
        } else if (index < 0) {
          this.changeType = "-";
          this.reasonColor = "red";
        } else {
          this.changeType = "+";
          this.reasonColor = "green";
        }
      }
    });
  },
  beforeDestroy() {
    this.client.end();
  },
  /* eslint-enable no-console */
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
