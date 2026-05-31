<template>
  <div style="overflow-x: auto">
    <svg :width="totalWidth" :height="totalHeight" style="display: block; font-family: inherit">
      <!-- Y-axis grid lines and labels -->
      <g v-for="tick in yTicks" :key="tick.value">
        <line :x1="PL" :y1="tick.y" :x2="totalWidth - PR" :y2="tick.y" stroke="#dee2e6" stroke-width="1" />
        <text :x="PL - 5" :y="tick.y" text-anchor="end" dominant-baseline="middle" font-size="11" fill="#6c757d">
          {{ tick.value }}
        </text>
      </g>

      <!-- X-axis baseline -->
      <line :x1="PL" :y1="chartBottom" :x2="totalWidth - PR" :y2="chartBottom" stroke="#adb5bd" stroke-width="1" />

      <!-- Month bars and labels -->
      <g v-for="(month, i) in months" :key="month.key">
        <rect v-if="month.total > 0"
          :x="barX(i, 0)" :y="barY(month.total)" :width="BAR_W" :height="barH(month.total)"
          fill="#227179" rx="2">
          <title>{{ month.label }}: {{ month.total }} total</title>
        </rect>
        <rect v-if="month.duringBar > 0"
          :x="barX(i, 1)" :y="barY(month.duringBar)" :width="BAR_W" :height="barH(month.duringBar)"
          fill="#5cb8be" rx="2">
          <title>{{ month.label }}: {{ month.duringBar }} during bar</title>
        </rect>
        <text
          :transform="`translate(${groupCenterX(i)}, ${chartBottom + 7}) rotate(-45)`"
          text-anchor="end" font-size="10" fill="#6c757d">
          {{ month.label }}
        </text>
      </g>

      <!-- Legend -->
      <rect :x="PL" :y="totalHeight - 16" width="12" height="12" fill="#227179" rx="2" />
      <text :x="PL + 15" :y="totalHeight - 10" font-size="11" fill="#495057" dominant-baseline="middle">Total</text>
      <rect :x="PL + 65" :y="totalHeight - 16" width="12" height="12" fill="#5cb8be" rx="2" />
      <text :x="PL + 80" :y="totalHeight - 10" font-size="11" fill="#495057" dominant-baseline="middle">During Bar</text>
    </svg>
  </div>
</template>

<script>
import { REASON } from '@common/stockChangeReasons.js';

const PL = 42;   // padding left
const PR = 10;   // padding right
const PT = 10;   // padding top
const PB = 50;   // padding bottom (labels + legend)
const CH = 80;  // chart height
const GW = 18;   // group width per month
const BAR_W = 6;
const BAR_GAP = 2;
const MARGIN = 2; // (MARGIN + BAR_W + BAR_GAP + BAR_W + MARGIN = GW)

const BAR_REASONS = new Set([REASON.CONSUMED_DURING_BAR, REASON.CORRECTED_CONSUMPTION_DURING_BAR]);
const POSITIVE_REASONS = new Set([REASON.CORRECTED_CONSUMPTION_DURING_BAR, REASON.CORRECTED_RENTAL_CONSUMPTION, REASON.STOCK_CORRECTION]);

const MONTHS_DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export default {
  name: 'consumption-chart',
  props: {
    stockChanges: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return { PL, PR, PT, PB, CH, GW, BAR_W };
  },
  computed: {
    months() {
      const now = new Date();
      const start = new Date(now.getFullYear() - 2, now.getMonth(), 1);
      const map = {};

      // Build ordered month keys for the last 24 months
      const cur = new Date(start);
      while (cur.getFullYear() < now.getFullYear() || cur.getMonth() <= now.getMonth()) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
        const label = `${MONTHS_DE[cur.getMonth()]} ${String(cur.getFullYear()).slice(2)}`;
        map[key] = { key, label, total: 0, duringBar: 0 };
        cur.setMonth(cur.getMonth() + 1);
      }

      for (const change of this.stockChanges) {
        const date = change.date instanceof Date ? change.date : new Date(change.date);
        if (date < start) continue;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!map[key]) continue;

        if (change.amount < 0 || POSITIVE_REASONS.has(change.reason)) {
          map[key].total = Math.max(0, map[key].total - change.amount);
        }
        if (BAR_REASONS.has(change.reason)) {
          map[key].duringBar = Math.max(0, map[key].duringBar - change.amount);
        }
      }

      return Object.values(map).reverse();
    },
    maxValue() {
      return Math.max(1, ...this.months.map(m => Math.max(m.total, m.duringBar)));
    },
    scale() {
      return CH / this.maxValue;
    },
    yTicks() {
      const max = this.maxValue;
      const targetCount = 5;
      let step = Math.ceil(max / targetCount);
      const mag = Math.pow(10, Math.floor(Math.log10(step) || 0));
      step = Math.ceil(step / mag) * mag;
      const ticks = [];
      for (let v = 0; v <= max + step * 0.5; v += step) {
        const y = this.chartBottom - v * this.scale;
        if (y >= PT - 5) ticks.push({ value: v, y });
      }
      return ticks;
    },
    chartBottom() {
      return PT + CH;
    },
    totalWidth() {
      return PL + this.months.length * GW + PR;
    },
    totalHeight() {
      return PT + CH + PB;
    },
  },
  methods: {
    barX(groupIndex, barIndex) {
      return PL + groupIndex * GW + MARGIN + barIndex * (BAR_W + BAR_GAP);
    },
    barY(value) {
      return this.chartBottom - value * this.scale;
    },
    barH(value) {
      return Math.max(1, value * this.scale);
    },
    groupCenterX(groupIndex) {
      return PL + groupIndex * GW + GW / 2 + BAR_W;
    },
  },
};
</script>
