<template>
  <div
    v-if="realPosition !== null && realPosition.image && realPosition.image !== null"
    style="position: relative; width: 100%"
    v-bind:style="{ 'max-height': maxHeight + 'px' }"
  >
    <div
      ref="horizontal"
      style="height: 1px; width: 100%; background: red; position: absolute"
      v-bind:style="{ top: relativeYPosition }"
    ></div>
    <div
      ref="vertical"
      style="width: 1px; height: 100%; background: red; position: absolute"
      v-bind:style="{ left: relativeXPosition }"
    ></div>
    <img
      ref="img"
      style="width: 100%; object-fit: contain; max-height: 500px"
      :src="baseURL + realPosition.image.original"
      v-on:load="updateRelativePosition"
    />
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
        // when the image is resized because it is too high and have an margin left and right
        // when original hight is > 500, but not when already resized because the image is to wide
        if (image.naturalHeight > 500 && !(image.naturalWidth > image.width && image.height < 500)) {
          // compute left offset:

          const realImageWidth = Math.round((image.naturalWidth / image.naturalHeight) * 500);
          const margin = (image.width - realImageWidth) / 2;
          this.$refs.horizontal.style.marginLeft = margin + "px";
          this.$refs.horizontal.style.marginRight = margin + "px";
          this.$refs.horizontal.style.width = image.width - margin * 2 + "px";

          const offset = (1 - realImageWidth / image.width) / 2;
          // real 0.0 is offset and 1.0 is 1.0 - offset
          this.relativeXPosition =
            (this.realPosition.xPositionOnImage * (realImageWidth / image.width) + offset) * 100 + "%";
        } else {
          this.relativeXPosition = this.realPosition.xPositionOnImage * 100 + "%";
        }
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

<style>
</style>
