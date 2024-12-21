<template>
  <div class="container">
    <div ref="print" class="print-only">
      <div class="d-block">
        <template v-for="arrow in ['↑', '↓']">
          <div class="d-flex align-items-center" v-for="position in positions">
            <template v-for="i in [1, 2]">
              <div>{{ arrow }} {{ position.name }}</div>
              <barcode :value="'pos' + position.id" :width="2" :height="20" :displayValue="false"></barcode>
              <div class="me-3">{{ arrow }}</div>
            </template>
          </div>
        </template>
      </div>
    </div>
    <div class="row d-print-none">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="d-flex justify-content-end">
          <button class="btn btn-primary mt-3 me-3" v-on:click="print">Print Barcodes</button>
          <router-link class="btn btn-success mt-3 me-3" to="/addPosition">Add Position</router-link>
        </div>
        <div class="mb-3">
          <input type="text" class="mt-3 form-control" placeholder="Search" v-on:input="filter" />
        </div>
        <div class="mt-3 mb-3">
          <div v-if="positions.length !== 0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Room</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="position in filteredPositions" :key="position.id">
                  <td>
                    <router-link :to="{ name: 'position', params: { positionId: position.id } }" @click="setNavigationData({ position })">
                      {{ position.name }}</router-link
                    >
                  </td>
                  <td>{{ position.room }}</td>
                  <td>{{ position.description }}</td>
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
import VueBarcode from '@/components/jsbarcode.js';
import NavigationDataService from '@/router/navigationDataService';

export default {
  name: 'position-list',
  data() {
    return {
      positions: [],
      filteredPositions: [],
    };
  },
  components: {
    barcode: VueBarcode,
  },
  methods: {
    filter(event) {
      this.filteredPositions = phoneticsFilter(this.positions, event.target.value);
    },
    retrievePositions() {
      http
        .get('/positionsWithImages')
        .then(response => {
          this.filteredPositions = this.positions = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    print() {
      window.print();
    },
    setNavigationData(item) {
      NavigationDataService.set(item);
    },
  },
  mounted() {
    this.retrievePositions();
  },
};
</script>

<style>
.print-only {
  display: none !important;
}

@media print {
  .print-only {
    display: flex !important;
  }
}
</style>
