<template>
  <div class="dropdown" :class="{ show: isOpen }">
    <button class="btn btn-light w-100 d-flex justify-content-between align-items-center" type="button" @click="toggleDropdown">
      {{ displayValue }}
      <i-fa-caret-down />
    </button>
    <div class="dropdown-menu w-100 pt-0 shadow overflow-hidden" :class="{ show: isOpen }">
      <div class="p-2 bg-body-tertiary border-bottom">
        <input ref="search" type="text" class="form-control" placeholder="Search..." v-model="searchTerm" @input="filterOptions" />
      </div>
      <div v-if="filteredOptions.length" class="">
        <li v-for="option in filteredOptions" :key="option[valueKey]">
          <a href="#" class="dropdown-item text-wrap py-2" @click="selectOption($event, option)" :class="{ active: option === selectedOption }">
            {{ option[labelKey] }}
          </a>
        </li>
      </div>
      <div v-else class="dropdown-item text-muted text-center">No options found</div>
    </div>
  </div>
</template>

<script>
import { nextTick } from 'vue';

export default {
  name: 'SearchableSelect',

  props: {
    modelValue: {
      type: [String, Number, Object],
      default: null,
    },
    options: {
      type: Array,
      required: true,
    },
    placeholder: {
      type: String,
      default: 'Select an option',
    },
    labelKey: {
      type: String,
      default: 'text',
    },
    valueKey: {
      type: String,
      default: 'value',
    },
    filterFunction: {
      type: Function,
      default: null,
    },
  },

  data() {
    return {
      searchTerm: '',
      isOpen: false,
      localOptions: [],
    };
  },

  computed: {
    filteredOptions() {
      if (this.filterFunction) {
        return this.filterFunction(this.options, this.searchTerm);
      }
      return this.options.filter(option => String(option[this.labelKey]).toLowerCase().includes(this.searchTerm.toLowerCase()));
    },

    selectedOption() {
      if (!this.modelValue) return null;
      return this.options.find(o => o[this.valueKey] === this.modelValue[this.valueKey]);
    },

    displayValue() {
      if (this.selectedOption) {
        return this.selectedOption[this.labelKey];
      }
      return this.placeholder;
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  unmounted() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    toggleDropdown() {
      this.isOpen = !this.isOpen;
      nextTick(() => {
        if (this.isOpen) this.$refs.search.focus();
      });
    },

    filterOptions() {
      this.isOpen = true;
    },

    selectOption(event, option) {
      this.$emit('update:modelValue', option);
      this.isOpen = false;
      this.searchTerm = '';
      event.stopPropagation();
    },

    handleClickOutside(event) {
      const dropdown = event.target.closest('.dropdown');
      if (!dropdown) {
        this.isOpen = false;
      }
    },
  },
};
</script>

<style scoped>
.dropdown-menu {
  display: none;
}

.dropdown-menu.show {
  display: block;
}
</style>
