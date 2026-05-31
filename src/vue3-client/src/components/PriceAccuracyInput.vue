<template>
  <div>
    <label class="form-label">Preisgenauigkeit</label>
    <div class="form-check mb-2" v-for="opt in options" :key="opt.value">
      <input
        class="form-check-input"
        type="radio"
        :name="inputName"
        :id="inputName + '_' + opt.value"
        :value="opt.value"
        :checked="modelValue === opt.value"
        @change="$emit('update:modelValue', opt.value)"
        required
      />
      <label class="form-check-label" :for="inputName + '_' + opt.value">
        <strong>{{ opt.label }}:</strong> {{ opt.description }}
      </label>
    </div>
    <div v-if="modelValue === null" class="invalid-feedback" style="display: block">Please select a price accuracy.</div>
  </div>
</template>

<script>
export default {
  name: 'price-accuracy-input',
  props: {
    modelValue: {
      type: String,
      default: null,
    },
    inputName: {
      type: String,
      default: 'priceAccuracy',
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      options: [
        { value: 'unknown',          label: 'Unbekannt',              description: 'Der Preis ist nicht bekannt (Aber es gab wahrscheinlich einen und es war keine Spende)' },
        { value: 'estimated',        label: 'Geschätzt',              description: 'Der Preis ist geschätzt, so teuer sollte der Artikel ungefähr sein' },
        { value: 'fromBill',         label: 'Von der Rechnung',       description: 'Der Preis ist wie auf der Rechnung' },
        { value: 'researched',       label: 'Recherchiert',           description: 'Der Preis wurde recherchiert. Es kann aber sein, dass der Preis anders oder es ein Sonderangebot war' },
        { value: 'fromPreviousBill', label: 'Von vorheriger Rechnung', description: 'Der Preis von einer vorherigen Rechnung, wurde nicht neu nachgeschaut, könnte sich aber geändert haben' },
      ],
    };
  },
};
</script>
