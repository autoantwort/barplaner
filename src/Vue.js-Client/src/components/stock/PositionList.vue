<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="d-flex justify-content-end">
          <router-link class="btn btn-success mt-3 mr-3" to="/addPosition">Add Position</router-link>
        </div>
        <div class="form-group">
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
                    <router-link :to="{ name: 'position', params: { positionId: position.id, position } }">{{
                      position.name
                    }}</router-link>
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
import http from "../../http-common";
import phoneticsFilter from "../../phoneticsFilter";

export default {
  name: "position-list",
  data() {
    return {
      positions: [],
      filteredPositions: [],
    };
  },
  methods: {
    /* eslint-disable no-console */
    filter(event) {
      this.filteredPositions = phoneticsFilter(this.positions, event.target.value);
    },
    retrievePositions() {
      http
        .get("/positionsWithImages")
        .then((response) => {
          this.filteredPositions = this.positions = response.data;
        })
        .catch((e) => {
          console.log(e);
        });
    },
    /* eslint-enable no-console */
  },
  mounted() {
    this.retrievePositions();
  },
};
</script>

<style>
</style>
