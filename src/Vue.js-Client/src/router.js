import Vue from "vue";
import Router from "vue-router";
import Login from "./components/Login.vue";
import Restricted from "./components/Restricted.vue";
import AddBar from "./components/AddBar.vue";
import AddUser from "./components/AddUser.vue";
import BarList from "./components/BarList.vue";
import UserList from "./components/UserList.vue";
import RoleList from "./components/RoleList.vue";
import DutyList from "./components/DutyList.vue";
import Account from "./components/Account.vue";
import Settings from "./components/Settings.vue";
import axios from "./http-common";

Vue.use(Router);

export default new Router({
    mode: "history",
    routes: [{
            path: "/",
            name: "login",
            component: Login,
        },
        {
            path: '/logout',
            beforeEnter: (to, from, next) => {
                axios.post("/logout").then(() => next({ name: 'login' }));
            },
        },
        {
            path: "/restricted",
            name: "restricted",
            component: Restricted,
            children: [{
                path: "/addBar",
                name: "addBar",
                component: AddBar,
            }, {
                path: "/bars",
                name: "bar-list",
                component: BarList,
            }, {
                path: "/users",
                name: "user-list",
                component: UserList,
            }, {
                path: "/roles",
                name: "role-list",
                component: RoleList,
            }, {
                path: "/duty",
                name: "duty-list",
                component: DutyList,
            }, {
                path: "/addUser",
                name: "add-user",
                component: AddUser,
            }, {
                path: "/account",
                name: "account",
                component: Account,
            }, {
                path: "/settings",
                name: "settings",
                component: Settings,
            }, ]
        },
    ]
});