<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3">
        <form class="was-validated" id="form">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="password" style="display:none;" />
            <input
              type="text"
              class="form-control"
              id="name"
              v-model="user.name"
              name="name"
              required
              pattern=".{2,}"
              autocomplete="new-password"
            />
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
            />
            <div class="invalid-feedback">Minimum eight characters.</div>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" class="form-control" id="email" v-model="user.email" />
          </div>
          <div class="form-group">
            <label for="phone">Telefonummer</label>
            <input type="text" class="form-control" id="phone" v-model="user.phone" />
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
            />
            <div class="invalid-feedback">Format: dd.mm.yyyy</div>
          </div>

          <div class="form-group">
            <label for="gitLabId">GitLab User ID</label>
            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://git.rwth-aachen.de/-/user_settings/profile#user_name"
                  class="btn btn-outline-link"
                >My GitLab User ID</a>
              </div>
              <input
                type="text"
                autocomplete="off"
                placeholder="Open the left link and determine your User ID"
                style="margin-right: 0px"
                class="form-control"
                id="gitLabId"
                v-model="user.gitLabID"
                pattern="\d+"
              />
              <div class="invalid-feedback">The GitLab User ID is a number.</div>
            </div>
          </div>

          <div>
            <b-form-checkbox
              id="active"
              v-model="user.active"
              name="active"
            >
              <div class="text-black">
                Active Bar AG Member
              </div>
            </b-form-checkbox>
          </div>

          <div>
            <b-form-checkbox
              id="only_show_gitlab_notifications_if_assigned"
              v-model="user.only_show_gitlab_notifications_if_assigned"
              name="only_show_gitlab_notifications_if_assigned"
            >
              <div class="text-black">
                Only show GitLab notifications if assigned
              </div>
            </b-form-checkbox>
          </div>

          <br>

          <div class="form-group" v-if="user.telegramID.indexOf('login') === 0">
            <label>Dein Telegram Login Pin: {{user.telegramID.substr(11)}}</label>
            <a
              href="https://t.me/symposion_bot"
              class="btn btn-success ml-4"
            >Start Bot</a>
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
        gitLabID: ""
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
        name: this.user.name.trim(),
        password: this.password,
        email: this.user.email,
        phone: this.user.phone,
        active: this.user.active,
        birthday: this.user.birthday,
        gitLabID: this.user.gitLabID,
        only_show_gitlab_notifications_if_assigned: this.user.only_show_gitlab_notifications_if_assigned,
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
          this.user.gitLabID = response.data.gitLabID;
          this.user.only_show_gitlab_notifications_if_assigned = response.data.only_show_gitlab_notifications_if_assigned;
          
          Roles.setUser(this.user);
          console.log("result : ", response.data);
          setTimeout(() => (this.success = false), 2000);
        })
        .catch(e => {
          console.log(JSON.parse(JSON.stringify(e)));
          if (e.response.status === 400) {
            this.success = false;
            this.errorString =
              e.response.data.errors[0].type +
              ": " +
              e.response.data.errors[0].message;
          }
        });
    }
    /* eslint-enable no-console */
  },
  async mounted() {
    this.user = Roles.getUser();
    try {
      this.user = (await http.get("/user/" + this.user.id)).data;
      Roles.setUser(this.user);
    } catch (error) {
      console.log(error); 
    }
  }
};
</script>

<style>
.btn-outline-link {
  color: #007bff;
  border-color: #28a745;
}
.btn-outline-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

.text-black {
  color: black;
}
</style>
