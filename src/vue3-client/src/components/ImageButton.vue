<template>
  <button v-if="item.imageId !== null" class="ms-2 btn btn-sm btn-sm-flat btn-secondary" type="button" v-on:click="openImage()">
    <i-fa-image />

    <b-modal ref="image" hide-footer no-fade centered :title="item.name">
      <img v-if="fileURL" style="width: 100%; height: 80dvh; object-fit: contain" :src="fileURL" />
    </b-modal>
  </button>
</template>

<script>
import http from '@/http-common';

export default {
  props: ['item'],
  data() {
    return {
      fileURL: null,
    };
  },
  methods: {
    openImage() {
      http
        .get('/image/' + this.item.imageId)
        .then(response => {
          const fileId = response.data.original;
          this.fileURL = http.getFile(fileId);
          console.log('fileurl', this.fileURL);
        })
        .catch(e => {
          console.log(e);
        });
      this.$refs.image.show();
    },
  },
};
</script>
<style>
.btn-sm-flat {
  padding-top: 0 !important;
  padding-bottom: 0px !important;
}
</style>
