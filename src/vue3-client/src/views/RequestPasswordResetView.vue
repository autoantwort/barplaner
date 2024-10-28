<template>
  <div id="app" class="container-fluid">
    <div class="row vertical-align">
      <div class="col-12 col-md-8 offset-md-3 col-lg-6 offset-lg-3">
        <div class="card">
          <div class="card-header">Reset Password</div>
          <form class="card-body" action="javascript:void(0);">
            <div class="form-group">
              <label for="mail">EMail:</label>
              <input type="email" class="form-control" v-bind:class="{ 'is-invalid': wrongData }" id="mail" required v-model="email" />
            </div>
            <div style="display: flex; align-items: center">
              <button type="submit" :disabled="state !== 'form'" class="btn btn-primary" v-on:click="login">Request password reset link</button>
              <b-spinner v-if="state === 'loading'" class="center m-1" variant="primary" label="Loading..."></b-spinner>
              <span class="ml-2">{{ result }}</span>
            </div>
          </form>
          <!--<div class="card-footer">Footer</div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';

export default {
  data() {
    return {
      email: '',
      wrongData: false,
      state: 'form',
      result: '',
    };
  },
  methods: {
    login() {
      var data = {
        mail: this.email.trim(),
      };
      if (this.email === '') {
        this.wrongData = true;
        return;
      }
      this.state = 'loading';
      http
        .post('/users/sendPasswordResetLink', data)
        .then(() => {
          this.wrongData = false;
          this.state = 'success';
          this.result = 'Password reset link sent';
        })
        .catch(e => {
          this.state = 'form';
          if (e.response.status === 404) {
            this.wrongData = true;
            this.result = 'Unknown email address';
            return;
          }
          this.result = 'Internal Error: ' + e.response.status + ' ' + e.response.statusText;
          console.log(e);
        });
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
