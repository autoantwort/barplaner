<template>
  <button type="button" aria-haspopup="dialog" aria-expanded="false" class="btn border btn-border-dark" @click="isOpen = !isOpen" style="min-width: 230px">
    <i-fa-calendar-day class="cal-icon" />
    <span class="text-secondary ps-2">{{ modelValue ? formatDate(modelValue) : 'Jump to date' }}</span>
  </button>
  <div class="dropdown-menu dropdown-menu-end p-2 mx-0 shadow rounded-3 w-340px" :class="{ show: isOpen }">
    <MonthCalendar :modelValue="modelValue" @update:modelValue="dateSelected" :options="options" :canSelectDate="canSelectDate"></MonthCalendar>
  </div>
</template>

<script>
const dateFormat = Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
export default {
  props: ['modelValue', 'options', 'canSelectDate'],
  emits: ['update:modelValue'],
  data() {
    return {
      isOpen: false,
    };
  },
  computed: {},
  methods: {
    dateSelected(value) {
      this.$emit('update:modelValue', value);
      this.isOpen = false;
    },
    handleClickOutside(event) {
      if (!event.target.closest('.input-group')) {
        this.isOpen = false;
      }
    },
    formatDate(date) {
      return dateFormat.format(date);
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
<style>
.dropdown-menu {
  position: absolute;
  top: 100%;
  margin-top: 0.125rem;
  z-index: 1000;
}

.dropdown-menu.show {
  display: block;
}

.w-340px {
  width: 340px;
}

.btn-border-dark {
  border-color: var(--bs-border-color);
}

.btn-border-dark:hover {
  background-color: var(--bs-border-color);
}

.cal-icon {
  vertical-align: -0.2em;
  width: 1.24em;
  height: 1.25em;
}
</style>
