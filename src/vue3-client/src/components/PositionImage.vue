<template>
  <div ref="test" style="width: 100%" :style="{ 'max-height': maxHeight + 'px' }">
    <div v-if="realPosition !== null && realPosition.image && realPosition.image !== null" style="position: relative">
      <div ref="horizontal" style="height: 2px; background: red; position: absolute" :style="{ top: relativeYPosition, width: horizontalWidth }"></div>
      <div ref="vertical" style="width: 2px; height: 100%; background: red; position: absolute" :style="{ left: relativeXPosition }"></div>
      <img
        ref="img"
        style="width: 100%; object-fit: contain"
        :style="{ 'max-height': maxHeight + 'px' }"
        :src="baseURL + realPosition.image.original"
        @load="updateRelativePosition"
      />
    </div>
  </div>
</template>

<script>
import http from '@/http-common';

export default {
  props: {
    position: {
      type: [Object, Number],
      default: null,
    },
    maxHeight: {
      type: Number,
      default: 500,
    },
  },
  watch: {
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
      relativeXPosition: '50%',
      relativeYPosition: '50%',
      horizontalWidth: '100%',
    };
  },
  methods: {
    updateRealPosition() {
      if (this.position === null) {
        console.error('PositionImage.vue: position is null, must be a number (id) or a position object');
      } else if (typeof this.position === 'number') {
        this.retrievePosition();
      } else {
        this.realPosition = this.position;
        // check if the image id 'loaded'
        if (this.realPosition.imageId !== null && this.realPosition.image === undefined) {
          this.retrieveImage();
        }
      }
    },
    updateRelativePosition() {
      const image = this.$refs.img;
      if (this.realPosition !== null && image !== undefined) {
        this.relativeYPosition = this.realPosition.yPositionOnImage * 100 + '%';
        // when the image is resized because it is too high and have an margin left and right
        // we have to adjust the relative x position
        const imgAspectRatio = image.naturalWidth / image.naturalHeight;
        const containerAspectRatio = image.width / image.height;
        if (imgAspectRatio < containerAspectRatio) {
          // wir haben link und rechts einen weißen Rand
          const realImageWidth = image.height * imgAspectRatio;
          const margin = (image.width - realImageWidth) / 2;
          this.$refs.horizontal.style.marginLeft = margin + 'px';
          this.$refs.horizontal.style.marginRight = margin + 'px';
          this.horizontalWidth = image.width - margin * 2 + 'px';

          const absolutePosition = margin + this.realPosition.xPositionOnImage * realImageWidth;
          this.relativeXPosition = (absolutePosition / image.width) * 100 + '%';
        } else {
          this.relativeXPosition = this.realPosition.xPositionOnImage * 100 + '%';
        }
      }
    },
    retrievePosition() {
      http
        .get('/position/' + this.position)
        .then(response => {
          this.realPosition = response.data;
          this.updateRelativePosition();
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrieveImage() {
      http
        .get('/image/' + this.position.imageId)
        .then(response => {
          this.realPosition.image = response.data;
          this.updateRelativePosition();
        })
        .catch(e => {
          console.log(e);
        });
    },
  },
  created() {
    this.baseURL = http.defaults.baseURL + '/file/';
  },
  mounted() {
    this.updateRealPosition();
  },
};
</script>

<style></style>
