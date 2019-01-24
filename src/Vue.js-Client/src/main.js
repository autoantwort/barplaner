import Vue from "vue";
import App from "./App.vue";
import router from './router';

import axios from './http-common';


Vue.use(require('vue-moment'));

Vue.config.productionTip = false;

axios.interceptors.response.use(undefined, function(error) {
    if (error.response !== undefined && error.response.status === 401) {
        router.push({ name: 'login' });
    }
    return Promise.reject(error);
});

new Vue({
    router,
    render: h => h(App),
    performance: true
}).$mount("#app");