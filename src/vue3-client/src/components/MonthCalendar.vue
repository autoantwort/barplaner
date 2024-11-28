<template>
  <div class="cal-month">
    <button class="btn cal-btn" type="button" @click.prevent="previousMonth">
      <i-fa-arrow-left />
    </button>
    <strong class="cal-month-name">{{ monthName }} {{ year }}</strong>
    <button class="btn cal-btn" type="button" @click.prevent="nextMonth">
      <i-fa-arrow-right />
    </button>
  </div>
  <div class="cal-weekdays text-body-secondary">
    <div class="cal-weekday">Mon</div>
    <div class="cal-weekday">Tue</div>
    <div class="cal-weekday">Wed</div>
    <div class="cal-weekday">Thu</div>
    <div class="cal-weekday">Fri</div>
    <div class="cal-weekday">Sat</div>
    <div class="cal-weekday">Sun</div>
  </div>
  <div class="cal-days">
    <button v-for="day in dates" class="btn cal-btn" :disabled="canSelectDate ? canSelectDate(day) : false" type="button" @click.prevent="selectValue(day)">
      {{ day.getUTCDate() }}
    </button>
  </div>
</template>

<script>
function createArray(end, length) {
  return Array.from({ length: length }, (_, i) => end - length + i + 1);
}

export default {
  props: ['modelValue', 'options', 'canSelectDate'],
  emits: ['update:modelValue'],
  data() {
    return {
      year: null,
      month: null,
    };
  },
  computed: {
    dates: function () {
      let neededDaysBefore = new Date(this.year, this.month, 1).getDay();
      neededDaysBefore = neededDaysBefore === 0 ? 6 : neededDaysBefore - 1;
      const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
      const daysInMonthBefore = new Date(this.year, this.month, 0).getDate();
      return createArray(daysInMonthBefore, neededDaysBefore)
        .map(day => new Date(Date.UTC(this.year, this.month - 1, day)))
        .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => new Date(Date.UTC(this.year, this.month, day))));
    },
    monthName: function () {
      return new Date(this.year, this.month).toLocaleString('default', { month: 'long' });
    },
  },
  methods: {
    selectValue(value) {
      this.$emit('update:modelValue', value);
    },
    previousMonth() {
      if (this.month === 0) {
        this.year -= 1;
        this.month = 11;
      } else {
        this.month -= 1;
      }
    },
    nextMonth() {
      if (this.month === 11) {
        this.year += 1;
        this.month = 0;
      } else {
        this.month += 1;
      }
    },
  },
  mounted() {
    console.log('canSelectDate', this.canSelectDate);
    if (this.modelValue) {
      this.year = this.modelValue.getFullYear();
      this.month = this.modelValue.getMonth();
    } else {
      const now = new Date();
      this.year = now.getFullYear();
      this.month = now.getMonth();
    }
    console.log('year', this.year, 'month', this.month);
  },
};
</script>
<style scoped>
/* Code from https://getbootstrap.com/docs/5.3/examples/dropdowns/ */
.cal-month,
.cal-days,
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  align-items: center;
}

.cal-month-name {
  grid-column-start: 2;
  grid-column-end: 7;
  text-align: center;
}

.cal-weekday,
.cal-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 3rem;
  padding: 0;
}

.cal-btn:not([disabled]) {
  font-weight: 500;
  color: var(--bs-emphasis-color);
}

.cal-btn:hover,
.cal-btn:focus {
  background-color: var(--bs-secondary-bg);
}

.cal-btn[selected] {
  color: var(--bs-body-bg);
  background-color: var(--bs-primary);
}

.cal-btn[disabled] {
  border: 0;
  opacity: 0.5;
}
</style>
