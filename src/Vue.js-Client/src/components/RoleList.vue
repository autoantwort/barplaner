<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="mt-3 mb-3">
          <div v-if="users.length!==0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Aktiv</th>
                  <th scope="col">UserAdmin</th>
                  <th scope="col">CleaningAdmin</th>
                  <th scope="col">BarAdmin</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{user.name}}</td>
                  <td v-if="user.active">Ja</td>
                  <td v-else>Nein</td>
                  <th>
                    <input
                      type="checkbox"
                      v-on:click="updateRole(user.id,'UserAdmin',$event)"
                      v-model="user.userAdmin"
                    >
                  </th>
                  <th>
                    <input
                      type="checkbox"
                      v-on:click="updateRole(user.id,'CleaningAdmin',$event)"
                      v-model="user.cleaningAdmin"
                    >
                  </th>
                  <th>
                    <input
                      type="checkbox"
                      v-on:click="updateRole(user.id,'BarAdmin',$event)"
                      v-model="user.barAdmin"
                    >
                  </th>
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
  name: "role-list",
  // components: {
  //   VueSingleSelect
  // },
  data() {
    return {
      users: [],
      user: {}
    };
  },
  methods: {
    /* eslint-disable no-console */
    retrieveUser() {
      http
        .get("/users/roles")
        .then(response => {
          this.users = response.data.sort((r, l) => {
            if (l.active < r.active) {
              return -1;
            } else if (l.active > r.active) {
              return 1;
            } else {
              return 0;
            }
          });
          for (let i = 0; i < this.users.length; i++) {
            this.users[i].userAdmin = this.users[i].roles.some(
              r => r.roleName === "UserAdmin"
            );
            this.users[i].barAdmin = this.users[i].roles.some(
              r => r.roleName === "BarAdmin"
            );
            this.users[i].cleaningAdmin = this.users[i].roles.some(
              r => r.roleName === "CleaningAdmin"
            );
          }
        })
        .catch(e => {
          console.log(e);
        });
    },
    refreshList() {
      this.retrieveBars();
    },
    updateRole(userID, role, event) {
      if (event.target.checked) {
        http
          .post("/user/" + userID + "/role", { role: role })
          .then(response => {
            console.log(response.data);
          })
          .catch(e => {
            console.log(e);
          });
      } else {
        http
          .delete("/user/" + userID + "/" + role)
          .then(() => {
            console.log("deleted role " + role);
          })
          .catch(e => {
            console.log(e);
          });
      }
    }

    /* eslint-enable no-console */
  },
  mounted() {
    if (Roles.haveRole("UserAdmin")) {
      this.retrieveUser();
    }
  }
};
</script>

<style>
</style>
