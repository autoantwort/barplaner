<template>
  <div class="container">
    <div class="row mt-3">
      <div v-if="realInvoice" class="col-12 col-md-10 offset-md-1">
        <form ref="form" class="was-validated">
          <div class="form-group row mb-2">
            <label class="col-3 col-form-label">From</label>
            <div class="col-9">
              <input v-if="realInvoice.seller" readonly class="form-control-plaintext" :value="realInvoice.seller" />
              <input v-else type="text" class="form-control" v-model="seller" required />
            </div>
          </div>
          <div class="form-group row mb-2">
            <label class="col-3 col-form-label">Invoice Date</label>
            <div class="col-9">
              <input
                v-if="realInvoice.invoiceDate"
                readonly
                class="form-control-plaintext"
                :value="realInvoice.invoiceDate | asDayDateTime"
              />
              <input
                v-else
                class="form-control"
                required
                pattern="[0-3]\d\.[0-1]\d\.\d\d [0-2]\d:[0-5]\d"
                title="dd.mm.yy hh:mm"
                v-model="invoiceDate"
              />
              <div class="invalid-feedback">Required. Format: dd.mm.yy hh:mm</div>
            </div>
          </div>
          <div class="form-group row mb-2">
            <label class="col-3 col-form-label">Delivery Date</label>
            <div class="col-9">
              <input
                v-if="realInvoice.deliveryDate"
                readonly
                class="form-control-plaintext"
                :value="realInvoice.deliveryDate | asDayDateTime"
              />
              <input
                v-else
                class="form-control"
                pattern="[0-3]\d\.[0-1]\d\.\d\d [0-2]\d:[0-5]\d"
                title="dd.mm.yy hh:mm"
                v-model="deliveryDate"
              />
              <div class="invalid-feedback">Format: dd.mm.yy hh:mm</div>
            </div>
          </div>
          <div class="form-group row" v-if="realInvoice.extraCostsDescription">
            <label class="col-4">Extra Costs</label>
            <label class="col-8">{{realInvoice.extraCostsAmount}} für {{realInvoice.extraCostsDescription}}</label>
          </div>
          <div class="form-group row" v-if="canSave">
            <div class="col-5 offset-3">
              <button v-on:click="save" class="col-12 btn btn-success">Save</button>
            </div>
          </div>
        </form>
        <div class="row" v-if="invoiceEntries && invoiceEntries.length > 0">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Change</th>
                <th scope="col">Designation</th>
                <th scope="col">Amount</th>
                <th scope="col">Quantity</th>
                <th scope="col">Net / Brot Price</th>
                <th scope="col">Website</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in invoiceEntries" :key="entry.id">
                <td>
                  <router-link v-if="entry.item" :to="{ name: 'item',params:{ itemId: entry.item.id } }">{{entry.item.name}}</router-link>
                </td>
                <td>
                  <!--<router-link v-if="entry.item" :to="{ name: 'item',params:{ itemId: entry.item.id } }">{{entry.item.name}}</router-link>-->
                  <span v-if="entry.change">#{{entry.change.id}}</span>
                </td>
                <td>{{entry.itemDescription}}</td>
                <td>{{entry.amount}} {{entry.unit}}</td>
                <td>{{entry.quantity}}</td>
                <td>{{entry.netPrice | asEuro}} / {{entry.brottoPrice | asEuro}}</td>
                <td>
                  <a v-if="entry.productSite" target="_blank" :href="entry.productSite">{{realInvoice.seller}}</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="analysing" class="justify-content-center" style="display: flex;">
          <span class="mt-1">Analysing invoice...</span>
          <b-spinner class="center ml-3"></b-spinner>
        </div>
        <div v-if="!pdfURL" class="justify-content-center mb-4" style="display: flex;">
          <button class="btn btn-primary" v-on:click="showPDF">Show PDF</button>
        </div>
        <div class="row mb-4" v-if="pdfURL">
          <iframe :src="pdfURL" style="width: 100%; height:1300px;" frameborder="0"></iframe>
        </div>
      </div>
    </div>
    <b-modal
      ref="deleteInvoice"
      centered
      title="Delete Invoice"
      ok-title="Delete Invoice"
      ok-variant="danger"
      v-on:ok="deleteInvoice"
    >Could not analyse Invoice. Do you want to delete the invoice? Otherwise you can inset the data manually.</b-modal>
  </div>
</template>

<script>
import http from "../../http-common";

function parseDate(input) {
  if (input === undefined) return undefined;
  let sub = function(start) {
    return input.substring(start, start + 2);
  };
  //"dd.mm.yy hh:mm"
  // 01 34 67 91 23
  return new Date("20" + sub(6), sub(3) - 1, sub(0), sub(9), sub(12));
}

export default {
  name: "invoice",
  props: {
    invoice: {
      type: Object,
      default: null
    },
    isNew: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      realInvoice: null,
      invoiceEntries: [],
      seller: undefined,
      invoiceDate: undefined,
      deliveryDate: undefined,
      analysing: false,
      pdfURL: null
    };
  },
  computed: {
    canSave: function() {
      if (this.realInvoice === null) return false;
      else {
        return (
          this.realInvoice.seller === null ||
          this.realInvoice.invoiceDate === null ||
          this.realInvoice.deliveryDate === null
        );
      }
    }
  },
  methods: {
    /* eslint-disable no-console */
    showPDF() {
      this.pdfURL = http.defaults.baseURL + "/file/" + this.realInvoice.fileId;
    },
    deleteInvoice() {
      http.delete("/invoice/" + this.realInvoice.id).then(() => {
        this.realInvoice = null;
        this.$router.push({ name: "invoiceList" });
      });
    },
    save() {
      if (this.$refs.form.checkValidity() === false) {
        return;
      }
      http
        .put("/invoice/" + this.realInvoice.id, {
          seller: this.seller,
          invoiceDate: parseDate(this.invoiceDate),
          deliveryDate: parseDate(this.deliveryDate)
        })
        .then(res => {
          this.realInvoice = res.data;
        });
    },
    retrieveinvoice() {
      http
        .get("/invoice/" + this.$route.params.invoiceId)
        .then(response => {
          this.realInvoice = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrieveInvoiceEntries() {
      const invoiceId =
        this.invoice !== null ? this.invoice.id : this.$route.params.invoiceId;
      http
        .get("/invoice/" + invoiceId + "/entries")
        .then(response => {
          this.invoiceEntries = response.data;
        })
        .catch(console.error);
    },
    retrieveAnalysis() {
      this.analysing = true;
      const invoiceId =
        this.invoice !== null ? this.invoice.id : this.$route.params.invoiceId;
      http
        .get("/invoice/" + invoiceId + "/analyse")
        .then(response => {
          this.analysing = false;
          this.realInvoice = response.data.invoice;
          this.invoiceEntries = response.data.entries;
        })
        .catch((/*err*/) => {
          this.analysing = false;
          this.retrieveInvoiceEntries();
          this.$refs.deleteInvoice.show();
        });
    }
  },
  mounted() {
    if (this.invoice === null) {
      this.retrieveinvoice();
    } else {
      this.realInvoice = this.invoice;
    }
    if (this.isNew) {
      this.retrieveAnalysis();
    } else {
      this.retrieveInvoiceEntries();
    }
  },
  beforeDeactivate: async function() {
    if (this.realInvoice && !this.realInvoice.seller) {
      await http.delete("/invoice/" + this.realInvoice.id);
    }
  }
  /* eslint-enable no-console */
};
</script>

<style>
</style>
