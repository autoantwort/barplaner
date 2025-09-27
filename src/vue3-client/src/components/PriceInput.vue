<template>
  <div class="mb-3 was-validated" v-show="showBrotto">
    <label for class="form-label">Preis (Netto: ohne Steuern, Brotto: mit Steuern)</label>
    <div class="input-group" v-show="showNetto">
      <div class="input-group-text" style="min-width: 71px">Netto</div>
      <div class="input-group-text">{{ Math.abs(change) }} ×</div>
      <input type="number" class="form-control text-end" step="0.01" placeholder="Einzelpreis    " lang="de-DE" :value="internalEinzelNetto"
        @input="onNewEinzelNetto" min="0" :disabled="priceInputDisabled" @keypress="onlyNumbers" :required="showNetto" />

      <div class="input-group-text">=</div>

      <input type="number" class="form-control text-end" step="0.01" placeholder="Gesamtpreis    " lang="de-DE" :value="internalGesamtNetto" min="0"
        @input="onNewGesamtNetto" :disabled="priceInputDisabled" @keypress="onlyNumbers" :required="showNetto" />

      <div class="input-group-text">€</div>
    </div>

    <div class="input-group my-2" v-show="showNetto">
      <div class="input-group-text px-sm">Steuersatz:</div>
      <div class="input-group-text px-sm">
        <input type="radio" id="0%" value="0" name="tax" v-model="tax" :disabled="change === null" />
        <label style="margin-bottom: 0px; padding-left: 4px" for="0%">0%</label>
      </div>
      <div class="input-group-text px-sm">
        <input type="radio" id="7%" value="7" name="tax" v-model="tax" :disabled="change === null" />
        <label style="margin-bottom: 0px; padding-left: 4px" for="7%">7%</label>
      </div>
      <div class="input-group-text px-sm">
        <input type="radio" id="19%" value="19" name="tax" v-model="tax" :disabled="change === null" />
        <label style="margin-bottom: 0px; padding-left: 4px" for="19%">19%</label>
      </div>
      <div class="input-group-text px-sm">
        <input type="radio" id="own" value="own" name="tax" v-model="tax" :disabled="change === null" />
      </div>
      <input type="text" step="any" class="form-control px-1" :required="tax === 'own' ? true : null" v-model.number="ownTax" min="0" max="1000"
        @keypress="onlyNumbers" @click="setTaxToOwn" :placeholder="taxPlaceholder" :disabled="change === null" />

      <div class="input-group-text px-sm">%</div>
    </div>

    <div class="input-group">
      <div class="input-group-text">Brotto</div>
      <div class="input-group-text">{{ Math.abs(change) }} ×</div>
      <input type="number" class="form-control text-end" step="0.01" placeholder="Einzelpreis    " :value="internalEinzelBrotto" lang="de-DE"
        @input="onNewEinzelBrotto" min="0" :disabled="priceInputDisabled" @keypress="onlyNumbers" :required="showBrotto" />
      <div class="input-group-text">=</div>
      <input type="number" class="form-control text-end" step="0.01" placeholder="Gesamtpreis    " lang="de-DE" :value="internalGesamtBrotto" min="0"
        @input="onNewGesamtBrotto" :disabled="priceInputDisabled" @keypress="onlyNumbers" :required="showBrotto" />
      <div class="input-group-text">€</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PriceInput',
  props: {
    showBrotto: {
      type: Boolean,
      default: false
    },
    showNetto: {
      type: Boolean,
      default: false
    },
    change: {
      type: Number,
      default: null
    },
    einzelNetto: {
      type: Number,
      default: null
    },
    einzelBrotto: {
      type: Number,
      default: null
    },
    initialTax: {
      type: [String, Number],
      default: 19
    },
    initialOwnTax: {
      type: Number,
      default: null
    },
    priceInputDisabled: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'update:einzelNetto',
    'update:einzelBrotto'
  ],
  data() {
    return {
      internalEinzelNetto: this.einzelNetto,
      internalGesamtNetto: null,
      internalEinzelBrotto: this.einzelBrotto,
      internalGesamtBrotto: null,
      tax: this.initialTax,
      ownTax: this.initialOwnTax,
      priceFrom: null,
      taxPlaceholder: 'Eigener'
    };
  },
  computed: {
    realTax() {
      if (this.tax !== null && (this.tax !== 'own' || this.ownTax !== null)) {
        return this.tax === 'own' ? this.ownTax : Number(this.tax);
      }
      return -1;
    }
  },
  watch: {
    einzelNetto(newVal) {
      this.internalEinzelNetto = newVal;
    },
    einzelBrotto(newVal) {
      this.internalEinzelBrotto = newVal;
    },
    change() {
      this.recalculateFromPriceSource();
    },
    realTax() {
      if (this.realTax >= 0 && this.priceFrom) {
        if (this.priceFrom.endsWith('Brotto')) {
          this.updateNetto();
        } else if (this.priceFrom.endsWith('Netto')) {
          this.updateBrotto();
        }
      }
    }
  },
  expose: ['clearPrices'],
  methods: {
    round(v) {
      return Math.round(v * 100) / 100;
    },
    onlyNumbers(evt) {
      const charCode = evt.which ? evt.which : evt.keyCode;
      const CHAR_CODE_COMMA = 44;
      const CHAR_CODE_DOT = 46;
      if (charCode === CHAR_CODE_DOT || charCode === CHAR_CODE_COMMA) {
        if (evt.target.value.indexOf(',') !== -1 || evt.target.value.indexOf('.') !== -1) {
          evt.preventDefault();
        }
        return;
      }
      if ((charCode < 48 || charCode > 57) && charCode !== CHAR_CODE_DOT && charCode !== CHAR_CODE_COMMA) {
        evt.preventDefault();
      }
    },
    recalculateFromPriceSource() {
      if (!this.change) return;

      if (this.priceFrom === 'einzelBrotto') {
        this.internalGesamtBrotto = this.internalEinzelBrotto * Math.abs(this.change);
        this.updateNetto();
      } else if (this.priceFrom === 'gesamtBrotto') {
        this.internalEinzelBrotto = this.round(this.internalGesamtBrotto / Math.abs(this.change));
        this.updateNetto();
      } else if (this.priceFrom === 'einzelNetto') {
        this.internalGesamtNetto = this.internalEinzelNetto * Math.abs(this.change);
        this.updateBrotto();
      } else if (this.priceFrom === 'gesamtNetto') {
        this.internalEinzelNetto = this.round(this.internalGesamtNetto / Math.abs(this.change));
        this.updateBrotto();
      }
    },
    onNewEinzelNetto(event) {
      this.internalEinzelNetto = parseFloat(event.target.value) || null;
      if (this.change && this.internalEinzelNetto) {
        this.internalGesamtNetto = this.internalEinzelNetto * Math.abs(this.change);
      }
      this.updateBrotto();
      this.priceFrom = 'einzelNetto';
      this.$emit('update:einzelNetto', this.internalEinzelNetto);
    },
    onNewGesamtNetto(event) {
      this.internalGesamtNetto = parseFloat(event.target.value) || null;
      if (this.change && this.internalGesamtNetto) {
        this.internalEinzelNetto = this.round(this.internalGesamtNetto / Math.abs(this.change));
      }
      this.updateBrotto();
      this.priceFrom = 'gesamtNetto';
      this.$emit('update:einzelNetto', this.internalEinzelNetto);
    },
    onNewEinzelBrotto(event) {
      this.internalEinzelBrotto = parseFloat(event.target.value) || null;
      if (this.change && this.internalEinzelBrotto) {
        this.internalGesamtBrotto = this.internalEinzelBrotto * Math.abs(this.change);
      }
      this.updateNetto();
      this.priceFrom = 'einzelBrotto';
      this.$emit('update:einzelBrotto', this.internalEinzelBrotto);
    },
    onNewGesamtBrotto(event) {
      this.internalGesamtBrotto = parseFloat(event.target.value) || null;
      if (this.change && this.internalGesamtBrotto) {
        this.internalEinzelBrotto = this.round(this.internalGesamtBrotto / Math.abs(this.change));
      }
      this.updateNetto();
      this.priceFrom = 'gesamtBrotto';
      this.$emit('update:einzelBrotto', this.internalEinzelBrotto);
    },
    updateBrotto() {
      const tax = this.realTax;
      if (tax >= 0 && this.internalEinzelNetto && this.internalGesamtNetto) {
        this.internalEinzelBrotto = this.round(this.internalEinzelNetto * (1 + tax / 100));
        this.internalGesamtBrotto = this.round(this.internalGesamtNetto * (1 + tax / 100));
        this.$emit('update:einzelBrotto', this.internalEinzelBrotto);
      } else if (this.internalGesamtBrotto && this.internalGesamtNetto) {
        this.taxPlaceholder = this.round((this.internalGesamtBrotto / this.internalGesamtNetto - 1) * 100);
      }
    },
    updateNetto() {
      const tax = this.realTax;
      if (tax >= 0 && this.internalEinzelBrotto && this.internalGesamtBrotto) {
        this.internalEinzelNetto = this.round(this.internalEinzelBrotto * (100 / (100 + tax)));
        this.internalGesamtNetto = this.round(this.internalGesamtBrotto * (100 / (100 + tax)));
        this.$emit('update:einzelNetto', this.internalEinzelNetto);
      } else if (this.internalGesamtNetto && this.internalGesamtBrotto) {
        this.taxPlaceholder = this.round((this.internalGesamtBrotto / this.internalGesamtNetto - 1) * 100);
      }
    },
    setTaxToOwn() {
      this.tax = 'own';
    },
    clearPrices() {
      this.internalEinzelNetto = null;
      this.internalGesamtNetto = null;
      this.internalEinzelBrotto = null;
      this.internalGesamtBrotto = null;
      this.priceFrom = null;
      this.tax = this.initialTax;
      this.ownTax = this.initialOwnTax;
      this.taxPlaceholder = 'Eigener';

      this.$emit('update:einzelNetto', null);
      this.$emit('update:einzelBrotto', null);
    },
  }
}
</script>

<style scoped>
/* for very smal mobile phones  */
@media (max-width: 400px) {
  .px-sm {
    padding-left: 0.25rem !important;
    padding-right: 0.25rem !important;
  }
}

@media (min-width: 400px) and (max-width: 440px) {
  .px-sm {
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
}
</style>