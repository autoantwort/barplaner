<template>
  <div class="container">
    <div ref="print" class="row print-only" v-for="row in activeUsers">
      <div class="col-3 d-flex justify-content-center align-items-center mb-4" v-for="user in row">
        <barcode :value="10000 + user.id" :width="2" :height="100" :text="user.name" fontSize="25"></barcode>
      </div>
    </div>
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div v-if="userAdmin" class="mt-3 text-right d-print-none">
          <button class="btn btn-primary mr-3" v-on:click="print">Print Barcodes</button>
          <router-link class="btn btn-success" to="/addUser">Add User</router-link>
        </div>
        <div class="mt-3 mb-3 d-print-none">
          <div v-if="users.length !== 0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Geburtsdatum</th>
                  <th scope="col">Handy</th>
                  <th scope="col">Aktiv</th>
                  <th scope="col">Erfahrener Putzer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.birthday }}</td>
                  <td>{{ user.phone }}</td>
                  <th v-if="userAdmin || loginedUser.id === user.id">
                    <input type="checkbox" v-on:click="updateActive(user.id, $event)" v-model="user.active" :false-value="0" :true-value="1" />
                  </th>
                  <td v-else-if="user.active">Ja</td>
                  <td v-else>Nein</td>
                  <th v-if="cleaningAdmin">
                    <input
                      type="checkbox"
                      v-on:click="updateExperiencedCleaner(user.id, $event)"
                      v-model="user.experienced_cleaner"
                      :false-value="0"
                      :true-value="1"
                    />
                  </th>
                  <td v-else-if="user.experienced_cleaner">Ja</td>
                  <td v-else>Nein</td>
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
import Roles from '@/roles';
import VueBarcode from '@/components/jsbarcode.js';

function groupBy(arr, number) {
  let result = [];
  for (let i = 0; i < arr.length; i += number) {
    result.push(arr.slice(i, i + number));
  }
  return result;
}

export default {
  components: {
    barcode: VueBarcode,
  },
  data() {
    return {
      users: [],
      loginedUser: {},
      cleaningAdmin: false,
      userAdmin: false,
    };
  },
  computed: {
    activeUsers() {
      return groupBy(
        this.users.filter(user => user.active),
        4,
      );
    },
  },
  methods: {
    retrieveUser() {
      http
        .get('/users')
        .then(response => {
          if (this.userAdmin) {
            this.users = response.data.sort((r, l) => {
              if (l.active < r.active) {
                return -1;
              } else if (l.active > r.active) {
                return 1;
              } else {
                return 0;
              }
            });
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
        active: event.target.checked,
      };
      http
        .put('/user/' + userID, data)
        .then(response => {
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    },
    updateExperiencedCleaner(userID, event) {
      var data = {
        experienced_cleaner: event.target.checked,
      };
      http
        .put('/user/' + userID, data)
        .then(response => {
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    },
    print() {
      window.print();
    },
  },
  mounted() {
    this.cleaningAdmin = Roles.haveRole('CleaningAdmin');
    this.userAdmin = Roles.haveRole('UserAdmin');
    this.loginedUser = Roles.getUser();
    this.retrieveUser();
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
