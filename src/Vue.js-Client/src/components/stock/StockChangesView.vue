<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10">
        <div class="row mt-3">
          <div class="col-md-12 col-lg-6">
            <div class="input-group">
              <b-form-datepicker
                v-on:input="dateSelected"
                v-model="selectedDate"
                :disabled="datesSet === null"
                start-weekday="1"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' }"
                :date-disabled-fn="isDateDisabled"
                locale="de"
                placeholder="Jump to date"
              ></b-form-datepicker>
              <div class="input-group-append">
                <span class="input-group-text" id="basic-addon2">Include:</span>
              </div>
              <div class="input-group-append">
                <b-dropdown v-bind:text="include" v-model="include" style="min-width: 124px">
                  <b-dropdown-item v-on:click="include = 'Date only'">Date only</b-dropdown-item>
                  <b-dropdown-item v-on:click="include = '+ 1 Day'">+ 1 Day</b-dropdown-item>
                  <b-dropdown-item v-on:click="include = '+/- 1 Day'">+/- 1 Day</b-dropdown-item>
                  <b-dropdown-item v-on:click="include = 'Neighbours'">Neighbours</b-dropdown-item>
                </b-dropdown>
              </div>
            </div>
          </div>

          <div class="col-7 text-right col-xs-8 col-md-9 mt-1 col-lg-3 mt-lg-0 text-md-center">
            <button class="btn btn-primary" v-on:click="showLatestChanges">Latest Changes</button>
          </div>

          <div class="col-5 col-xs-4 col-md-3 mt-1 col-lg-3 mt-lg-0 text-right">
            <router-link class="btn btn-success" to="/addStockChange">Add Change</router-link>
          </div>
        </div>
        <div class="mt-3 mb-3">
          <stock-changes-list :changes="changes" :showItem="true">
            <template v-slot:before>
              <tr v-if="nextIndex !== null && offset === null">
                <td style="text-align: center; padding: 0px" colspan="5">
                  <button type="button" class="btn btn-primary btn-sm my-1" v-on:click="loadNewerChanges">
                    Load {{ datesList[nextIndex] | asDayDateTime }}
                  </button>
                </td>
              </tr>
            </template>
            <template v-slot:after>
              <tr v-if="previousIndex !== null && offset === null">
                <td style="text-align: center; padding: 0px" colspan="5">
                  <button type="button" class="btn btn-primary btn-sm my-1" v-on:click="loadOlderChanges">
                    Load {{ datesList[previousIndex] | asDayDateTime }}
                  </button>
                </td>
              </tr>
              <tr v-if="!rangeFromQuery && selectedDate === null && olderChangesExists">
                <td style="text-align: center; padding: 0px" colspan="5">
                  <button type="button" class="btn btn-primary btn-sm my-1" v-on:click="retrieveChanges">
                    Load older changes
                  </button>
                </td>
              </tr>
            </template>
          </stock-changes-list>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../../http-common";
import StockChangesList from "./StockChangesList";

export default {
  name: "stockChangesView",
  data() {
    return {
      changes: [],
      datesList: null,
      datesSet: null,
      selectedDate: null,
      include: "+/- 1 Day",
      previousIndex: null,
      nextIndex: null,
      offset: null,
      rangeFromQuery: false,
      olderChangesExists: false, // for the button 'Load older Changes'
    };
  },
  components: {
    StockChangesList,
  },
  methods: {
    /* eslint-disable no-console */
    isDateDisabled(dateAsString) {
      if (this.datesSet === null) return true;
      return !this.datesSet.has(dateAsString);
    },
    showLatestChanges() {
      this.$router.replace({
        name: this.$route.name,
        query: { ...this.$route.query, from: undefined, to: undefined },
      });
      this.selectedDate = null;
      this.retrieveChanges();
    },
    selectDate(from, to) {
      if (!from || !to) {
        return false;
      }
      // wo do not show new newest changes any more => reset offset
      this.offset = null;
      const highlight = this.selectedDate ? "&highlight=" + this.selectedDate : "";
      http
        .get("/stockChanges?from=" + from + "&to=" + to + highlight)
        .then((response) => {
          this.changes = response.data;
        })
        .catch(console.error);
      return true;
    },
    dateSelected() {
      // YYYY-MM-DD
      // 0123456789
      const index = this.datesList.indexOf(this.selectedDate);
      let date = new Date(this.selectedDate);
      let from, to;
      let previousIndex = index === 0 ? null : index - 1;
      let nextIndex = index === this.datesList.length - 1 ? null : index + 1;
      const moveAfter = (date) => {
        while (nextIndex !== null && this.datesList[nextIndex] <= date) {
          nextIndex = nextIndex === this.datesList.length - 1 ? null : nextIndex + 1;
        }
      };
      if (this.include === "Date only") {
        to = from = date.toISOString().substring(0, 10);
      } else if (this.include === "+ 1 Day") {
        from = date.toISOString().substring(0, 10);
        date.setDate(date.getDate() + 1);
        to = date.toISOString().substring(0, 10);
        moveAfter(to);
      } else if (this.include === "+/- 1 Day") {
        date.setDate(date.getDate() - 1);
        from = date.toISOString().substring(0, 10);
        if (previousIndex !== null && this.datesList[previousIndex] === from) {
          previousIndex = previousIndex === 0 ? null : previousIndex - 1;
        }
        date.setDate(date.getDate() + 2);
        to = date.toISOString().substring(0, 10);
        moveAfter(to);
      } else if (this.include === "Neighbours") {
        // search previous neighbours
        const pre = new Date(date);
        pre.setDate(pre.getDate() - 1);
        while (previousIndex !== null && pre.toISOString().startsWith(this.datesList[previousIndex])) {
          pre.setDate(pre.getDate() - 1);
          previousIndex = previousIndex === 0 ? null : previousIndex - 1;
        }
        pre.setDate(pre.getDate() + 1);
        from = pre.toISOString().substring(0, 10);
        // search next neighbours
        date.setDate(date.getDate() + 1);
        while (nextIndex !== null && date.toISOString().startsWith(this.datesList[nextIndex])) {
          date.setDate(date.getDate() + 1);
          nextIndex = nextIndex === this.datesList.length - 1 ? null : nextIndex + 1;
        }
        date.setDate(date.getDate() - 1);
        to = date.toISOString().substring(0, 10);
      }
      // triggers watch change:
      this.$router.replace({
        name: this.$route.name,
        query: { ...this.$route.query, from, to },
      });
      this.nextIndex = nextIndex;
      this.previousIndex = previousIndex;
    },
    loadNewerChanges() {
      const date = this.datesList[this.nextIndex];
      const newUrl = window.location.hash.replace(/to=\d{4}-\d{2}-\d{2}/, "to=" + date);
      this.nextIndex = this.nextIndex === this.datesList.length - 1 ? null : this.nextIndex + 1;
      http
        .get("/" + date + "/stockChanges")
        .then((response) => {
          this.changes = response.data.concat(this.changes);
        })
        .catch(console.error);
      // we use the browser api, so that we don't trigger the vue watcher
      history.replaceState(history.state, "Newer", newUrl);
    },
    loadOlderChanges() {
      const date = this.datesList[this.previousIndex];
      const newUrl = window.location.hash.replace(/from=\d{4}-\d{2}-\d{2}/, "from=" + date);
      this.previousIndex = this.previousIndex === 0 ? null : this.previousIndex - 1;
      http
        .get("/" + date + "/stockChanges")
        .then((response) => {
          this.changes = this.changes.concat(response.data);
        })
        .catch(console.error);
      // we use the browser api, so that we don't trigger the vue watcher
      history.replaceState(history.state, "Older", newUrl);
    },
    retrieveChanges() {
      this.rangeFromQuery = false;
      const wasOffset = this.offset !== null;
      const offset = wasOffset ? "&offset=" + this.offset : "";
      const limit = this.$route.query.limit || 100;
      http
        .get("/stockChanges?limit=" + limit + offset)
        .then((response) => {
          this.olderChangesExists = response.data.length >= limit;
          if (wasOffset) {
            this.changes = this.changes.concat(response.data);
            this.offset += limit;
          } else {
            this.changes = response.data;
            this.offset = limit;
          }
        })
        .catch(console.error);
    },
    retrieveDates(callback) {
      http
        .get("/stockChanges/dates")
        .then((response) => {
          this.datesSet = new Set(response.data);
          this.datesList = response.data;
          if (callback) callback();
        })
        .catch(console.error);
    },
  },
  watch: {
    "$route.query"() {
      this.selectDate(this.$route.query.to, this.$route.query.from);
    },
    include: function () {
      if (this.selectedDate) {
        this.dateSelected();
      }
    },
  },
  mounted() {
    if (this.selectDate(this.$route.query.to, this.$route.query.from)) {
      this.rangeFromQuery = true;
      this.retrieveDates(() => {
        // find the previous and next Index
        const l = this.datesList.length;
        let i = 0;
        for (; i < l; i++) {
          if (this.datesList[i] >= this.$route.query.from) {
            if (i !== 0) this.previousIndex = i - 1;
            break;
          }
        }
        for (; i < l; i++) {
          if (this.datesList[i] >= this.$route.query.to) {
            if (i !== l - 1) this.nextIndex = i + 1;
            break;
          }
        }
      });
    } else {
      this.retrieveChanges();
      this.retrieveDates();
    }

    /* eslint-enable no-console */
  },
};
</script>


<style>
.tooltip {
  top: 10px !important;
}
/* Für die Animation wenn man einen Tag auswählt (Die Zeilen werden hervorgehoben): */
@keyframes highlight {
  0% {
    background: #17a2b8;
  }
  30% {
    background: #17a2b8;
  }
  100% {
    background: none;
  }
}

.highlight {
  animation: highlight 2s;
}
a:not([href]) {
  color: #007bff !important;
}
a:not([href]):hover {
  color: #0056b3 !important;
}
</style>
