<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <div v-if="loading" class="text-center mt-3 mb-3">Die Daten werden aktualisiert...</div>
        <div class="mt-3 text-right">
          <router-link class="btn btn-success" to="/addSurvey">Umfrage erstellen</router-link>
        </div>
        <div v-for="survey in surveys" :key="survey.id">
          <div class="card mt-3 mb-3">
            <div
              class="card-header text-center"
            >{{survey.question}} ({{ survey.end | moment("DD.MM.YYYY") }})</div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th></th>
                      <th
                        v-for="(question,index) in survey.questions"
                        :key="index"
                        class="text-center"
                        scope="col"
                      >{{question}}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="answer in survey.answers" :key="answer.username">
                      <td>{{answer.username}}</td>
                      <td
                        v-for="(state, index) in answer.answers"
                        :key="index"
                        class="text-center"
                        v-bind:class="{ 'bg-success': state==='yes','bg-danger': survey.allowMultipleAnswers && state==='no' }"
                      >{{state === 'no_answer'?"-":""}}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../http-common";

export default {
  name: "survey-list",
  data() {
    return {
      surveys: [],
      loading: true,
      now: new Date()
    };
  },
  methods: {
    /* eslint-disable no-console */
    retrieveSurveys() {
      http
        .get("/surveys")
        .then(response => {
          this.loading = false;
          this.surveys = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    }
    /* eslint-enable no-console */
  },
  mounted() {
    this.retrieveSurveys();
  }
};
</script>

<style>
</style>
