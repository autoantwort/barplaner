<template>
  <div class="container">
    <div class="row mt-3">
      <div class="col-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3">
        <div v-if="!submitted">
          <form class="was-validated" id="form">
            <div class="form-group">
              <label for="name">Name</label>
              <input
                type="text"
                class="form-control"
                id="name"
                required
                v-model="bar.name"
                name="name"
              >
              <div class="invalid-feedback">Required</div>
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <input
                type="text"
                class="form-control"
                id="description"
                v-model="bar.description"
                name="description"
              >
            </div>
            <div class="form-group">
              <label for="public">Public</label>
              <input
                type="checkbox"
                class="form-control"
                id="public"
                v-model="bar.public"
                name="public"
              >
            </div>
            <div class="form-group">
              <label for="start">Start time</label>
              <input
                type="text"
                class="form-control"
                id="start"
                required
                v-model="bar.start"
                name="start"
                pattern="[0-3]\d\.[0-1]\d\.\d\d [0-2]\d:[0-5]\d"
                title="dd.mm.yy hh:mm"
              >
              <div class="invalid-feedback">Required. Format: dd.mm.yy hh:mm</div>
            </div>
            <div class="form-group">
              <label for="end">End time</label>
              <input
                type="text"
                class="form-control"
                id="end"
                v-model="bar.end"
                name="end"
                pattern="[0-3]\d\.[0-1]\d\.\d\d [0-2]\d:[0-5]\d"
                title="dd.mm.yy hh:mm"
              >
              <div class="invalid-feedback">Format: dd.mm.yy hh:mm</div>
            </div>
            <div class="form-group">
              <label for="count">Number of people to clean</label>
              <input
                type="number"
                class="form-control"
                id="count"
                v-model="bar.numberOfPersonsToClean"
                name="end"
                required
                min="0"
              >
              <div class="invalid-feedback">Required.</div>
            </div>

            <button type="button" v-on:click="addBar" class="btn btn-success">Add Bar</button>
          </form>
        </div>

        <div v-else>
          <h4>Bar submitted successfully!</h4>
          <button class="btn btn-success" v-on:click="newBar">Add another Bar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../http-common";

function parseDate(input) {
  let sub = function(start) {
    return input.substring(start, start + 2);
  };
  //"dd.mm.yy hh:mm"
  // 01 34 67 91 23
  return new Date("20" + sub(6), sub(3) - 1, sub(0), sub(9), sub(12));
}
/*function toString(input) {
  let sub = function(start) {
    return input.substring(start, start + 2);
  };
  //"dd.mm.yy hh:mm"
  // 01 34 67 91 23
  return new Date("20" + sub(6) - 1, sub(3), sub(0), sub(9), sub(12));
}*/

export default {
  name: "add-bar",
  data() {
    return {
      bar: {
        id: 0,
        name: "",
        description: "",
        public: true,
        start: "",
        end: "",
        numberOfPersonsToClean: 2
      },
      submitted: false
    };
  },
  methods: {
    /* eslint-disable no-console */
    addBar() {
      //check if form is valid
      if (document.getElementById("form").checkValidity() === false) {
        return;
      }
      var data = {
        name: this.bar.name,
        description: this.bar.description,
        public: this.bar.public,
        start: parseDate(this.bar.start),
        end: this.bar.end === "" ? null : parseDate(this.bar.end),
        numberOfPersonsToClean: this.bar.numberOfPersonsToClean
      };

      http
        .post("/bar", data)
        .then(response => {
          this.bar.id = response.data.id;
          console.log(response.data);
          this.submitted = true;
        })
        .catch(e => {
          console.log(e);
        });
    },
    newBar() {
      this.submitted = false;
      this.bar = {
        id: 0,
        name: "",
        description: "",
        public: true,
        start: "",
        end: ""
      };
    },
    retrieveDefaultNumberOfPersonToClean() {
      // TODO only availible if you are an CleaningAdmin
      http
        .get("/setting/defaultNumberOfPersonsToClean")
        .then(response => {
          this.bar.numberOfPersonsToClean = response.data.value;
          console.log(this.bar.numberOfPersonsToClean);
        })
        .catch(e => {
          console.log(e);
        });
    },

    /* eslint-enable no-console */
  },
  mounted() {
    this.retrieveDefaultNumberOfPersonToClean();
  }
};
</script>

<style>
</style>
