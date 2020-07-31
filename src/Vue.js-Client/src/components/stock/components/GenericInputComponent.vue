<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <label>{{object[property]}}</label>
    <template v-slot:edit>
      <input
        :type="type"
        class="form-control"
        ref="input"
        v-on:keyup.enter="$refs.edit.save"
        :required="required"
        :minLength="minLength"
        :min="min"
        :max="max"
      />
      <div class="invalid-feedback">{{errorText}}</div>
    </template>
  </edit-component>
</template>

<script>
import http from "../../../http-common";
import EditComponent from "./EditComponent";

export default {
  name: "generic-input-component",
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
    required: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "text",
    },
    minLength: {
      type: Number,
      default: null,
    },
    min: {
      type: Number,
      default: null,
    },
    max: {
      type: Number,
      default: null,
    },
  },
  computed: {
    errorText() {
      let msg = "";
      if (this.required) msg += "Required. ";
      if (this.min) msg += `Min value is ${this.min}.`;
      if (this.max) msg += `Max value is ${this.max}.`;
      if (this.minLength) msg += `Min length is ${this.minLength}.`;
      return msg;
    },
  },
  methods: {
    save() {
      if (this.$refs.input.checkValidity() === false) {
        return;
      }
      const obj = {};
      const value = this.$refs.input.value;
      obj[this.property] = value && value.length > 0 ? value : null;
      http
        .put(this.endpoint.replace(":id", this.object.id), obj)
        .then((response) => {
          this.object[this.property] = response.data[this.property];
        })
        .catch((e) => {
          alert(e);
        });
    },
    edit() {
      this.$refs.input.value = this.object[this.property];
    },
  },
};
</script>
<style>
</style>
