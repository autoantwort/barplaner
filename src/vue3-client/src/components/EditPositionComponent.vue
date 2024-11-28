<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <template v-if="object.stockPosition">
      <router-link :to="{ name: 'position', params: { positionId: object.stockPosition.id, position: object.stockPosition } }">{{
        object.stockPosition.name
      }}</router-link>
      <button
        v-if="object.stockPosition.imageId !== null"
        class="ms-2 btn btn-sm btn-sm-flat btn-secondary"
        type="button"
        v-on:click="openModal(object.stockPosition)"
      >
        <i-fa-image />
      </button>
    </template>
    <template v-else-if="object.itemGroup && object.itemGroup.stockPosition">
      <router-link
        :to="{
          name: 'position',
          params: { positionId: object.itemGroup.stockPosition.id, position: object.itemGroup.stockPosition },
        }"
        >{{ object.itemGroup.stockPosition.name }}</router-link
      >
      <button
        v-if="object.itemGroup.stockPosition.imageId !== null"
        class="ms-2 btn btn-sm btn-sm-flat btn-secondary"
        type="button"
        v-on:click="openModal(object.itemGroup.stockPosition)"
      >
        <i-fa-image />
      </button>
    </template>
    <span v-else>None</span>
    <b-modal ref="modal" hide-footer no-fade centered :title="selectedPosition && selectedPosition.name">
      <positionImage :position="selectedPosition"></positionImage>
    </b-modal>
    <template v-slot:edit>
      <position-card ref="input" :usedForItem="usedForItem" />
    </template>
  </edit-component>
</template>

<script>
import http from '@/http-common';
import EditComponent from './EditComponent.vue';
import PositionCard from './PositionCard.vue';
import PositionImage from '@/components/PositionImage.vue';

export default {
  name: 'edit-position-component',
  components: {
    EditComponent,
    PositionCard,
    PositionImage,
  },
  props: {
    object: {
      type: Object,
    },
    endpoint: {
      type: String,
    },
    usedForItem: {
      // true => item, false => item group
      type: Boolean,
    },
  },
  data() {
    return {
      selectedPosition: null,
    };
  },
  methods: {
    openModal(position) {
      this.selectedPosition = position;
      this.$refs.modal.show();
    },
    async save() {
      const result = await this.$refs.input.savePosition();
      if (typeof result === 'number' || result === null) {
        http
          .put(this.endpoint.replace(':id', this.object.id), {
            stockPositionId: result,
          })
          .then(response => {
            // copy object
            for (const i in response.data) {
              this.object[i] = response.data[i];
            }
          })
          .catch(alert);
      } else {
        alert(result);
      }
    },
    edit() {
      this.$refs.input.setPosition(this.object.stockPosition);
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
