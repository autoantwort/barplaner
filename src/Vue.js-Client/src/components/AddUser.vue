<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3">
        
          <form class="was-validated" id="form">
            <div class="form-group">
              <label for="name">Name</label>
              <input
                type="text"
                class="form-control"
                id="name"
                required
                v-model="user.name"
                name="name"
              >
              <div class="invalid-feedback">Required</div>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                class="form-control"
                id="password"
                required
                v-model="user.password"
                pattern=".{8,}"
              >
              <div class="invalid-feedback">Required. Minimum eight characters.</div>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" class="form-control" id="email" required v-model="user.email">
              <div class="invalid-feedback">Required.</div>
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
            <div class="mt-2 mb-2 text-danger" v-if="errorString.length !== 0">{{errorString}}</div>
            <button type="button" v-on:click="addUser" class="btn btn-success">Add User</button>
          </form>
        </div>

      
    </div>
  </div>
</template>

<script>
import http from "../http-common";

export default {
  name: "add-user",
  data() {
    return {
      user: {
        id: 0,
        name: "",
        password: "",
        email: "",
        phone: "",
        birthday: ""
      },
      errorString: "",
    };
  },
  methods: {
    /* eslint-disable no-console */
    addUser() {
      //check if form is valid
      if (document.getElementById("form").checkValidity() === false) {
        return;
      }

      http
        .post("/user", this.user)
        .then(response => {
          if (response !== undefined) {
            if (response.status === 201) {
              this.user.id = response.data.id;              
              this.errorString = "";
              this.$router.push({name:"user-list"});
            } else if (response.status === 200) {
              this.errorString = response.data.errors[0].message + ", value: " +response.data.errors[0].value;
            }
          }else{
            this.errorString = "Network error :(";
          }
        })
        .catch(e => {
          console.log("Catch " , e);
        });
    }
    /* eslint-enable no-console */
  }
};
</script>

<style>
</style>
