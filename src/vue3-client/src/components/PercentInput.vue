<template>
  <div class="input-group">
    <input ref="input" type="number" min="0" max="100" step="0.1" class="form-control" :value="value" v-on:input="onInput" v-on:keyup.enter="onEnter" />
    <div class="input-group-append">
      <span class="input-group-text">%</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'percent-input',
  props: ['value'],
  methods: {
    onInput(e) {
      this.$emit('input', e.target.value.trim());
    },
    onEnter() {
      if (this.$refs.input.checkValidity()) {
        this.$emit('enter');
      }
    },
    isValid() {
      return this.$refs.input.checkValidity();
    },
  },
};
</script>
<style></style>
