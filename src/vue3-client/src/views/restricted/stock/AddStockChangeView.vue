<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3">
        <BarcodeScanner ref="scanner" :callback="onBarcode" />
        <form ref="form">
          <div class="mb-3">
            <label class="form-label">Item</label>
            <div class="row g-2 align-items-center">
              <SearchableSelect class="border-primary col" :options="existingItems" :filterFunction="phoneticsFilter" v-model="item" />
              <button class="btn btn-success col-auto" @click="$refs.scanner.loadDevicesAndPlay()">Scan</button>
            </div>
            <div v-if="item === null" class="invalid-feedback" style="display: block">Please select an item.</div>
          </div>
          <div v-if="item">
            <ul class="pagination">
              <li class="page-item" :class="{ active: sign == '+' }">
                <span class="page-link cursor-pointer" v-on:click="
                  sign = '+';
                paginatorClicked();
                ">Hinzugabe</span>
              </li>
              <li class="page-item" :class="{ active: sign == '-' }">
                <span class="page-link cursor-pointer" v-on:click="
                  sign = '-';
                paginatorClicked();
                ">Entnahme</span>
              </li>
            </ul>
          </div>
          <div v-if="sign !== null">
            <ul class="pagination">
              <li class="page-item" v-for="i of [1, 2, 3, 4, 5, 6, 7, 8, 10, 12]" :key="i">
                <span class="page-link cursor-pointer" v-on:click="
                  change = i;
                paginatorClicked();
                ">{{ i }}</span>
              </li>
            </ul>
          </div>
          <div class="mb-3 was-validated" v-if="change !== null">
            <label for="itemGroupName" class="form-label">Lagerstandsänderung</label>
            <br />
            <div class="d-flex justify-content-between">
              <span class="ms-5">Aktueller Lagerstand:</span>
              <span style="padding-right: 48px">{{ currentItemStock }}</span>
            </div>
            <div class="input-group">
              <div class="input-group-text" style="min-width: 36px">{{ this.sign }}</div>

              <input id="change" type="number" v-on:keypress="onlyNumbers" v-on:input="onInputForChange" class="form-control text-end" step="any"
                v-model.number="change" :disabled="item === null" required title="Die Lagerstandsveränderung. Links steht ob diese positiv oder negativ ist." />
            </div>
            <div class="input-group mt-2">
              <div class="input-group-text">=</div>

              <input type="number" class="form-control text-end" v-model.number="result" v-on:keypress="onlyNumbers" v-on:input="onInputForResult" step="any"
                :min="sign === '+' ? currentItemStock + 1 : null" :max="sign === '-' ? currentItemStock - 1 : null" :disabled="item === null" required
                title="Der neue Lagerstand" />
            </div>
            <div v-if="item === null" class="invalid-feedback" style="display: block">You have to select an item to edit this fields.</div>
            <div v-show="resultError !== null" class="invalid-feedback" style="display: block">{{ resultError }}</div>
            <div v-if="result < 0" class="alert alert-info mt-2" role="alert">
              <strong>Der Lagerstand ist negativ:</strong> Keine Problem, kann vorkommen. Passiert zum Beispiel, wenn jemand vergessen hat einen Einkauf
              einzutragen. Am besten in die Gruppe schreiben und Bescheid geben.
            </div>
          </div>
          <div class="mb-3" v-if="change !== null">
            <label for="itemGroupMinCount" class="form-label">Reason</label>
            <div v-for="r in displayedReasons" class="form-check mb-2" :key="r.id">
              <input class="form-check-input" type="radio" v-model="reason" name="reason" :id="r.name" :value="r.name" />
              <label class="form-check-label" :for="r.name">
                <strong>{{ r.germanName }}:</strong> {{ r.description }}
              </label>
            </div>
            <div v-if="reason === null" class="invalid-feedback" style="display: block">Please select an reason.</div>
            <div v-if="filteredChanges && filteredChanges.length !== 0" class="table-responsive mt-3">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">#</th>
                    <th scope="col">Reason</th>
                    <th scope="col">Price</th>
                    <th scope="col">User</th>
                    <th scope="col">Note</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="change in filteredChanges" :key="change.id">
                    <td class="text-nowrap">{{ $filters.asDateTime(change.date) }}</td>
                    <td class="text-end">{{ change.amount }}</td>
                    <td>{{ change.germanReason }}</td>
                    <td>{{ change.brottoPrice ? change.brottoPrice + ' €' : null }}</td>
                    <td>{{ change.user ? change.user.name : '' }}</td>
                    <td>{{ change.note }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="mb-3 was-validated" v-if="change !== null">
            <label for="itemGroupName" class="form-label">Notiz</label>
            <textarea type="text" class="form-control" rows="4" name="reason" :required="noteRequired ? 'true' : null" v-model.trim="note" />
          </div>
          <div class="mb-3" v-if="reason === 'bought'">
            <label class="form-label">Preisgenauigkeit</label>
            <div class="form-check mb-2">
              <input class="form-check-input" type="radio" v-model="priceAccuracy" name="pA" id="unknown" value="unknown" required />
              <label class="form-check-label" for="unknown">
                <strong>Unbekannt:</strong> Der Preis ist nicht bekannt (Aber es gab wahrscheinlich einen und es war keine Spende)
              </label>
            </div>
            <div class="form-check mb-2">
              <input class="form-check-input" type="radio" v-model="priceAccuracy" name="pA" id="estimated" value="estimated" required />
              <label class="form-check-label" for="estimated">
                <strong>Geschätzt:</strong> Der Preis ist geschätzt, so teuer sollte der Artikel ungefähr sein
              </label>
            </div>
            <div class="form-check mb-2">
              <input class="form-check-input" type="radio" v-model="priceAccuracy" name="pA" id="fromBill" value="fromBill" required />
              <label class="form-check-label" for="fromBill"> <strong>Von der Rechnung:</strong> Der Preis ist wie auf der Rechnung </label>
            </div>
            <div class="form-check mb-2">
              <input class="form-check-input" type="radio" v-model="priceAccuracy" name="pA" id="researched" value="researched" required />
              <label class="form-check-label" for="researched">
                <strong>Recherchiert:</strong> Der Preis wurde recherchiert. Es kann aber sein, dass der Preis anders oder es ein Sonderangebot war
              </label>
            </div>
            <div class="form-check mb-2">
              <input class="form-check-input" type="radio" v-model="priceAccuracy" name="pA" id="fpb" value="fromPreviousBill" required />
              <label class="form-check-label" for="fpb">
                <strong>Von vorheriger Rechnung:</strong> Der Preis von einer vorherigen Rechnung, wurde nicht neu nachgeschaut, könnte sich aber geändert haben
              </label>
            </div>
            <div v-if="priceAccuracy === null" class="invalid-feedback" style="display: block">Please select an price accuracy.</div>
          </div>
          <PriceInput ref="priceInput" :showBrotto="showBrotto" :showNetto="showNetto" :change="change" v-model:einzelNetto="einzelNetto"
            v-model:einzelBrotto="einzelBrotto" :initialTax="tax" :priceInputDisabled="priceInputDisabled" />
          <div class="mt-2 text-danger" v-if="errorString.length !== 0">{{ errorString }}</div>
          <button v-if="change !== null" type="button" class="btn btn-success my-3" v-on:click="addChange('another')">Add Change and add similar</button>
          <button v-if="change !== null" type="button" class="btn btn-success ms-own" v-on:click="addChange('list')">Add Change and view list</button>
        </form>
      </div>
    </div>
    <BToastOrchestrator />
  </div>
</template>

<script>
import http from '@/http-common';
import phoneticsFilter from '@/phoneticsFilter';
import { getGermanReason, getFilterFunction } from './changeUtil';
import { reasons } from '@common/stockChangeReasons.js';
import { h } from 'vue';
import { useToastController } from 'bootstrap-vue-next';
import { BToast } from 'bootstrap-vue-next';
import NavigationDataService from '@/router/navigationDataService';
import { RouterLink } from 'vue-router';
import { subscribeMqtt } from '@/mqttSub';
import PriceInput from '@/components/PriceInput.vue';

export default {
  components: {
    PriceInput,
  },
  data() {
    return {
      item: null,
      lastChanges: null,
      existingItems: [],
      errorString: '',
      reason: null,
      priceAccuracy: null,
      currentItemStock: null,
      change: null,
      result: null,
      resultError: null,
      sign: null,
      einzelBrotto: null,
      einzelNetto: null,
      tax: 19,
      note: null,
      reasons,
    };
  },
  computed: {
    noteRequired() {
      return this.reason !== null && this.reason === 'other';
    },
    showNetto() {
      return this.reason === 'bought';
    },
    showBrotto() {
      return this.reason === 'bought' || this.reason === 'sold';
    },
    priceInputDisabled() {
      return this.change === null || this.priceAccuracy === 'unknown';
    },
    filteredChanges() {
      return this.lastChanges === null ? null : this.lastChanges.filter(getFilterFunction(this.reason));
    },
    displayedReasons() {
      return this.reasons.filter(r => r.sign === this.sign || r.sign === '±');
    },
  },
  watch: {
    change: function () {
      if (this.reason === null && this.einzelNetto !== null) this.reason = 'bought'; // Wenn das erste mal nen Menge gewählt wird und wir von "Add Item" kommen
    },
    result: function (result) {
      if (this.currentItemStock !== null) {
        const change = result - this.currentItemStock;
        if (this.sign === '+' && change <= 0) {
          this.resultError = 'Durch die Änderung müsste der Lagerstand steigen.';
          return;
        } else if (this.sign === '-' && change >= 0) {
          this.resultError = 'Durch die Änderung müsste der Lagerstand sinken.';
          return;
        } else {
          this.resultError = null;
        }
      }
    },
    item: function () {
      this.sign = null;
      this.change = null;
      this.result = null;
      this.reason = null;
      if (this.item !== null) this.errorString = '';
      if (this.item) {
        //if (this.item.)
        http
          .get('/item/' + this.item.value + '/stock')
          .then(response => {
            this.currentItemStock = response.data.inStock;
          })
          .catch(e => {
            this.currentItemStock = e.toString();
            console.log(e);
          });
        http
          .get('/item/' + this.item.value + '/stockChanges')
          .then(response => {
            response.data.forEach(c => {
              c.germanReason = getGermanReason(c.reason);
              c.date = new Date(c.date);
            });
            this.lastChanges = response.data;
          })
          .catch(console.log);
      }
    },
  },
  methods: {
    phoneticsFilter,
    paginatorClicked() {
      if (this.sign === null) {
        return;
      }
      this.result = this.currentItemStock + (this.sign === '+' ? 1 : -1) * this.change;
    },
    onInputForChange() {
      this.result = this.currentItemStock + (this.sign === '+' ? 1 : -1) * this.change;
    },
    onInputForResult() {
      const change = this.currentItemStock - this.result;
      this.sign = change > 0 ? '-' : '+';
      this.change = Math.abs(change);
    },
    onlyNumbers(evt) {
      const charCode = evt.which ? evt.which : evt.keyCode;
      // replace . by ,
      const CHAR_CODE_COMMA = 44;
      const CHAR_CODE_DOT = 46;
      const CHAR_CODE_MINUS = 45;
      const CHAR_CODE_PLUS = 43;
      if (charCode === CHAR_CODE_DOT || charCode === CHAR_CODE_COMMA) {
        if (evt.target.value.indexOf(',') !== -1 || evt.target.value.indexOf('.') !== -1) {
          evt.preventDefault();
        }
        return;
      }
      if ((charCode < 48 || charCode > 57) && charCode !== CHAR_CODE_DOT && charCode !== CHAR_CODE_COMMA) {
        evt.preventDefault();
      }
      if ((charCode === CHAR_CODE_PLUS || charCode === CHAR_CODE_MINUS) && this.reason === 'other' && evt.target.id === 'change') {
        this.sign = evt.key;
        this.result = this.currentItemStock + this.change * (this.sign === '+' ? 1 : -1);
      }
    },
    retrieveItems() {
      return http
        .get('/itemsForSelect')
        .then(response => {
          this.existingItems = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    addChange(next) {
      //check if form is valid
      if (this.$refs.form.checkValidity() === false) {
        this.errorString = 'The form has invalid fields.\n';
        return;
      } else {
        this.errorString = '';
      }
      const data = {
        itemId: this.item.value,
        reason: this.reason,
        amount: (this.sign === '+' ? 1 : -1) * this.change,
        note: this.note === '' ? null : this.note,
      };
      if (this.reason === 'bought') {
        data.priceAccuracy = this.priceAccuracy;
        if (data.priceAccuracy !== 'unknown') {
          data.brottoPrice = this.einzelBrotto;
          data.netPrice = this.einzelNetto;
        }
      } else if (this.showBrotto) {
        data.brottoPrice = this.einzelBrotto;
      }

      http
        .post('/stockChange', data, {
          validateStatus: () => true,
        })
        .then(response => {
          if (response !== undefined) {
            if (response.status === 201) {
              if (next === 'list') {
                this.$router.push('stockChanges');
              } else {
                this.item = null;
                this.currentItemStock = null;
                this.change = null;
                this.result = null;
                this.resultError = null;
                this.$refs.priceInput.clearPrices();
                this.lastChanges = null;
              }
              this.errorString = 'Change added';
            } else {
              this.errorString = response.data;
            }
          } else {
            this.errorString = 'Network error :(';
          }
        });
    },
    onBarcode(barcode) {
      const item = this.existingItems.find(i => i.barcode === barcode || i.barcodePack === barcode);
      if (item === undefined) {
        NavigationDataService.set({ initialItem: { barcode: barcode } });
        const vNodesMsg = h('p', [
          h('span', { class: ['me-2'] }, () => `No Item found for barcode "${barcode}"`),
          h(
            RouterLink,
            {
              class: ['btn', 'btn-sm', 'btn-success'],

              to: {
                name: 'addItem',
              },
            },
            () => 'Create Item',
          ),
        ]);
        this.show?.({
          component: h(BToast, null, { default: () => vNodesMsg }),
          props: {
            title: 'No item selected!',
            pos: 'bottom-center',
            variant: 'danger',
          },
        });
      } else {
        this.item = item;
        this.show?.({
          props: {
            title: 'Item selected',
            body: `Item "${this.item.text}" selected`,
            pos: 'bottom-center',
            variant: 'info',
          },
        });
      }
    },
  },
  setup() {
    const { show } = useToastController();
    return { show };
  },
  mounted() {
    this.retrieveItems().then(() => {
      this.$route.query.barcode && this.onBarcode(this.$route.query.barcode);
      const navData = NavigationDataService.get();
      if (navData?.itemId) {
        for (let item of this.existingItems) {
          if (item.value === navData?.itemId) {
            this.item = item;
            break;
          }
        }
        if (navData.netPrice) {
          this.einzelNetto = navData.netPrice;
          this.einzelBrotto = navData.grossPrice;

          if (navData.grossPrice !== null) {
            this.priceFrom = 'einzelBrotto';
            this.tax = Math.round((navData.grossPrice / navData.netPrice - 1) * 100);
            this.priceAccuracy = 'researched';
          }
        }
      }
    });
  },
  created() {
    this.client = subscribeMqtt('barplaner/scanner');
    this.client.on('message', (topic, message) => {
      if (topic === 'barplaner/scanner') {
        const value = message.toString().trim();
        this.onBarcode(value);
      }
    });
  },
  beforeUnmount() {
    this.client.end();
  },
};
</script>

<style>
.cursor-pointer {
  cursor: pointer;
}

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

@media (min-width: 475px) {
  .ms-own {
    margin-left: 0.5rem !important;
  }
}
</style>
