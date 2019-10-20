<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 ">
        <div class="alert alert-danger text-center" role="alert">
          Die Eingaben werden aktuell nicht validiert! Ändere was nur, wenn du weißt was du tuest! <br>
          Um die Werte zu speichern, Enter drücken.
        </div>
        <div v-if="settings.length!==0" class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th scope="col" class="col-4">Name</th>
                <th scope="col" class="col-4">Description</th>
                <th scope="col" class="col-4">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in settings" :key="s.name">
                <td>{{s.name}}</td>
                <td>{{s.description}}</td>
                <td >
                  <input
                  class="form-control"
                  :value="s.value"
                  @change="updateSettings(s.name,$event.target.value)"
                  >
                </td>
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
