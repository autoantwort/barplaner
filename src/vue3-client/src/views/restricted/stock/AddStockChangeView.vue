<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3">
        <BarcodeScanner ref="scanner" :callback="onBarcode" />
        <div ref="form">
          <div class="form-group">
            <label>Item</label>
            <div class="form-row">
              <SearchableSelect class="border-primary col-10" :options="existingItems" :filterFunction="phoneticsFilter" v-model="item" />
              <button class="btn btn-success btn-sm" @click="$refs.scanner.loadDevicesAndPlay()">Scan</button>
            </div>
            <div v-if="item === null" class="invalid-feedback" style="display: block">Please select an item.</div>
          </div>
          <div v-if="item">
            <ul class="pagination">
              <li class="page-item" :class="{ active: sign == '+' }">
                <span
                  class="page-link"
                  v-on:click="
                    sign = '+';
                    paginatorClicked();
                  "
                  >Hinzugabe</span
                >
              </li>
              <li class="page-item" :class="{ active: sign == '-' }">
                <span
                  class="page-link"
                  v-on:click="
                    sign = '-';
                    paginatorClicked();
                  "
                  >Entnahme</span
                >
              </li>
            </ul>
          </div>
          <div v-if="sign !== null">
            <ul class="pagination">
              <li class="page-item" v-for="i of [1, 2, 3, 4, 5, 6, 7, 8, 10, 12]" :key="i">
                <span
                  class="page-link"
                  v-on:click="
                    change = i;
                    paginatorClicked();
                  "
                  >{{ i }}</span
                >
              </li>
            </ul>
          </div>
          <div class="form-group was-validated" v-if="change !== null">
            <label for="itemGroupName">Lagerstandsänderung</label>
            <br />
            <div class="d-flex justify-content-between">
              <span class="ms-5">Aktueller Lagerstand:</span>
              <span style="padding-right: 48px">{{ currentItemStock }}</span>
            </div>
            <div class="input-group">
              <div class="input-group-text" style="min-width: 36px">{{ this.sign }}</div>

              <input
                id="change"
                type="number"
                v-on:keypress="onlyNumbers"
                v-on:input="onInputForChange"
                class="form-control text-right"
                step="any"
                v-model.number="change"
                :disabled="item === null"
                required
                title="Die Lagerstandsveränderung. Links steht ob diese positiv oder negativ ist."
              />
            </div>
            <div class="input-group mt-2">
              <div class="input-group-text">=</div>

              <input
                type="number"
                class="form-control text-right"
                v-model.number="result"
                v-on:keypress="onlyNumbers"
                v-on:input="onInputForResult"
                step="any"
                :min="sign === '+' ? currentItemStock + 1 : null"
                :max="sign === '-' ? currentItemStock - 1 : null"
                :disabled="item === null"
                required
                title="Der neue Lagerstand"
              />
            </div>
            <div v-if="item === null" class="invalid-feedback" style="display: block">You have to select an item to edit this fields.</div>
            <div v-show="resultError !== null" class="invalid-feedback" style="display: block">{{ resultError }}</div>
            <div v-if="result < 0" class="alert alert-info mt-2" role="alert">
              <strong>Der Lagerstand ist negativ:</strong> Keine Problem, kann vorkommen. Passiert zum Beispiel, wenn jemand vergessen hat einen Einkauf
              einzutragen. Am besten in die Gruppe schreiben und Bescheid geben.
            </div>
          </div>
          <div class="form-group" v-if="change !== null">
            <label for="itemGroupMinCount">Reason</label>
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
                    <td class="text-right">{{ change.amount }}</td>
                    <td>{{ change.germanReason }}</td>
                    <td>{{ change.brottoPrice ? change.brottoPrice + ' €' : null }}</td>
                    <td>{{ change.user ? change.user.name : '' }}</td>
                    <td>{{ change.note }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="form-group was-validated" v-if="change !== null">
            <label for="itemGroupName">Notiz</label>
            <textarea type="text" class="form-control" rows="4" name="reason" :required="noteRequired ? 'true' : null" v-model.trim="note" />
          </div>
          <div class="form-group" v-if="reason === 'bought'">
            <label>Preisgenauigkeit</label>
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
          <div class="form-group was-validated" v-show="showBrotto">
            <label for>Preis (Netto: ohne Steuern, Brotto: mit Steuern)</label>
            <div class="input-group" v-show="showNetto">
              <div class="input-group-text" style="min-width: 71px">Netto</div>
              <div class="input-group-text">{{ Math.abs(change) }} ×</div>
              <input
                type="number"
                class="form-control text-right"
                step="any"
                placeholder="Einzelpreis    "
                v-model.number="einzelNetto"
                v-on:input="onNewEinzelNetto"
                min="0"
                :disabled="priceInputDisabled"
                v-on:keypress="onlyNumbers"
                :required="showNetto"
              />

              <div class="input-group-text">=</div>

              <input
                type="number"
                class="form-control text-right"
                step="any"
                placeholder="Gesamtpreis    "
                v-model.number="gesamtNetto"
                min="0"
                v-on:input="onNewGesamtNetto"
                :disabled="priceInputDisabled"
                v-on:keypress="onlyNumbers"
                :required="showNetto"
              />

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
              <input
                type="text"
                step="any"
                class="form-control px-1"
                :required="tax === 'own' ? true : null"
                v-model.number="ownTax"
                min="0"
                max="1000"
                v-on:keypress="onlyNumbers"
                v-on:click="tax = 'own'"
                :placeholder="taxPlaceholder"
                :disabled="change === null"
              />

              <div class="input-group-text px-sm">%</div>
            </div>

            <div class="input-group">
              <div class="input-group-text">Brotto</div>
              <div class="input-group-text">{{ Math.abs(change) }} ×</div>
              <input
                type="number"
                class="form-control text-right"
                step="any"
                placeholder="Einzelpreis    "
                v-model.number="einzelBrotto"
                v-on:input="onNewEinzelBrotto"
                min="0"
                :disabled="priceInputDisabled"
                v-on:keypress="onlyNumbers"
                :required="showBrotto"
              />
              <div class="input-group-text">=</div>
              <input
                type="number"
                class="form-control text-right"
                step="any"
                placeholder="Gesamtpreis    "
                v-model.number="gesamtBrotto"
                min="0"
                v-on:input="onNewGesamtBrotto"
                :disabled="priceInputDisabled"
                v-on:keypress="onlyNumbers"
                :required="showBrotto"
              />
              <div class="input-group-text">€</div>
            </div>
          </div>
          <div class="mt-2 text-danger" v-if="errorString.length !== 0">{{ errorString }}</div>
          <button v-if="change !== null" type="button" class="btn btn-success my-3" v-on:click="addChange('another')">Add Change and add similar</button>
          <button v-if="change !== null" type="button" class="btn btn-success ms-own" v-on:click="addChange('list')">Add Change and view list</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';
import phoneticsFilter from '@/phoneticsFilter';
import { getGermanReason, getFilterFunction } from './changeUtil';
import { reasons } from '@common/stockChangeReasons.js';

const round = v => Math.round(v * 1000) / 1000;

export default {
  props: {
    itemId: {
      type: Number,
      default: null,
    },
    netPrice: {
      type: Number,
      default: null,
    },
    grossPrice: {
      type: Number,
      default: null,
    },
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
      gesamtBrotto: null,
      einzelNetto: null,
      gesamtNetto: null,
      priceFrom: null,
      tax: null,
      ownTax: null,
      taxPlaceholder: 'Eigener',
      note: null,
      reasons,
    };
  },
  computed: {
    noteRequired() {
      return this.reason !== null && this.reason === 'other';
    },
    realTax() {
      if (this.tax !== null && (this.tax !== 'own' || this.ownTax !== null)) return this.tax === 'own' ? this.ownTax : Number(this.tax);
      else return -1;
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
      if (this.priceFrom === 'einzelBrotto') {
        this.gesamtBrotto = this.einzelBrotto * Math.abs(this.change);
        this.updateNetto();
      } else if (this.priceFrom === 'gesamtBrotto') {
        this.einzelBrotto = round(this.gesamtBrotto / Math.abs(this.change));
        this.updateNetto();
      } else if (this.priceFrom === 'einzelNetto') {
        this.gesamtNetto = this.einzelNetto * Math.abs(this.change);
        this.updateBrotto();
      } else if (this.priceFrom === 'gesamtNetto') {
        this.einzelNetto = round(this.gesamtNetto / Math.abs(this.change));
        this.updateBrotto();
      }
      if (this.reason === null && this.netPrice !== null) this.reason = 'bought'; // Wenn das erste mal nen Menge gewählt wird und wir von "Add Item" kommen
    },
    realTax: function (tax) {
      if (tax >= 0 && this.priceFrom) {
        if (this.priceFrom.endsWith('Brotto')) {
          this.updateNetto();
        } else if (this.priceFrom.endsWith('Netto')) {
          this.updateBrotto();
        }
      }
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
    onNewEinzelNetto() {
      this.gesamtNetto = this.einzelNetto * Math.abs(this.change);
      this.updateBrotto();
      this.priceFrom = 'einzelNetto';
    },
    onNewGesamtNetto() {
      this.einzelNetto = round(this.gesamtNetto / Math.abs(this.change));
      this.updateBrotto();
      this.priceFrom = 'gesamtNetto';
    },
    onNewEinzelBrotto() {
      this.gesamtBrotto = this.einzelBrotto * Math.abs(this.change);
      this.updateNetto();
      this.priceFrom = 'einzelBrotto';
    },
    onNewGesamtBrotto() {
      this.einzelBrotto = round(this.gesamtBrotto / Math.abs(this.change));
      this.updateNetto();
      this.priceFrom = 'gesamtBrotto';
    },
    updateBrotto() {
      const tax = this.realTax;
      if (tax >= 0) {
        this.einzelBrotto = round(this.einzelNetto * (1 + tax / 100));
        this.gesamtBrotto = round(this.gesamtNetto * (1 + tax / 100));
      } else if (this.gesamtBrotto && this.gesamtNetto) {
        this.taxPlaceholder = round((1 - this.gesamtBrotto / this.gesamtNetto) * -100);
      }
    },
    updateNetto() {
      const tax = this.realTax;
      if (tax >= 0) {
        this.einzelNetto = round(this.einzelBrotto * (100 / (100 + tax)));
        this.gesamtNetto = round(this.gesamtBrotto * (100 / (100 + tax)));
      } else if (this.gesamtNetto && this.gesamtBrotto) {
        this.taxPlaceholder = round((1 - this.gesamtBrotto / this.gesamtNetto) * -100);
      }
    },
    onlyNumbers(evt) {
      const charCode = evt.which ? evt.which : evt.keyCode;
      // replace , by . for non german browsers
      if (charCode === 44 && navigator.language !== 'de') {
        if (evt.target.value.indexOf('.') === -1) {
          evt.target.value += '.';
        }
        evt.preventDefault();
        return;
      }
      if ((charCode < 48 || charCode > 57) && charCode !== 46 && charCode !== 44) {
        evt.preventDefault();
      }
      if ((charCode === 43 || charCode === 45) && this.reason === 'other' && evt.target.id === 'change') {
        this.sign = evt.key;
        this.result = this.currentItemStock + this.change * (this.sign === '+' ? 1 : -1);
      }
    },
    retrieveItems() {
      return http
        .get('/itemsForSelect')
        .then(response => {
          this.existingItems = response.data;
          if (this.itemId !== null) {
            for (let item of this.existingItems) {
              if (item.value === this.itemId) {
                this.item = item;
                break;
              }
            }
            this.einzelNetto = this.netPrice;
            this.einzelBrotto = this.grossPrice;
            if (this.grossPrice !== null) {
              this.priceFrom = 'einzelBrotto';
              this.tax = Math.round((this.grossPrice / this.netPrice - 1) * 100);
              this.priceAccuracy = 'researched';
            }
          }
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
                this.einzelBrotto = null;
                this.gesamtBrotto = null;
                this.einzelNetto = null;
                this.gesamtNetto = null;
                this.priceFrom = null;
                this.tax = null;
                this.ownTax = null;
                this.taxPlaceholder = 'Eigener';
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
        const h = this.$createElement;
        const vNodesMsg = h('p', [
          h('span', { class: ['me-2'] }, `No Item found for barcode "${barcode}"`),
          h(
            'router-link',
            {
              class: ['btn', 'btn-sm', 'btn-success'],
              props: {
                to: {
                  name: 'addItem',
                  params: { initialItem: { barcode: barcode } },
                },
              },
            },
            'Create Item',
          ),
        ]);
        this.$bvToast.toast([vNodesMsg], {
          title: 'No item selected!',
          solid: true,
          toaster: 'b-toaster-bottom-center',
          variant: 'danger',
        });
      } else {
        this.item = item;
        this.$bvToast.toast(`Item "${this.item.text}" selected`, {
          title: 'Item selected',
          solid: true,
          toaster: 'b-toaster-bottom-center',
          variant: 'info',
        });
      }
    },
  },
  mounted() {
    this.retrieveItems().then(() => {
      this.$route.query.barcode && this.onBarcode(this.$route.query.barcode);
    });
  },

  created() {
    this.webSocket = new WebSocket(http.defaults.baseWsURL + '/scannerConsumer');
    this.webSocket.onmessage = e => {
      const barcode = e.data.trim();
      this.onBarcode(barcode);
    };
  },
  beforeUnmount() {
    this.webSocket.close();
  },
};
</script>

<style>
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
