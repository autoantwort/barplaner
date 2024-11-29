import './assets/main.css';

import { createApp } from 'vue';
import { createBootstrap } from 'bootstrap-vue-next';
import App from './App.vue';
import router from './router';
import { printDate, printDateTime, printDayDateTime } from './dateFilters';

// Add the necessary CSS
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import axios from './http-common';
import roles from './roles';

const app = createApp(App);

// Setup filters as global properties
app.config.globalProperties.$filters = {
  asDate: value => printDate(value),
  asDateTime: value => printDateTime(value),
  asDayDateTime: value => printDayDateTime(value),
  asEuro: n => (n === null ? '' : n.toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' €'),
};

app.use(router);
app.use(createBootstrap());

axios.interceptors.response.use(undefined, function (error) {
  if (error.response !== undefined && error.response.status === 401) {
    roles.setUser(null);
    router.push({ name: 'login' }).catch(console.error);
  }
  return Promise.reject(error);
});

app.mount('#app');
