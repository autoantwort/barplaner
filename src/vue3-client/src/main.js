import './assets/main.css'

import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'
import App from './App.vue'
import router from './router'
import { printDate, printDateTime, printDayDateTime } from './dateFilters';

// Add the necessary CSS
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

const app = createApp(App)

// Setup filters as global properties
app.config.globalProperties.$filters = {
    asDate: (value) => printDate(value),
    asDateTime: (value) => printDateTime(value),
    asDayDateTime: (value) => printDayDateTime(value),
    asEuro: (n) => n === null ? "" : n.toLocaleString("de-DE", { maximumFractionDigits: 2 }) + " €"
}

app.use(router)
app.use(createBootstrap())

app.mount('#app')
