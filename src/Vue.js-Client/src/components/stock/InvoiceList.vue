<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="d-flex justify-content-end">
          <button class="btn btn-success mt-3 mr-3" v-on:click="openAddInvoice">Add Invoice</button>
        </div>
        <div class="mt-3 mb-3">
          <div v-if="invoices.length!==0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Rechnung</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="invoice in invoices" :key="invoice.id">
                  <td>
                    <router-link
                      :to="{ name: 'invoice',params:{ invoiceId: invoice.id , invoice: invoice} }"
                    >{{invoice.seller}} Rechnung vom {{invoice.invoiceDate | asDate}}</router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <b-modal ref="addInvoice" centered title="Add Invoice" ok-title="Add Invoice" ok-variant="success" v-on:ok="addInvoice">
      <form ref="form">
        <div class="form-group">
          <label for="recipient-name" class="col-form-label">Invoice:</label>
          <b-form-file v-model="uploadedInvoicePdf" accept="application/pdf" :required="true"></b-form-file>
          <div class="invalid-feedback">Required</div>
        </div>
      </form>
    </b-modal>
  </div>
</template>

<script>
import http from "../../http-common";

export default {
  name: "invoice-list",
  data() {
    return {
      invoices: [],
      uploadedInvoicePdf: null
    };
  },
  props: {
    addNew: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    /* eslint-disable no-console */
    openAddInvoice() {
      this.$refs.addInvoice.show();
    },
    addInvoice(e) {
      if (this.uploadedInvoicePdf === null) {
        e.preventDefault();
        this.$refs.form.checkValidity();
        this.$refs.form.classList.add("was-validated");
        return;
      }
      const formData = new FormData();
      formData.set("invoice", this.uploadedInvoicePdf);
      http
        .post("/invoice", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          validateStatus: () => true
        })
        .then(response => {
          if (response.status === 409) {
            this.$router.push({
              name: "invoice",
              params: {
                invoiceId: response.data.invoice.id,
                invoice: response.data.invoice
              }
            });
          } else if (response.status === 201) {
            this.$router.push({
              name: "invoice",
              params: {
                invoiceId: response.data.id,
                invoice: response.data,
                isNew: true
              }
            });
          } else {
            this.$bvModal.msgBoxOk(response.data, {
              title: "Error",
              centered: true
            });
          }
        });
    },
    retrieveInvoices() {
      http
        .get("/invoices")
        .then(response => {
          // maybe the user click back on the Invoice View with a invoice that should
          // be deleted, but the deletion take place after this method call, so filter
          // the invoice that should be deleted out here
          this.invoices = response.data.filter(i => i.seller !== null);
        })
        .catch(e => {
          console.log(e);
        });
    }
  },
  mounted() {
    this.retrieveInvoices();
    if (this.addNew) {
      this.openAddInvoice();
      this.$router.replace({ path: "/invoices" });
    }
    /* eslint-enable no-console */
  }
};
</script>

<style>
</style>
