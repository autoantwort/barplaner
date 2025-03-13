<template>
  <div class="container">
    <div class="row mt-3">
      <div v-if="realChange" class="col-12 col-md-8 offset-md-2">
        <div class="mb-3 row">
          <label class="col-3 form-label">Date</label>
          <label class="col-9">{{ $filters.asDayDateTime(realChange.date) }}</label>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Amount</label>
          <label class="col-9">{{ realChange.amount }}</label>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Item</label>
          <router-link class="col-9" :to="{ name: 'item', params: { itemId: realChange.itemId } }">{{ realChange.stockItem.name }}</router-link>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Reason</label>
          <label class="col-9">{{ getGermanReason(realChange.reason) }}</label>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Net/Brotto Price</label>
          <label class="col-9">{{ $filters.asEuro(realChange.netPrice) }} / {{ $filters.asEuro(realChange.brottoPrice) }}</label>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">Price Accuracy</label>
          <label class="col-9">{{ getGermanPriceAccuracy(realChange.priceAccuracy) }}</label>
        </div>

        <div class="mb-3 row">
          <label class="col-3 form-label">Added by User</label>
          <label class="col-9">{{ realChange.user ? realChange.user.name : '' }}</label>
        </div>
        <div class="mb-3 row">
          <label class="col-3 form-label">From Bill</label>
          <label v-if="realChange.invoiceEntryId === null" class="col-9">{{ realChange.invoiceEntryId }}</label>
          <router-link v-else class="col-9" :to="{ name: 'invoice', params: { invoiceId: realChange.invoiceEntry.invoiceId } }"
            >{{ realChange.invoiceEntry.invoice.seller }}, {{ $filters.asDayDateTime(realChange.invoiceEntry.invoice.invoiceDate) }}</router-link
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';
import { getGermanReason } from './changeUtil';

const getGermanPriceAccuracy = e => e;

export default {
  name: 'stock-change',
  data() {
    return {
      realChange: null,
    };
  },
  methods: {
    getGermanPriceAccuracy,
    getGermanReason,
    retrieveChange() {
      http
        .get('/stockChange/' + this.$route.params.changeId)
        .then(response => {
          this.realChange = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
  },
  mounted() {
    this.retrieveChange();
  },
};
</script>

<style></style>
