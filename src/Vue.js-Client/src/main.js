import Vue from "vue";
import App from "./App.vue";
import router from './router';

import axios from './http-common';
import VueCollapse from 'vue2-collapse';
import Roles from './roles'

Vue.use(VueCollapse);
Vue.use(require('vue-moment'));

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