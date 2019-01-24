<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10 offset-lg-2 col-lg-8">
        <div class="mt-3 mb-3">
          <div v-if="users.length!==0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col"># aktive Bars</th>
                  <th scope="col"># geputzte Bars</th>
                  <th scope="col" title="#aktiveBars/(1+#geputzteBars)">Verhältnis</th>
                  <th scope="col">Erfahrener Putzer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{user.name}}</td>
                  <td>{{user.count}}</td>
                  <td>{{user.cleaned}}</td>
                  <td>{{user.ratio.toFixed(2)}}</td>
                  <th v-if="cleaningAdmin">
                    <input
                      type="checkbox"
                      v-on:click="updateExperiencedCleaner(user.id,$event)"
                      v-model="user.experienced_cleaner"
                    >
                  </th>
                  <td v-else-if="user.experienced_cleaner">✔️</td>
                  <td v-else></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- End code dublication -->
      </div>
    </div>
  </div>
</template>

<script>
import http from "../http-common";
import Roles from "../roles";

export default {
  name: "duty-list",
  data() {
    return {
      users: [],
      cleaningAdmin: false
    };
  },
  methods: {
    /* eslint-disable no-console */
    retrieveUser() {
      http
        .get("/duty")
        .then(response => {
          this.users = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    refreshList() {
      this.retrieveUser();
    },
    updateExperiencedCleaner(userID, event) {
      var data = {
        experienced_cleaner: event.target.checked
      };
      http
        .put("/user/" + userID, data)
        .then(response => {
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    }

    /* eslint-enable no-console */
  },
  mounted() {
    this.cleaningAdmin = Roles.haveRole("CleaningAdmin");
    this.retrieveUser();
  }
};
</script>

<style>
</style>
