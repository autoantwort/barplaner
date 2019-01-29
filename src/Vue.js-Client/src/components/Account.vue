<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3">
        <form class="was-validated" id="form">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="password" style="display:none;">
            <input
              type="text"
              class="form-control"
              id="name"
              v-model="user.name"
              name="name"
              required
              pattern=".{2,}"
              autocomplete="new-password"
            >
            <div class="invalid-feedback">Minimum two characters.</div>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              class="form-control"
              id="password"
              v-model="password"
              pattern=".{8,}"
            >
            <div class="invalid-feedback">Minimum eight characters.</div>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" class="form-control" id="email" v-model="user.email">
          </div>
          <div class="form-group">
            <label for="phone">Telefonummer</label>
            <input type="text" class="form-control" id="phone" v-model="user.phone">
          </div>
          <div class="form-group">
            <label for="birthday">Geburtstag</label>
            <input
              type="text"
              class="form-control"
              id="birthday"
              v-model="user.birthday"
              pattern="[0-3]\d\.[0-1]\d\.[1-2]\d\d\d"
              title="dd.mm.yyyy"
            >
            <div class="invalid-feedback">Format: dd.mm.yyyy</div>
          </div>

          <div class="form-group">
            <label for="active">Active</label>
            <input type="checkbox" class="form-control" id="active" v-model="user.active">
          </div>
          <div class="form-group" v-if="user.telegramID.indexOf('login') === 0">
            <label>Dein Telegram Login Pin: {{user.telegramID.substr(11)}}</label>
            <a href="tg://resolve?domain=symposion_bot&start=true"  class="btn btn-success ml-4">Start Bot</a>
          </div>
          <div class="mt-2 mb-2 text-danger" v-if="errorString.length !== 0">{{errorString}}</div>
          <button type="button" v-on:click="updateUser" class="btn btn-success">Update information</button>
          <span class="ml-4 text-success" v-if="success">Success</span>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../http-common";
import Roles from "../roles";

export default {
  name: "account",
  data() {
    return {
      user: {
        id: 0,
        name: "",
        email: "",
        phone: "",
        birthday: "",
        active: false,
        telegramID: "",
      },
      errorString: "",
      password: "",
      success: false
    };
  },
  methods: {
    /* eslint-disable no-console */
    updateUser() {
      //check if form is valid
      if (document.getElementById("form").checkValidity() === false) {
        return;
      }

      let data = {
        name: this.user.name,
        password: this.password,
        email: this.user.email,
        phone: this.user.phone,
        active: this.user.active,
        birthday: this.user.birthday
      };

      http
        .put("/user/" + this.user.id, data)
        .then(response => {
          this.errorString = "";
          this.success = true;
          this.user.name = response.data.name;
          this.user.phone = response.data.phone;
          this.user.email = response.data.email;
          this.user.active = response.data.active;
          this.user.birthday = response.data.birthday;
          Roles.setUser(this.user);
          console.log("result : ", response.data);
          setTimeout(() => (this.success = false), 2000);
        })
        .catch(e => {
          console.log(JSON.parse(JSON.stringify(e)));
          if (e.response.status === 400) {            
            this.success = false;
            this.errorString =
              e.response.data.errors[0].type + ": " + e.response.data.errors[0].message;
          }
        });
    }
    /* eslint-enable no-console */
  },
  mounted() {
    this.user = Roles.getUser();
  }
};
</script>

<style>
</style>
