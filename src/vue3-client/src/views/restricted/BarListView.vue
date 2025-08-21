<template>
  <div class="container">
    <div class="row">
      <div class="col-12 offset-md-1 col-md-10 offset-lg-2 col-lg-8">
        <div v-if="loading" class="text-center mt-3 mb-3">Die Daten werden aktualisiert...</div>
        <!-- new bars -->
        <div v-for="bar in bars" :key="bar.id">
          <div class="card mt-3 mb-3">
            <div class="card-header text-center pressable text-primary d-flex justify-content-between align-items-center" @click="bar.show = !bar.show">
              <div></div>
              {{ bar.name }} ({{ $filters.asDate(bar.start) }}) {{ bar.canceled ? 'Abgesagt' : '' }}
              <button v-if="cleaningAdmin && bar.start > now" @click.stop="sendBarId = bar.id; modal = true" class="btn btn-sm"><i-fa-paper-plane
                  title="Send Telegram" /></button>
              <div v-else></div>
            </div>
            <div>
              <BCollapse v-model="bar.show">
                <div class="card-body" v-if="!bar.canceled">
                  <!-- <div class="m-2 text-center" v-if="bar.start > now && cleaningAdmin">
                    <input class="form-control" style="display:inline;max-width:60px" type="number" min="0" value="2"> Personen zum putzen zuordnen lassen?
                    <button class="btn btn-primary" title="Es wird nur die Differenz zwischen schon zugeteilten und soll Anzahl hinzugefüt">Ja</button>
                    </div>-->
                  <div class="table-responsive">
                    <table class="table">
                      <thead>
                        <tr>
                          <th scope="col">Putzen</th>
                          <th scope="col">Name</th>
                          <th scope="col">Status</th>
                          <th scope="col">was</th>
                          <th scope="col">von</th>
                          <th scope="col">bis</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="duty in bar.duties" :key="duty.id">
                          <th v-if="cleaningAdmin /*|| (user.id === duty.userID &&!duty.have_to_clean && bar.start > now)*/ /*sich selber eintragen*/">
                            <input type="checkbox" v-on:click="updateActive(bar.id, duty.userID, $event)" v-model="duty.have_to_clean" :false-value="0"
                              :true-value="1" />
                          </th>
                          <th v-else-if="duty.have_to_clean">❌</th>
                          <th v-else></th>
                          <td>{{ duty['user.name'] }}</td>
                          <td v-if="user.id === duty.userID && bar.start > now">
                            <select class="form-control minWidth" v-model="duty.state" @change="save(duty)">
                              <option v-if="duty.state === 'no_info'" disabled value="no_info">Please select</option>
                              <option value="present">Komme</option>
                              <option value="absent">Komme nicht</option>
                            </select>
                          </td>
                          <template v-else>
                            <td v-if="duty.state === 'no_info'">Keine Information</td>
                            <td v-else-if="duty.state === 'present'">Kommt</td>
                            <td v-else>Kommt nicht</td>
                          </template>
                          <template v-if="duty.userID === user.id && bar.start > now">
                            <td>
                              <select class="form-control minWidth" v-model="duty.job" @change="save(duty)"
                                :style="duty.state === 'present' ? 'visibility:visible;' : 'visibility:hidden;'">
                                <option>Biertheke</option>
                                <option>Cocktailtheke</option>
                              </select>
                              <!-- <vue-single-select
                          :style="duty.state==='present'?'visibility:visible;':'visibility:hidden;'"
                          v-model="duty.job"
                          :options="['Biertheke','Cocktailtheke']"
                          :required="true"
                                ></vue-single-select>-->
                            </td>
                            <td>
                              <select class="form-control minWidth" v-model="duty.from" @change="save(duty)"
                                :style="duty.state === 'present' ? 'visibility:visible;' : 'visibility:hidden;'">
                                <option>20:00</option>
                                <option>20:30</option>
                                <option>21:00</option>
                                <option>21:30</option>
                                <option>22:00</option>
                                <option>22:30</option>
                                <option>23:00</option>
                                <option>23:30</option>
                                <option>00:00</option>
                                <option>00:30</option>
                                <option>01:00</option>
                              </select>
                              <!-- <vue-single-select
                          :style="duty.state==='present'?'visibility:visible;':'visibility:hidden;'"
                          v-model="duty.from"
                          :options="['Anfang(20:00)','20:30','21:00','21:30','22:00','22:30','23:00','23:30','24:00','00:30','01:00']"
                          :required="true"
                                ></vue-single-select>-->
                            </td>
                            <td>
                              <select class="form-control minWidth" v-model="duty.to" @change="save(duty)"
                                :style="duty.state === 'present' ? 'visibility:visible;' : 'visibility:hidden;'">
                                <option>Ende</option>
                                <option>22:00</option>
                                <option>22:30</option>
                                <option>23:00</option>
                                <option>23:30</option>
                                <option>00:00</option>
                                <option>00:30</option>
                                <option>01:00</option>
                                <option>01:30</option>
                                <option>02:00</option>
                                <option>02:30</option>
                                <option>03:00</option>
                                <option>03:30</option>
                                <option>04:00</option>
                                <option>04:30</option>
                                <option>05:00</option>
                                <option>05:30</option>
                                <option>06:00</option>
                                <option>06:30</option>
                              </select>
                              <!-- <vue-single-select
                          :style="duty.state==='present'?'visibility:visible;':'visibility:hidden;'"
                          v-model="duty.to"
                          :options="['Ende','22:30','23:00','23:30','24:00','00:30','01:00','01:30','02:00','02:30','03:00','03:30','04:00','04:30','05:00','05:30','06:00','06:30','07:00']"
                          :required="true"
                          @change.native="save"
                                ></vue-single-select>-->
                            </td>
                          </template>
                          <template v-else-if="duty.state === 'present'">
                            <td>{{ duty.job }}</td>
                            <td>{{ duty.from }}</td>
                            <td>{{ duty.to }}</td>
                          </template>
                          <template v-else>
                            <td></td>
                            <td></td>
                            <td></td>
                          </template>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </BCollapse>
            </div>
          </div>
        </div>

        <!-- Old bars, same code, but needs some time to render -->
        <div v-if="oldBars.length === 0" class="text-center mt-3 mb-3">Alte Bars laden...</div>
        <div v-else v-for="bar in oldBars" :key="bar.id">
          <div class="card mt-3 mb-3">
            <div class="card-header text-center">{{ bar.name }} ({{ $filters.asDate(bar.start) }}) {{ bar.canceled ? 'Abgesagt' : '' }}</div>
            <div class="card-body" v-if="!bar.canceled">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th scope="col">Putzen</th>
                      <th scope="col">Name</th>
                      <th scope="col">Status</th>
                      <th scope="col">was</th>
                      <th scope="col">von</th>
                      <th scope="col">bis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="duty in bar.duties" :key="duty.id">
                      <th v-if="duty.have_to_clean">❌</th>
                      <th v-else></th>
                      <td>{{ duty['user.name'] }}</td>
                      <template v-if="duty.state === 'present'">
                        <td>War da</td>
                        <td>{{ duty.job }}</td>
                        <td>{{ duty.from }}</td>
                        <td>{{ duty.to }}</td>
                      </template>
                      <template v-else>
                        <td v-if="duty.state === 'no_info'">Keine Information</td>
                        <td v-else>War nicht da</td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </template>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div v-if="oldBars.length !== 0 && veryOldBars.length !== 0" class="text-center mt-3 mb-3">
          <button class="btn btn-primary" @click="renderAllOldBars">Alle alten Bars laden (rendern kann dauern)</button>
        </div>
        <!-- End code dublication -->
      </div>
    </div>
    <BToastOrchestrator />
    <BModal v-model="modal" ok-title="Send" @ok="sendTelegram">Telegram Bot Umfrage "Wer kommt wann?" versenden?<br>
      <small>(Nur an die Leute, die noch nicht abgestimmt haben)</small>
    </BModal>
  </div>
</template>

<script>
import http from '@/http-common';
import Bars from '@/bars';
import Roles from '@/roles';
import { useToastController } from 'bootstrap-vue-next';

export default {
  data() {
    return {
      bars: [],
      oldBars: [],
      veryOldBars: [],
      loading: true,
      user: {},
      cleaningAdmin: false,
      cleaningBreakpoint: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // you can change the cleaning state for bars that are not older then 7 days
      now: new Date(),
      sendBarId: null,
      modal: false,
    };
  },
  setup() {
    const { show } = useToastController();
    return { show };
  },
  methods: {
    retrieveBars() {
      http
        .get('/bars/duties')
        .then(response => {
          for (let i = 0; i < response.data.length; ++i) {
            response.data[i].start = new Date(response.data[i].start);
            response.data[i].end = new Date(response.data[i].end);
          }
          let bars = response.data.filter(b => b.start > this.cleaningBreakpoint); // JSON are parsed automatically.
          let hasNew = false;
          for (let i = bars.length - 1; i >= 0; --i) {
            if (hasNew) {
              bars[i].show = false;
            } else {
              bars[i].show = !bars[i].canceled;
              console.log(bars[i].end > bars[i].start);
              console.log(bars[i].end < new Date());
              console.log(bars[i].start < new Date());
              if ((bars[i].end > bars[i].start && bars[i].end > new Date()) || bars[i].start > new Date()) {
                hasNew = true;
              }
              console.log('hasNew', hasNew);
            }
          }
          this.bars = bars;
          this.loading = false;
          Bars.setBars(this.bars);

          // let timeout = 0;
          // const BATCH_SIZE = 20;
          // this.oldBars = [];
          // for (let i = 0; i < response.data.length; i += BATCH_SIZE) {
          //   setTimeout(() => {
          //     let old = [];
          //     for (
          //       let k = i;
          //       k < response.data.length && k < i + BATCH_SIZE;
          //       ++k
          //     ) {
          //       if (response.data[k].start < this.cleaningBreakpoint) {
          //         old.push(response.data[k]);
          //       }
          //     }
          //     //console.log(old.length);
          //     this.oldBars = this.oldBars.concat(old);
          //     //console.log(this.oldBars.length);
          //   }, timeout);
          //   timeout += 30;
          // }
          let counter = 0;
          let oldBars = [];
          for (let bar of response.data) {
            if (bar.start < this.cleaningBreakpoint) {
              if (++counter < 50) oldBars.push(bar);
              else {
                this.veryOldBars.push(bar);
              }
            }
          }
          setTimeout(() => {
            this.oldBars = oldBars;
          }, 500);
        })
        .catch(e => {
          console.log(e);
        });
    },
    refreshList() {
      this.retrieveBars();
    },
    updateActive(barID, userID, event) {
      var data = {
        have_to_clean: event.target.checked,
      };
      http
        .put('/bar/' + barID + '/duty/' + userID + '/cleaning', data)
        .then(() => {
          console.log('updated duty state');
        })
        .catch(e => {
          console.log(e);
        });
    },
    save(duty) {
      var data = {
        state: duty.state,
        job: duty.job,
        from: duty.from,
        to: duty.to,
      };
      http
        .put('/bar/' + duty.barID + '/duty/' + duty.userID, data)
        .then(response => {
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    },
    renderAllOldBars() {
      this.oldBars = this.oldBars.concat(this.veryOldBars);
      this.veryOldBars = [];
    },
    async sendTelegram() {
      this.modal = false;
      try {
        await http.post('/duty/' + this.sendBarId + '/sendTelegramNewsletter');
        this.show?.({
          props: {
            variant: 'info',
            pos: 'middle-center',
            value: 10000,
            body: 'Telegram Survey send',
          },
        });
      } catch (error) {
        this.show?.({
          props: {
            variant: 'danger',
            pos: 'middle-center',
            value: 10000,
            body: `Error while sending Telegram Survey: ${error.message}`,
          },
        });
      }
    }
  },
  mounted() {
    this.cleaningAdmin = Roles.haveRole('CleaningAdmin');
    this.user = Roles.getUser();
    this.bars = Bars.getBars();
    this.retrieveBars();
  },
};
</script>

<style>
.minWidth {
  min-width: 100px;
}

.pressable {
  cursor: pointer;
}
</style>
