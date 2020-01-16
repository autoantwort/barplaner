import Vue from "vue";
import App from "./App.vue";
import router from './router';

import axios from './http-common';
import VueCollapse from 'vue2-collapse';
import Roles from './roles';

Vue.use(VueCollapse);
Vue.use(require('vue-moment'));

// see https://www.npmjs.com/package/@fortawesome/vue-fontawesome#recommended
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrashAlt, faPlay, faPause, faStop, faRedo, faStepForward } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
library.add(faTrashAlt, faPlay, faPause, faStop, faRedo, faStepForward);
Vue.component('font-awesome-icon', FontAwesomeIcon);

// see https://bootstrap-vue.js.org/docs/#using-module-bundlers
import { NavPlugin } from 'bootstrap-vue';
Vue.use(NavPlugin);

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

Vue.config.productionTip = false;

axios.interceptors.response.use(undefined, function(error) {
    if (error.response !== undefined && error.response.status === 401) {
        Roles.setUser(null);
        router.push({ name: 'login' });
    }
    return Promise.reject(error);
});

new Vue({
    router,
    render: h => h(App),
    performance: true
}).$mount("#app");