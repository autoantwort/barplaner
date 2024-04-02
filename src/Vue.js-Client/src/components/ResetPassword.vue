<template>
  <div id="app" class="container-fluid">
    <div class="row vertical-align">
      <div class="col-12 col-md-8 offset-md-3 col-lg-6 offset-lg-3">
        <div v-if="validKey" class="card">
          <div class="card-header">Reset Password</div>
          <form class="card-body" action="javascript:void(0);">
            <div class="form-group">
              <label for="pw1">Password:</label>
              <input type="password" class="form-control" id="pw1" required v-model="newPassword1" minlength="8">
            </div>
            <div class="form-group">
              <label for="pw2">Repeat password:</label>
              <input type="password" class="form-control" v-bind:class="{ 'is-invalid': wrongData }" id="pw2" required v-model="newPassword2">
            </div>
            <div style="display: flex;align-items: center;">
              <button type="submit" :disabled="newPassword1.length < 8 || newPassword1 !== newPassword2" class="btn btn-warning" v-on:click="reset">Reset
                password</button>
            </div>
          </form>
          <!--<div class="card-footer">Footer</div> -->
        </div>
        <div v-else>Invalid reset key. Maybe it was already used or a new one was generated. <a v-on:click="requestNew">Request new one.</a></div>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../http-common";

export default {
  name: "ResetPassword",
  props: ["token"],
  data() {
    return {
      newPassword1: "",
      newPassword2: "",
      validKey: true,
      wrongData: false,
    };
  },
  methods: {
    /* eslint-disable no-console */
    reset() {
      if (this.newPassword1 !== this.newPassword2) {
        this.wrongData = true;
        return;
      }
      const data = {
        password: this.newPassword1,
        token: this.token,
      };
      http
        .post("/users/resetPasswort", data)
        .then(response => {
          if (response.status === 200) {
            this.$router.push({name: "login"});
          } else {
            this.validKey = false;
          }
        })
        .catch(e => {
          this.validKey = false;
          console.log(e);
        });
    },
    requestNew() {
      this.$router.push({ name: "requestPasswordReset" });
    },
    /* eslint-enable no-console */
  },
  mounted() {
    http
      .post("/users/validPasswortResetKey", { token: this.token })
      .then(response => {
        this.validKey = response.status === 200;
      })
      .catch(e => {
        this.validKey = false;
      });
  }
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
