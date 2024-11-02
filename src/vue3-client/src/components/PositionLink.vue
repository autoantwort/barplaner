<template>
  <div style="display: contents" v-if="hasPosition">
    <router-link :to="{ name: 'position', params: { positionId: position.id, position } }">
      {{ position.name }}
    </router-link>
    <button v-if="position.imageId !== null" class="ml-2 btn btn-sm btn-sm-flat btn-secondary" type="button" v-on:click="openModal()">
      <i-fa-image />
    </button>
    <b-modal ref="modal" hide-footer no-fade centered :title="position.name">
      <positionImage :position="position"></positionImage>
    </b-modal>
  </div>
</template>

<script>
import PositionImage from '@/components/PositionImage.vue';

export default {
  props: ['item'],
  computed: {
    hasPosition() {
      return this.item.stockPosition || (this.item.itemGroup && this.item.itemGroup.stockPosition);
    },
    position() {
      return this.item.stockPosition || this.item.itemGroup.stockPosition;
    },
  },
  components: {
    PositionImage,
  },
  methods: {
    openModal() {
      this.$refs.modal.show();
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
