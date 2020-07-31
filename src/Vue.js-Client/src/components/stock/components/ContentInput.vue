<template>
  <div class="input-group">
    <input
      type="number"
      id="unit"
      class="form-control"
      aria-label="Text input with dropdown button"
      v-model="object.amount"
      v-on:keyup.enter="$emit('enter')"
      min="0"
    />
    <div class="input-group-append">
      <b-dropdown v-bind:text="object.unit" v-model="object.unit">
        <b-dropdown-item v-on:click="object.unit='Units'">Units</b-dropdown-item>
        <b-dropdown-item v-on:click="object.unit='ml'">ml</b-dropdown-item>
        <b-dropdown-item v-on:click="object.unit='gramm'">gramm</b-dropdown-item>
      </b-dropdown>
    </div>
  </div>
</template>

<script>
export default {
  name: "content-input",
  props: {
    object: {
      type: Object,
    },
  },
};
</script>
<style>
</style>
