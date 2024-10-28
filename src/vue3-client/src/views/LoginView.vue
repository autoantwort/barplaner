<template>
  <div class="container-fluid">
    <div class="row vertical-align">
      <div class="col-12 col-md-8 offset-md-3 col-lg-6 offset-lg-3">
        <div class="card">
          <div class="card-header">Login</div>
          <form class="card-body" action="javascript:void(0);">
            <div class="form-group">
              <label for="usr">Name:</label>
              <input type="text" class="form-control" v-bind:class="{ 'is-invalid': wrongData }" id="usr" required v-model="name" name="username" />
            </div>
            <div class="form-group">
              <label for="pwd">Password:</label>
              <input type="password" class="form-control" v-bind:class="{ 'is-invalid': wrongData }" id="pwd" required v-model="password" name="password" />
            </div>
            <button type="submit" class="btn btn-primary" v-on:click="login">Login</button>
            <button type="button" class="btn btn-warning ml-3" v-on:click="resetPassword">Reset Password</button>
          </form>
          <!--<div class="card-footer">Footer</div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';
import Roles from '@/roles';

export default {
  data() {
    return {
      name: '',
      password: '',
      wrongData: false,
    };
  },
  methods: {
    login() {
      var data = {
        name: this.name.trim(),
        password: this.password,
      };

      http
        .post('/login', data)
        .then(response => {
          let roles = response.data.roles.map(e => e.name);
          Roles.setRoles(roles);
          Roles.setUser(response.data.user);
          console.log(response.data);
          this.$router.push('bars');
        })
        .catch(e => {
          if (e.response.status === 401) {
            this.wrongData = true;
            return;
          }
          console.log(e);
        });
    },
    resetPassword() {
      this.$router.push('requestPasswordReset');
    },
  },
};
</script>

<style>
.vertical-align {
  padding-top: 46px;
  padding-bottom: 46px;
  min-height: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
}
</style>
