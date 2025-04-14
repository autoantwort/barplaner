<template>
  <div class="d-flex justify-content-center" v-if="haveDeletedChanges">
    <input type="checkbox" id="showDeleted" v-model="showDeleted" /><label for="showDeleted" class="ms-2">Show deleted transactions</label>
  </div>
  <div v-if="changes && changes.length !== 0" class="table-responsive">
    <table class="table table-sm">
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th v-if="showItem" scope="col">Item</th>
          <th scope="col" class="text-center px-0">Amount</th>
          <th scope="col" class="text-center">Reason</th>
          <th scope="col" class="text-center">Price</th>
          <th scope="col">User</th>
        </tr>
      </thead>
      <tbody>
        <slot name="before"></slot>
        <tr v-for="change in filteredChanges" :key="change.id" :class="{ highlight: change.highlight }">
          <td>
            <router-link :to="{ name: 'stockChange', params: { changeId: change.id } }"> {{ $filters.asDayDateTime(change.date) }}</router-link>
          </td>
          <td v-if="showItem">
            <router-link :to="{ name: 'item', params: { itemId: change.itemId } }">{{ change.stockItem.name }}</router-link>
          </td>
          <td class="text-center">
            {{ change.amount }}
          </td>
          <td class="text-center" :class="{ 'strikethrough': change.amount === 0 }">
            <template v-if="change.invoiceEntry === null">
              {{ getGermanReason(change.reason) }}
            </template>
            <router-link v-else :to="{ name: 'invoice', params: { invoiceId: change.invoiceEntry.invoiceId } }">
              {{ getGermanReason(change.reason) }}
            </router-link>
          </td>
          <td :id="'tooltip_' + change.id" class="text-center">
            <template v-if="change.brottoPrice">
              {{ change.netPrice.toFixed(2) }} / {{ change.brottoPrice.toFixed(2) }} €
              <b-tooltip v-if="change.priceAccuracy" :target="'tooltip_' + change.id">
                {{ change.priceAccuracy }}
              </b-tooltip>
            </template>
          </td>
          <td>{{ change.user ? change.user.name : '' }}</td>
        </tr>
        <slot name="after"></slot>
      </tbody>
    </table>
  </div>
</template>

<script>
import { getGermanReason } from './changeUtil';

export default {
  name: 'stock-changes-list',
  data() {
    return {
      showDeleted: false,
    };
  },
  props: {
    changes: {
      type: Array,
      default: null,
    },
    showItem: {
      type: Boolean,
    },
  },
  methods: {
    getGermanReason,
  },
  computed: {
    filteredChanges() {
      return this.showDeleted ? this.changes : this.changes.filter(change => change.amount !== 0);
    },
    haveDeletedChanges() {
      return this.changes.some(change => change.amount === 0);
    },
  },
};
</script>

<style>
.tooltip {
  top: 10px !important;
}

.strikethrough {
  text-decoration: line-through;
}

/* Für die Animation wenn man einen Tag auswählt (Die Zeilen werden hervorgehoben): */
@keyframes highlight {
  0% {
    background: #17a2b8;
  }

  30% {
    background: #17a2b8;
  }

  100% {
    background: none;
  }
}

.highlight {
  animation: highlight 2s;
}

a:not([href]) {
  color: #007bff !important;
}

a:not([href]):hover {
  color: #0056b3 !important;
}
</style>
