<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 ">
        
        <div v-if="settings.length!==0" class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in settings" :key="s.name">
                <td>{{s.name}}</td>
                <td>{{s.description}}</td>
                <template v-if="s.name === 'defaultNumberOfPersonsToClean'">
                  <input 
                  type="number"
                  min="0"
                  class="form-control"
                  :value="s.value"
                  @change="updateSettings(s.name,$event.target.value)"
                  >
                </template>
              </tr>
            </tbody>
          </table>
        </div>

      
    </div>
    </div>
  </div>
</template>

<script>
import http from "../http-common";

export default {
  name: "settings",
  data() {
    return {
      settings :[],
    };
  },
  methods: {
    /* eslint-disable no-console */
    retrieveSettings() {
      http
        .get("/settings")
        .then(response => {
          console.log(response.data)
            this.settings = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    updateSettings(name, value) {
      
      http
        .put("/setting/" + name, {value: value})
        .then(response => {
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    },
    /* eslint-enable no-console */
  },
  mounted() {
    this.retrieveSettings();
  }
};
</script>

<style>
</style>
