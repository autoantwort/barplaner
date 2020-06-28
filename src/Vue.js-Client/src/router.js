import Vue from "vue";
import Router from "vue-router";
import Login from "./components/Login.vue";
import Restricted from "./components/Restricted.vue";
import AddBar from "./components/AddBar.vue";
import AddUser from "./components/AddUser.vue";
import AddSurvey from "./components/AddSurvey.vue";
import SurveyList from "./components/SurveyList.vue";
import BarList from "./components/BarList.vue";
import UserList from "./components/UserList.vue";
import RoleList from "./components/RoleList.vue";
import DutyList from "./components/DutyList.vue";
import AddItemGroup from "./components/stock/AddItemGroup.vue";
import AddPosition from "./components/stock/AddPosition.vue";
import PositionList from "./components/stock/PositionList.vue";
import Position from "./components/stock/Position.vue";
import ItemGroup from "./components/stock/ItemGroup.vue";
import ItemList from "./components/stock/ItemList.vue";
import ItemGroupList from "./components/stock/ItemGroupList.vue";
import AddItem from "./components/stock/AddItem.vue";
import Item from "./components/stock/Item.vue";
import StockChanges from "./components/stock/StockChangesList.vue";
import ItemGroupStockList from "./components/stock/ItemGroupStockList.vue";
import ItemStockList from "./components/stock/ItemStockList.vue";
import AddStockChange from "./components/stock/AddStockChange.vue";
import Invoice from "./components/stock/Invoice.vue";
import InvoiceList from "./components/stock/InvoiceList.vue";
import Account from "./components/Account.vue";
import Settings from "./components/Settings.vue";
import RemoteVolumeControl from "./components/RemoteVolumeControl.vue";
import RemoteControlPane from "./components/RemoteControlPane.vue";
import axios from "./http-common";
import Roles from "./roles";

Vue.use(Router);

export default new Router({
    mode: "hash",
    routes: [{
            path: "/",
            name: "login",
            component: Login,
            beforeEnter: (to, from, next) => {
                if (Roles.getUser() === null) {
                    next();
                } else {
                    next({ name: 'bar-list' });
                }
            },
        },
        {
            path: '/logout',
            beforeEnter: (to, from, next) => {
                axios.post("/logout").then(() => {
                    Roles.setUser(null);
                    next({ name: 'login' });
                });
            },
        },
        {
            path: "/restricted",
            name: "restricted",
            component: Restricted,
            beforeEnter: (to, from, next) => {
                if (Roles.getUser() === null) {
                    next({ name: 'login' });
                } else {
                    next();
                }
            },
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
                path: "/addSurvey",
                name: "add-survey",
                component: AddSurvey,
            }, {
                path: "/surveyList",
                name: "survey-list",
                component: SurveyList,
            }, {
                path: "/account",
                name: "account",
                component: Account,
            }, {
                path: "/addPosition",
                name: "addPosition",
                component: AddPosition,
            }, {
                path: "/addItemGroup",
                name: "addItemGroup",
                component: AddItemGroup,
            }, {
                path: "/positions",
                name: "position-list",
                component: PositionList,
            }, {
                path: "/position/:positionId",
                name: "position",
                component: Position,
                props: true
            }, {
                path: "/itemGroup/:itemGroupId",
                name: "itemGroup",
                component: ItemGroup,
                props: true
            }, {
                path: "/item/:itemId",
                name: "item",
                component: Item,
                props: true
            }, {
                path: "/items",
                name: "items-list",
                component: ItemList,
            }, {
                path: "/itemGroups",
                name: "itemGroups-list",
                component: ItemGroupList,
            }, {
                path: "/addItem",
                name: "addItem",
                component: AddItem,
            }, {
                path: "/stockChanges",
                name: "stockChanges",
                component: StockChanges,
            }, {
                path: "/itemGroupStock",
                name: "itemGroupStock",
                component: ItemGroupStockList,
            }, {
                path: "/itemStock",
                name: "itemStock",
                component: ItemStockList,
            }, {
                path: "/addStockChange",
                name: "addStockChange",
                component: AddStockChange,
            }, {
                path: "/invoice/:invoiceId",
                name: "invoice",
                component: Invoice,
                props: true,
            }, {
                path: "/invoices",
                name: "invoiceList",
                component: InvoiceList,
            }, {
                path: "/addInvoice",
                name: "invoiceList",
                component: InvoiceList,
                props: {
                    addNew: true,
                },
            }, {
                path: "/settings",
                name: "settings",
                component: Settings,
            }, {
                path: "/remoteVolumeControl",
                name: "remote-volume-control",
                component: RemoteVolumeControl,
            }, {
                path: "/remoteControlPane",
                name: "remote-control-pane",
                component: RemoteControlPane,
            }, ]
        },
    ]
});