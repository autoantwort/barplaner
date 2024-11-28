<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="mt-3 mb-3">
          <div v-if="users.length !== 0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Aktiv</th>
                  <th scope="col" v-for="role in roles" :key="role.name" :title="role.description">
                    {{ role.name }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.name }}</td>
                  <td v-if="user.active">Ja</td>
                  <td v-else>Nein</td>
                  <td v-for="role in roles" :key="role.name" :title="role.description">
                    <input type="checkbox" v-on:click="updateRole(user.id, role.name, $event)" v-model="user.roles[role.name]" />
                  </td>
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
import http from '@/http-common';
import Roles from '@/roles';
// import VueSingleSelect from "vue-single-select";

export default {
  name: 'role-list',
  // components: {
  //   VueSingleSelect
  // },
  data() {
    return {
      users: [],
      roles: [],
    };
  },
  methods: {
    /* eslint-disable no-console */
    retrieveUser() {
      http
        .get('/users/roleTable')
        .then(response => {
          this.roles = response.data.roles;
          this.users = response.data.user.sort((r, l) => {
            if (l.active < r.active) {
              return -1;
            } else if (l.active > r.active) {
              return 1;
            } else {
              return 0;
            }
          });
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
          .post('/user/' + userID + '/role', { role: role })
          .then(response => {
            console.log(response.data);
          })
          .catch(e => {
            console.log(e);
          });
      } else {
        http
          .delete('/user/' + userID + '/' + role)
          .then(() => {
            console.log('deleted role ' + role);
          })
          .catch(e => {
            console.log(e);
          });
      }
    },

    /* eslint-enable no-console */
  },
  mounted() {
    if (Roles.haveRole('UserAdmin')) {
      this.retrieveUser();
    }
  },
};
</script>

<style></style>
