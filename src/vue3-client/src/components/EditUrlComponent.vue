<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <label>
      <a v-if="object[property]" :href="object[property]" target="_blank">Website</a>
    </label>
    <template v-slot:edit>
      <input class="form-control" ref="input" type="url" v-on:keyup.enter="$refs.edit.save" />
    </template>
  </edit-component>
</template>

<script>
import http from '@/http-common';
import EditComponent from './EditComponent.vue';

export default {
  name: 'edit-url-component',
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
  },
  methods: {
    save() {
      let value = this.$refs.input.value;
      const startRight = value.length === 0 || value.startsWith('http://') || value.startsWith('https://');
      if (this.$refs.input.checkValidity() && startRight) {
        const obj = {};
        const value = this.$refs.input.value;
        obj[this.property] = value && value.length > 0 ? value : null;
        http
          .put('/item/' + this.object.id, obj)
          .then(response => {
            this.object[this.property] = response.data[this.property];
          })
          .catch(e => {
            alert(e);
          });
        return true;
      } else if (!startRight) {
        this.$refs.input.value = 'https://' + value;
      }
      return false;
    },
    edit() {
      this.$refs.input.value = this.object[this.property];
    },
  },
};
</script>
<style></style>
