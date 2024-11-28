<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <label style="white-space: pre-line">{{ object[property] }}</label>
    <template v-slot:edit>
      <textarea class="form-control" ref="input" v-on:keyup.enter="enterPressed" spellcheck="true" rows="5" />
    </template>
  </edit-component>
</template>

<script>
import http from '@/http-common';
import EditComponent from './EditComponent.vue';

export default {
  name: 'edit-textarea-component',
  components: {
    EditComponent,
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
  methods: {
    enterPressed(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        this.$refs.edit.save();
      }
    },
    save() {
      const obj = {};
      const value = this.$refs.input.value;
      obj[this.property] = value && value.length > 0 ? value : null;
      http
        .put(this.endpoint.replace(':id', this.object.id), obj)
        .then(response => {
          this.object[this.property] = response.data[this.property];
        })
        .catch(e => {
          alert(e);
        });
    },
    edit() {
      this.$refs.input.value = this.object[this.property];
    },
  },
};
</script>
<style></style>
