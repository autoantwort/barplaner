<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <span>
      <template v-if="showNetto">{{ $filters.asEuro(object.netPrice) }} / </template>
      <template v-if="showBrotto">{{ $filters.asEuro(object.brottoPrice) }}</template>
      <template v-if="object.priceAccuracy"> ({{ germanAccuracy(object.priceAccuracy) }})</template>
    </span>
    <template v-slot:edit>
      <price-accuracy-input v-if="showNetto" v-model="priceAccuracy" input-name="pA_edit" />
      <price-input
        ref="priceInput"
        :showBrotto="showBrotto"
        :showNetto="showNetto"
        :change="Math.abs(object.amount)"
        :initialTax="computedInitialTax"
        v-model:einzelNetto="einzelNetto"
        v-model:einzelBrotto="einzelBrotto"
        :priceInputDisabled="priceAccuracy === 'unknown'"
      />
    </template>
  </edit-component>
</template>

<script>
import http from '@/http-common';
import EditComponent from './EditComponent.vue';
import PriceInput from './PriceInput.vue';
import PriceAccuracyInput from './PriceAccuracyInput.vue';

const ACCURACY_LABELS = {
  unknown: 'Unbekannt',
  estimated: 'Geschätzt',
  fromBill: 'Von der Rechnung',
  researched: 'Recherchiert',
  fromPreviousBill: 'Von vorheriger Rechnung',
};

export default {
  name: 'edit-price-component',
  components: { EditComponent, PriceInput, PriceAccuracyInput },
  props: {
    object: {
      type: Object,
    },
  },
  data() {
    return {
      priceAccuracy: null,
      einzelNetto: this.object?.netPrice ?? null,
      einzelBrotto: this.object?.brottoPrice ?? null,
    };
  },
  computed: {
    showNetto() {
      return this.object.reason === 'bought';
    },
    showBrotto() {
      return this.object.reason === 'bought' || this.object.reason === 'sold';
    },
    computedInitialTax() {
      if (this.object.netPrice && this.object.brottoPrice) {
        const rate = Math.round((this.object.brottoPrice / this.object.netPrice - 1) * 100);
        if ([0, 7, 19].includes(rate)) return rate;
      }
      return 19;
    },
  },
  methods: {
    germanAccuracy(v) {
      return ACCURACY_LABELS[v] ?? v;
    },
    edit() {
      this.priceAccuracy = this.object.priceAccuracy;
      this.einzelNetto = this.object.netPrice;
      this.einzelBrotto = this.object.brottoPrice;
    },
    async save() {
      const change = {};
      if (this.showNetto) {
        change.priceAccuracy = this.priceAccuracy;
        change.netPrice = this.priceAccuracy === 'unknown' ? null : this.einzelNetto;
        change.brottoPrice = this.priceAccuracy === 'unknown' ? null : this.einzelBrotto;
      } else {
        change.brottoPrice = this.einzelBrotto;
      }
      try {
        const response = await http.put('/stockChange/' + this.object.id, {
          change,
          note: 'price updated',
        });
        this.object.netPrice = response.data.netPrice;
        this.object.brottoPrice = response.data.brottoPrice;
        this.object.priceAccuracy = response.data.priceAccuracy;
        return true;
      } catch (e) {
        alert(e);
        return false;
      }
    },
  },
};
</script>
