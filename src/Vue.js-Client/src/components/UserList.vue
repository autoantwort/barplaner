<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div v-if="userAdmin" class="mt-3 text-right">
          <router-link class="btn btn-success" to="/addUser">Add User</router-link>
        </div>
        <div class="mt-3 mb-3">
          <div v-if="users.length!==0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Handy</th>
                  <th scope="col">Aktiv</th>
                  <th scope="col">Erfahrener Putzer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{user.name}}</td>
                  <td>{{user.email}}</td>
                  <td>{{user.phone}}</td>
                  <th v-if="userAdmin || loginedUser.id === user.id">
                    <input
                      type="checkbox"
                      v-on:click="updateActive(user.id,$event)"
                      v-model="user.active"
                    >
                  </th>
                  <td v-else-if="user.active">Ja</td>
                  <td v-else>Nein</td>
                  <th v-if="cleaningAdmin">
                    <input
                      type="checkbox"
                      v-on:click="updateExperiencedCleaner(user.id,$event)"
                      v-model="user.experienced_cleaner"
                    >
                  </th>
                  <td v-else-if="user.experienced_cleaner">Ja</td>
                  <td v-else>Nein</td>
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
// import VueSingleSelect from "vue-single-select";

export default {
  name: "user-list",
  // components: {
  //   VueSingleSelect
  // },
  data() {
    return {
      users: [],
      loginedUser: {},
      cleaningAdmin: false,
      userAdmin: false
    };
  },
  methods: {
    /* eslint-disable no-console */
    retrieveUser() {
      http
        .get("/users")
        .then(response => {
          if (this.userAdmin) {
            response.data.sort((r, l) => l.active > r.active);
            this.users = response.data;
          }
          // JSON are parsed automatically.
          else this.users = response.data.filter(user => user.active); // JSON are parsed automatically.
        })
        .catch(e => {
          console.log(e);
        });
    },
    refreshList() {
      this.retrieveBars();
    },
    updateActive(userID, event) {
      var data = {
        active: event.target.checked
      };
      http
        .put("/user/" + userID, data)
        .then(response => {
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
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
    this.userAdmin = Roles.haveRole("UserAdmin");
    this.loginedUser = Roles.getUser();
    this.retrieveUser();
  }
};
</script>

<style>
</style>
