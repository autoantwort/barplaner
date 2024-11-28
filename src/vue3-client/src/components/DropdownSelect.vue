<template>
  <button class="btn btn-secondary dropdown-toggle" type="button" @click="isOpen = !isOpen">
    {{ modelValue }}
  </button>
  <ul class="dropdown-menu dropdown-menu-end" :class="{ show: isOpen }">
    <li v-for="option in options">
      <a class="dropdown-item" href="#" @click.prevent="selectValue(option)">{{ option }}</a>
    </li>
  </ul>
</template>

<script>
export default {
  props: ['modelValue', 'options'],
  emits: ['update:modelValue'],
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
    selectValue(value) {
      this.$emit('update:modelValue', value);
      this.isOpen = false;
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
