<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="d-flex justify-content-end">
          <router-link class="btn btn-success m-3" to="/addItem">Add Item</router-link>
        </div>
        <div class="form-group">
          <barcode-input placeholder="Search" v-on:input="filter" />
        </div>
        <div class="mt-3 mb-3">
          <div v-if="items.length !== 0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Position</th>
                  <th scope="col">ItemGroup</th>
                  <th scope="col">In Stock</th>
                  <th scope="col">Min/Max Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredItems" :key="item.id">
                  <td>
                    <router-link :to="{ name: 'item', params: { itemId: item.id } }">
                      {{ item.name }}
                    </router-link>
                    <image-button :item="item"></image-button>
                  </td>
                  <td style="white-space: nowrap">
                    <position-link :item="item"></position-link>
                  </td>
                  <td>
                    <router-link v-if="item.itemGroup" :to="{ name: 'itemGroup', params: { itemGroupId: item.itemGroup.id } }">
                      {{ item.itemGroup.name }}
                    </router-link>
                  </td>
                  <td>{{ item.inStock }}</td>
                  <td class="text-end">
                    <div class="prices" v-if="item.minBrottoPrice !== null">
                      <span class="price">{{ print(item.minBrottoPrice) }}</span> /
                      <span class="price">{{ print(item.maxBrottoPrice) }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';
import phoneticsFilter from '@/phoneticsFilter';
import BarcodeInput from '@/components/BarcodeInput.vue';
import ImageButton from '@/components/ImageButton.vue';
import PositionLink from '@/components/PositionLink.vue';

const formatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

export default {
  name: 'item-stock-list',
  components: {
    BarcodeInput,
    ImageButton,
    PositionLink,
  },
  data() {
    return {
      items: [],
      filteredItems: [],
    };
  },
  methods: {
    /* eslint-disable no-console */
    filter(value) {
      this.filteredItems = phoneticsFilter(
        this.items,
        value,
        (item, exactNameFilter) => item.barcode === value || item.barcodePack === value || exactNameFilter(item.itemGroup?.name ?? ''),
        (item, phoneticsNameFilter) => phoneticsNameFilter(item.itemGroup?.name ?? ''),
      );
    },
    print(price) {
      return formatter.format(price);
    },
    retrieveItemStock() {
      http
        .get('/itemStock')
        .then(response => {
          this.filteredItems = this.items = response.data;
        })
        .catch(e => {
          console.error(e);
        });
    },
  },
  mounted() {
    this.retrieveItemStock();
    /* eslint-enable no-console */
  },
};
</script>

<style>
.prices {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.price {
  display: inline-block;
  min-width: 3.6em;
}
</style>
