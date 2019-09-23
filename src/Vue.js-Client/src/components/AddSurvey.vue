<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3">
        <form id="addSpanForm" style="display:none" action="javascript:void(0);"></form>
        <form class="was-validated" id="form">
          <div class="form-group">
            <label for="question">Frage</label>
            <input
              type="text"
              class="form-control"
              id="question"
              required
              v-model="survey.question"
              name="question"
            />
            <div class="invalid-feedback">Required</div>
          </div>
          <div class="form-group">
            <label for="end">Ende der Umfrage</label>
            <input
              type="datetime-local"
              class="form-control"
              id="end"
              required
              pattern="[0-3]\d\.[0-1]\d\.\d\d [0-2]\d:[0-5]\d"
              title="dd.mm.yy hh:mm"
              v-model="survey.end"
            />
            <div class="invalid-feedback">Required. Format: dd.mm.yy hh:mm</div>
          </div>
          <div class="form-group">
            <label>Antwortmöglichkeiten</label>
            <ul class="list-group">
              <li class="list-group-item" v-for="(answer, index) in survey.answers" :key="index">
                {{answer}}
                <i
                  v-on:click="survey.answers.splice(index,1)"
                  class="fa fa-trash float-right"
                ></i>
              </li>
            </ul>
          </div>
          <div class="form-group">
            <label for="add-answer">Antwortmöglichkeit hinzufügen</label>
            <input
              type="text"
              class="form-control"
              id="add-answer"
              name="add-answer"
              v-on:keyup.enter="addAnswer"
              placeholder="Durch Enter hinzufügen"
            />
          </div>

          <label>Antwortmöglichkeiten für Zeitraum hinzufügen</label>
          <div class="form-row">
            <div class="col-auto">
              <label for="date" style="width:1px">Datum</label>
              <input
                type="date"
                class="form-control form-control-sm mb-2"
                id="date"
                form="addSpanForm"
                required
              />
            </div>
            <div class="col-auto">
              <label for="from" style="width:1px">Von</label>
              <select id="from" class="form-control form-control-sm" required></select>
            </div>
            <div class="col-auto">
              <label for="to" style="width:1px">Bis</label>
              <select id="to" class="form-control form-control-sm" required></select>
            </div>
            <div class="col-auto">
              <label for="btn-add" style="width:1px">Fragen</label>
              <button
                id="btn-add"
                class="form-control form-control-sm btn btn-sm btn-success"
                form="addSpanForm"
                v-on:click="addFragen"
              >Add</button>
            </div>
          </div>

          <div class="form-group">
            <label for="multipleAnswers">Mehrfachantworten erlaubt</label>
            <input
              type="checkbox"
              class="form-control"
              id="multipleAnswers"
              name="multipleAnswers"
              v-model="survey.allowMultipleAnswers"
            />
          </div>
          <div class="mt-2 mb-2 text-danger" v-if="errorString.length !== 0">{{errorString}}</div>
          <button type="button" v-on:click="createSurvey" class="btn btn-success">Erstelle Umfrage</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../http-common";
import Roles from "../roles";

function parseDate(input) {
  let sub = function(start) {
    return input.substring(start, start + 2);
  };
  //"dd.mm.yy hh:mm"
  // 01 34 67 91 23
  return new Date("20" + sub(6), sub(3) - 1, sub(0), sub(9), sub(12));
}

export default {
  name: "add-survey",
  data() {
    return {
      survey: {
        id: 0,
        question: "",
        end: "",
        allowMultipleAnswers: false,
        answers: []
      },
      supportDateTime: true,
      errorString: ""
    };
  },
  methods: {
    /* eslint-disable no-console */
    addAnswer() {
      const e = document.getElementById("add-answer");
      if (e.value.length > 0) {
        this.survey.answers.push(e.value);
        e.value = "";
      }
    },
    addFragen() {
      //check if form is valid
      if (document.getElementById("addSpanForm").checkValidity() === false) {
        return;
      }
      const dateE = document.getElementById("date");
      const fromE = document.getElementById("from");
      const toE = document.getElementById("to");
      const date = dateE.valueAsDate;
      const from = Number(fromE.value);
      const to = Number(toE.value);
      for (let i = from; i < to; ++i) {
        this.survey.answers.push(
          date.toLocaleDateString("de-DE", { weekday: "long" }) +
            "s (" +
            date.getDate() +
            "." +
            ((date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1)) +
            ") von " +
            i +
            " bis " +
            (i + 1) +
            " Uhr"
        );
      }
      this.survey.allowMultipleAnswers = true;
    },
    createSurvey() {
      //check if form is valid
      if (document.getElementById("form").checkValidity() === false) {
        return;
      }
      if (this.survey.answers.length < 2) {
        this.errorString =
          "Es müssen mindestens zwei Antwortmöglichkeiten existieren.";
        return;
      }
      const end = this.supportDateTime
        ? new Date(this.survey.end)
        : parseDate(this.survey.end);
      // check if the date is invalid
      if (isNaN(end)) {
        this.errorString = "Das Enddatum hat ein falsches Format.";
        return;
      }
      const creatorId = Roles.getUser().id;
      http
        .post("/survey", {
          question: this.survey.question,
          end: end,
          creatorId: creatorId,
          answers: this.survey.answers,
          allowMultipleAnswers: this.survey.allowMultipleAnswers
        })
        .then(response => {
          if (response !== undefined) {
            if (response.status === 201) {
              this.errorString = "";
              this.$router.push({ name: "survey-list" });
            } else if (response.status === 200) {
              this.errorString =
                response.data.errors[0].message +
                ", value: " +
                response.data.errors[0].value;
            }
          } else {
            this.errorString = "Network error :(";
          }
        })
        .catch(e => {
          console.log("Catch ", e);
        });
    }
    /* eslint-enable no-console */
  },
  mounted() {
    // init the selects
    const from = document.getElementById("from");
    const to = document.getElementById("to");
    for (let i = 0; i <= 24; ++i) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.innerHTML = i;
      from.appendChild(opt.cloneNode(true));
      to.appendChild(opt);
    }

    // check if datetime-local is supported
    const i = document.createElement("input");
    i.setAttribute("type", "datetime-local");
    this.supportDateTime = i.type !== "text";
    // set min date to today
    const local = new Date();
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    const dateString = local.toJSON().slice(0, 10);
    document.getElementById("date").min = dateString;
    document.getElementById("end").min = dateString;
  }
};
</script>

<style>
select.form-control {
  padding-right: calc(1em + 0.2rem) !important;
}
</style>
