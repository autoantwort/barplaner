<template>
  <div id="restricted">
    <nav class="navbar navbar-expand-sm bg-light navbar-light justify-content-end">
      <!-- <a class="navbar-brand" href="#">Menü</a> -->
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
        v-on:click="showNav = !showNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div
        class="collapse navbar-collapse"
        id="navbarSupportedContent"
        v-bind:class="{ 'show': showNav }"
      >
        <ul class="navbar-nav mx-auto">
          <li v-if="barAdmin" class="nav-item">
            <router-link class="nav-link" to="/addBar">Add Bar</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/bars">All bars</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/users">Users</router-link>
          </li>
          <li v-if="userAdmin" class="nav-item">
            <router-link class="nav-link" to="/roles">Roles</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/duty">Putzen</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/surveyList">Umfragen</router-link>
          </li>
          <li class="nav-item" v-if="cleaningAdmin">
            <router-link class="nav-link" to="/settings">Settings</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/account">Account</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/logout">Logout</router-link>
          </li>
        </ul>
      </div>
    </nav>
    <div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import Roles from "../roles";

export default {
  name: "app",
  data() {
    return {
      showNav: true,
      cleaningAdmin: false,
      userAdmin: false,
      barAdmin: false,
    };
  },
  mounted() {
    this.cleaningAdmin = Roles.haveRole("CleaningAdmin");
    this.userAdmin = Roles.haveRole("UserAdmin");
    this.barAdmin = Roles.haveRole("BarAdmin");
  }
};
</script>

<style>
</style>
