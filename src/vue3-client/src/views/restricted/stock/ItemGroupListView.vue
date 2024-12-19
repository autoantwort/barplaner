<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="d-flex justify-content-end">
          <router-link class="btn btn-success mt-3 me-3" to="/addItemGroup">Add ItemGroup</router-link>
        </div>
        <div class="mb-3">
          <input type="text" class="mt-3 form-control" placeholder="Search" v-on:input="filter" />
        </div>
        <div class="mt-3 mb-3">
          <div v-if="itemGroups.length !== 0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Position</th>
                  <th scope="col">Minimum Count</th>
                  <th scope="col">Ideal Count</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="itemGroup in filteredItemGroups" :key="itemGroup.id">
                  <td>
                    <router-link :to="{ name: 'itemGroup', params: { itemGroupId: itemGroup.id } }" @click="setNavigationData({ itemGroup })">{{
                      itemGroup.name
                    }}</router-link>
                  </td>
                  <td>
                    <router-link
                      v-if="itemGroup.stockPosition"
                      :to="{
                        name: 'position',
                        params: { positionId: itemGroup.stockPosition.id },
                      }"
                      @click="setNavigationData({ position: itemGroup.stockPosition })"
                      >{{ itemGroup.stockPosition.name }}</router-link
                    >
                    <button
                      v-if="itemGroup.stockPosition && itemGroup.stockPosition.imageId !== null"
                      class="ms-2 btn btn-sm btn-sm-flat btn-secondary"
                      type="button"
                      v-on:click="openModal(itemGroup.stockPosition)"
                    >
                      <i-fa-image />
                    </button>
                  </td>
                  <td>{{ itemGroup.minimumCount }}</td>
                  <td>{{ itemGroup.idealCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <b-modal ref="modal" hide-footer no-fade centered :title="selectedPosition && selectedPosition.name">
          <positionImage :position="selectedPosition"></positionImage>
        </b-modal>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';
import PositionImage from '@/components/PositionImage.vue';
import phoneticsFilter from '@/phoneticsFilter';
import NavigationDataService from '@/router/navigationDataService';

export default {
  name: 'itemGroup-list',
  data() {
    return {
      itemGroups: [],
      filteredItemGroups: [],
      selectedPosition: null,
    };
  },
  components: {
    PositionImage,
  },
  methods: {
    filter(event) {
      this.filteredItemGroups = phoneticsFilter(this.itemGroups, event.target.value);
    },
    openModal(position) {
      this.selectedPosition = position;
      this.$refs.modal.show();
    },
    retrieveItemGroups() {
      http
        .get('/itemGroupsWithPositions')
        .then(response => {
          this.filteredItemGroups = this.itemGroups = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    setNavigationData(item) {
      NavigationDataService.set(item);
    },
  },
  mounted() {
    this.retrieveItemGroups();
  },
};
</script>

<style>
.btn-sm-flat {
  padding-top: 0 !important;
  padding-bottom: 0px !important;
}
</style>
