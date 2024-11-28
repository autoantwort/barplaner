<template>
  <div class="input-group">
    <input
      ref="input"
      type="number"
      id="unit"
      class="form-control"
      aria-label="Text input with dropdown button"
      v-model="object.amount"
      v-on:keyup.enter="$emit('enter')"
      min="0"
    />
    <DropdownSelect v-model="object.unit" :options="['Units', 'ml', 'gramm']" />
  </div>
</template>

<script>
export default {
  name: 'content-input',
  props: {
    object: {
      type: Object,
    },
  },
  methods: {
    isValid() {
      return this.$refs.input.checkValidity();
    },
  },
};
</script>
<style></style>
