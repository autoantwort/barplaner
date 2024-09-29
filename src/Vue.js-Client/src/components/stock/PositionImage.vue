<template>
  <div style="width: 100%" :style="{ 'max-height': maxHeight + 'px' }">
    <div v-if="realPosition !== null && realPosition.image && realPosition.image !== null" style="position: relative;">
      <div ref="horizontal" style="height: 2px; width: 100%; background: red; position: absolute" :style="{ top: relativeYPosition }"></div>
      <div ref="vertical" style="width: 2px; height: 100%; background: red; position: absolute" :style="{ left: relativeXPosition }"></div>
      <img ref="img" style="width: 100%; object-fit: contain;" :style="{ 'max-height': maxHeight + 'px' }" :src="baseURL + realPosition.image.original"
        :load="updateRelativePosition" />
    </div>
  </div>
</template>

<script>
import http from "../../http-common";

export default {
  name: "position",
  props: {
    position: {
      type: Object | Number,
      default: null,
    },
    maxHeight: {
      type: Number,
      default: 500,
    },
  },
  watch: {
    /* eslint-disable no-console */
    position: function (/*newPosition, oldPosition*/) {
      this.updateRealPosition();
    },
    realPosition: function () {
      this.$emit('PositionNameChanged', this.realPosition.name);
    },
  },
  data() {
    return {
      realPosition: null,
      relativeXPosition: "50%",
      relativeYPosition: "50%",
    };
  },
  methods: {
    updateRealPosition() {
      if (this.position === null) {
        console.error("PositionImage.vue: position is null, must be a number (id) or a position object");
      } else if (typeof this.position === "number") {
        this.retrievePosition();
      } else {
        this.realPosition = this.position;
        // check if the image id 'loaded'
        if (this.realPosition.imageId !== null && !this.realPosition.image !== undefined) {
          this.retrieveImage();
        }
      }
    },
    updateRelativePosition() {
      const image = this.$refs.img;
      if (this.realPosition !== null && image !== undefined) {
        this.relativeXPosition = this.realPosition.xPositionOnImage * 100 + "%";
        this.relativeYPosition = this.realPosition.yPositionOnImage * 100 + "%";
      }
    },
    retrievePosition() {
      http
        .get("/position/" + this.position)
        .then((response) => {
          this.realPosition = response.data;
          this.updateRelativePosition();
        })
        .catch((e) => {
          console.log(e);
        });
    },
    retrieveImage() {
      http
        .get("/image/" + this.position.imageId)
        .then((response) => {
          this.$root.$set(this.realPosition, "image", response.data);
          this.updateRelativePosition();
        })
        .catch((e) => {
          console.log(e);
        });
    },
  },
  created() {
    this.baseURL = http.defaults.baseURL + "/file/";
  },
  mounted() {
    this.updateRealPosition();
  },
  /* eslint-enable no-console */
};
</script>

<style></style>
