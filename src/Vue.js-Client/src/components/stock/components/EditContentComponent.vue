<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <label>{{ object.amount }} {{ object.unit }}</label>
    <template v-slot:edit>
      <content-input ref="input" :object="content" v-on:enter="$refs.edit.save" />
    </template>
  </edit-component>
</template>


<script>
import EditComponent from "./EditComponent";
import ContentInput from "./ContentInput";
import http from "../../../http-common";

export default {
  name: "edit-content-component",
  components: {
    EditComponent,
    ContentInput,
  },
  props: {
    object: {
      type: Object,
    },
  },
  data() {
    return {
      content: {
        amount: null,
        unit: null,
      },
    };
  },
  methods: {
    save() {
      if (!this.$refs.input.isValid()) {
        return false;
      }
      const isNotNull = this.content.amount !== null;
      const amount = isNotNull ? this.content.amount : null;
      const unit = isNotNull ? this.content.unit : null;
      http
        .put("/item/" + this.object.id, { amount, unit })
        .then((response) => {
          this.object.amount = response.data.amount;
          this.object.unit = response.data.unit;
        })
        .catch(alert);
    },
    edit() {
      this.content.amount = this.object.amount;
      this.content.unit = this.object.unit || "Units";
    },
  },
};
</script>
<style>
</style>
