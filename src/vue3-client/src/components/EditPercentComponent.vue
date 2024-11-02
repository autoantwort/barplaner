<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <label v-if="Number.isFinite(object[property])">{{ object[property] }} %</label>
    <template v-slot:edit>
      <percent-input ref="input" v-model="value" v-on:enter="$refs.edit.save" />
    </template>
  </edit-component>
</template>

<script>
import EditComponent from './EditComponent.vue';
import PercentInput from './PercentInput.vue';
import http from '@/http-common';

export default {
  name: 'edit-percent-component',
  components: {
    EditComponent,
    PercentInput,
  },
  props: {
    object: {
      type: Object,
    },
    property: {
      type: String,
    },
    endpoint: {
      type: String,
    },
  },
  data() {
    return {
      value: null,
    };
  },
  methods: {
    save() {
      if (!this.$refs.input.isValid()) {
        return false;
      }
      http
        .put(this.endpoint.replace(':id', this.object.id), {
          [this.property]: this.value,
        })
        .then(response => {
          this.object[this.property] = response.data[this.property];
        })
        .catch(alert);
    },
    edit() {
      this.value = this.object[this.property];
    },
  },
};
</script>
<style></style>
