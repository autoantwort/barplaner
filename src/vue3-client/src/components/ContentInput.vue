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
    <button class="btn btn-secondary dropdown-toggle" type="button" @click="isOpen = !isOpen">
      {{ object.unit }}
    </button>
    <ul class="dropdown-menu dropdown-menu-end" :class="{ show: isOpen }">
      <li><a class="dropdown-item" href="#" @click.prevent="selectUnit('Units')">Units</a></li>
      <li><a class="dropdown-item" href="#" @click.prevent="selectUnit('ml')">ml</a></li>
      <li><a class="dropdown-item" href="#" @click.prevent="selectUnit('gramm')">Gramm</a></li>
    </ul>
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
  data() {
    return {
      isOpen: false,
    };
  },
  methods: {
    handleClickOutside(event) {
      if (!event.target.closest('.input-group')) {
        this.isOpen = false;
      }
    },
    selectUnit(unit) {
      this.object.unit = unit;
      this.isOpen = false;
    },
    isValid() {
      return this.$refs.input.checkValidity();
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
};
</script>
<style scoped>
.input-group {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.125rem;
  z-index: 1000;
}

.dropdown-menu.show {
  display: block;
}
</style>
