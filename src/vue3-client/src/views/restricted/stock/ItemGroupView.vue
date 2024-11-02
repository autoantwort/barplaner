<template>
  <div class="container">
    <div class="row mt-3">
      <div v-if="realItemGroup" class="col-12 col-md-8 offset-md-2 was-validated">
        <div class="form-group row">
          <label class="col-3">Name</label>
          <generic-input-component :object="realItemGroup" property="name" endpoint="/itemGroup/:id" required :minLength="4" />
        </div>
        <div class="form-group row">
          <label class="col-3">Minimum Count</label>
          <generic-input-component
            :object="realItemGroup"
            property="minimumCount"
            type="number"
            :min="0"
            :max="realItemGroup.idealCount"
            :required="realItemGroup.idealCount !== null"
            endpoint="/itemGroup/:id"
          />
        </div>
        <div class="form-group row">
          <label class="col-3">Ideal Count</label>
          <generic-input-component :object="realItemGroup" property="idealCount" type="number" :min="realItemGroup.minimumCount" endpoint="/itemGroup/:id" />
        </div>
        <div class="form-group row">
          <label class="col-3">Recent Usage</label>
          <label class="col-9" v-if="usage">
            {{ usage.threeMonths }} <small>in three months</small>, {{ usage.sixMonths }} <small>in six months</small>, {{ usage.oneYear }}
            <small>in one year</small>
          </label>
        </div>
        <div class="form-group row">
          <label class="col-3">In Stock</label>
          <label class="col-9">
            {{ inStock }}
            <span
              v-if="inStock && inStock < realItemGroup.idealCount"
              class="badge ms-2 vert"
              style="vertical-align: text-top"
              v-bind:class="[inStock < realItemGroup.minimumCount ? 'badge-danger' : 'badge-warning']"
              >Buy {{ realItemGroup.idealCount - inStock }} item{{ realItemGroup.idealCount - inStock > 1 ? 's' : '' }}</span
            >
          </label>
        </div>
        <div class="form-group row">
          <label class="col-3">Position</label>
          <edit-position-component :object="realItemGroup" endpoint="/itemGroup/:id" :usedForItem="false" />
        </div>
        <div class="row" v-if="itemStock && itemStock.length > 0">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Seller</th>
                <th scope="col">Content</th>
                <th scope="col">In Stock</th>
                <th scope="col">Min</th>
                <th scope="col">Avg</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itemStock" :key="item.id">
                <td>
                  <router-link :to="{ name: 'item', params: { itemId: item.id } }">{{ item.name }}</router-link>
                </td>
                <td>
                  <a v-if="item.website" :href="item.website">{{ item.seller }}</a
                  ><template v-else>{{ item.seller }}</template>
                </td>
                <td>
                  {{ item.amount }} {{ item.unit }}
                  <template v-if="item.showAvg">
                    <br />
                    <small>1000 {{ item.unit }}</small>
                  </template>
                </td>
                <td>{{ item.inStock }}</td>
                <td>
                  {{ item.minBrottoPrice }}
                  <template v-if="item.showAvg">
                    <br />
                    <small>{{ item.minBrottoPriceNorm }}</small>
                  </template>
                </td>
                <td>
                  {{ item.avgBrottoPrice }}
                  <template v-if="item.showAvg">
                    <br />
                    <small>{{ item.avgBrottoPriceNorm }}</small>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="row" v-if="stockChanges && stockChanges.length > 0">
          <stock-changes-list :changes="stockChanges" :showItem="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';
import GenericInputComponent from '@/components/GenericInputComponent.vue';
import EditPositionComponent from '@/components/EditPositionComponent.vue';
import StockChangesList from './StockChangesListView.vue';
import { REASON } from '@common/stockChangeReasons.js';

const formatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

export default {
  name: 'itemGroup',
  props: {
    itemGroup: {
      type: Object,
      default: null,
    },
  },
  components: {
    GenericInputComponent,
    EditPositionComponent,
    StockChangesList,
  },
  data() {
    return {
      items: '',
      realItemGroup: null,
      itemStock: [],
      stockChanges: [],
      inStock: null,
      usage: null,
    };
  },
  methods: {
    retrieveitemGroup() {
      http
        .get('/itemGroup/' + this.$route.params.itemGroupId)
        .then(response => {
          this.realItemGroup = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrievePosition() {
      http
        .get('/position/' + this.itemGroup.stockPositionId)
        .then(response => {
          this.itemGroup.stockPosition = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrieveItemStock() {
      const itemGroupId = this.itemGroup !== null ? this.itemGroup.id : this.$route.params.itemGroupId;
      http
        .get('/itemGroup/' + itemGroupId + '/itemStock')
        .then(response => {
          this.itemStock = response.data;
          let inStock = 0;
          for (let i of this.itemStock) {
            inStock += i.inStock;
            i.showAvg = i.amount && i.amount !== 1000 && i.minBrottoPrice;
            if (i.showAvg) {
              i.minBrottoPriceNorm = formatter.format((i.minBrottoPrice / i.amount) * 1000);
              i.avgBrottoPriceNorm = formatter.format((i.avgBrottoPrice / i.amount) * 1000);
            }
            i.minBrottoPrice = i.minBrottoPrice ? formatter.format(i.minBrottoPrice) : null;
            i.avgBrottoPrice = i.avgBrottoPrice ? formatter.format(i.avgBrottoPrice) : null;
          }
          this.inStock = inStock;
        })
        .catch(console.error);
    },
    retrieveStockChanges() {
      const itemGroupId = this.itemGroup !== null ? this.itemGroup.id : this.$route.params.itemGroupId;
      http
        .get('/itemGroup/' + itemGroupId + '/stockChanges')
        .then(response => {
          const now = new Date();
          const oneDay = 1000 * 60 * 60 * 24;
          const threeMonthsAgo = new Date(now - oneDay * 30 * 3);
          const sixMonthsAgo = new Date(now - oneDay * 30 * 6);
          const oneYearAgo = new Date(now - oneDay * 365);
          let usageThreeMonths = 0;
          let usageSixMonths = 0;
          let usageOneYear = 0;
          for (let change of response.data) {
            change.date = new Date(change.date);
            if (change.reason === REASON.CONSUMED_DURING_BAR || change.reason === REASON.CORRECTED_CONSUMPTION_DURING_BAR) {
              if (change.date > threeMonthsAgo) {
                usageThreeMonths += change.amount;
              } else if (change.date > sixMonthsAgo) {
                usageSixMonths += change.amount;
              } else if (change.date > oneYearAgo) {
                usageOneYear += change.amount;
              }
            }
          }
          this.usage = {
            threeMonths: -usageThreeMonths,
            sixMonths: -(usageSixMonths + usageThreeMonths),
            oneYear: -(usageOneYear + usageSixMonths + usageThreeMonths),
          };
          this.stockChanges = response.data;
        })
        .catch(console.error);
    },
  },
  mounted() {
    if (this.itemGroup === null) {
      this.retrieveitemGroup();
    } else {
      this.realItemGroup = this.itemGroup;
      if (this.itemGroup.stockPositionId !== null && this.itemGroup.stockPosition === undefined) {
        this.retrievePosition();
      }
    }
    this.retrieveItemStock();
    this.retrieveStockChanges();
  },
};
</script>

<style></style>
