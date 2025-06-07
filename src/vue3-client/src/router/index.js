import { createRouter, createWebHashHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import axios from '@/http-common';
import Roles from '@/roles';
import Restricted from '@/views/restricted/Restricted.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
      beforeEnter: (to, from, next) => {
        if (Roles.getUser() === null) {
          next();
        } else {
          next({ name: 'bar-list' });
        }
      },
    },
    {
      path: '/requestPasswordReset',
      name: 'requestPasswordReset',
      component: () => import('../views/RequestPasswordResetView.vue'),
    },
    {
      path: '/resetPassword/:token',
      name: 'resetPassword',
      props: true,
      component: () => import('../views/ResetPasswordView.vue'),
    },
    {
      path: '/logout',
      redirect: () => {
        Roles.setUser(null);
        axios.post('/logout');
        return { path: '/', name: 'login' };
      },
    },
    {
      path: '/restricted',
      name: 'restricted',
      component: Restricted,
      beforeEnter: (to, from, next) => {
        if (Roles.getUser() === null) {
          next({ name: 'login' });
        } else {
          next();
        }
      },
      children: [
        {
          path: '/addBar',
          name: 'addBar',
          component: () => import('../views/restricted/AddBarView.vue'),
        },
        {
          path: '/bars',
          name: 'bar-list',
          component: () => import('../views/restricted/BarListView.vue'),
        },
        {
          path: '/users',
          name: 'user-list',
          component: () => import('../views/restricted/UserListView.vue'),
        },
        {
          path: '/roles',
          name: 'role-list',
          component: () => import('../views/restricted/RoleListView.vue'),
        },
        {
          path: '/duty',
          name: 'duty-list',
          component: () => import('../views/restricted/DutyListView.vue'),
        },
        {
          path: '/addUser',
          name: 'add-user',
          component: () => import('../views/restricted/AddUserView.vue'),
        },
        {
          path: '/account',
          name: 'account',
          component: () => import('../views/restricted/AccountView.vue'),
        },
        {
          path: '/settings',
          name: 'settings',
          component: () => import('../views/restricted/SettingsView.vue'),
        },
        {
          path: '/remoteVolumeControl',
          name: 'remote-volume-control',
          component: () => import('../views/restricted/RemoteVolumeControlView.vue'),
        },
        {
          path: '/remoteControlPane',
          name: 'remote-control-pane',
          component: () => import('../views/restricted/RemoteControlPaneView.vue'),
        },
        // Stock management
        {
          path: '/addPosition',
          name: 'addPosition',
          component: () => import('../views/restricted/stock/AddPositionView.vue'),
        },
        {
          path: '/addItemGroup',
          name: 'addItemGroup',
          component: () => import('../views/restricted/stock/AddItemGroupView.vue'),
        },
        {
          path: '/positions',
          name: 'position-list',
          component: () => import('../views/restricted/stock/PositionListView.vue'),
        },
        {
          path: '/position/:positionId',
          name: 'position',
          component: () => import('../views/restricted/stock/PositionView.vue'),
          props: true,
        },
        {
          path: '/itemGroup/:itemGroupId',
          name: 'itemGroup',
          component: () => import('../views/restricted/stock/ItemGroupView.vue'),
          props: true,
        },
        {
          path: '/item/:itemId',
          name: 'item',
          component: () => import('../views/restricted/stock/ItemView.vue'),
          props: true,
        },
        {
          path: '/itemGroups',
          name: 'itemGroups-list',
          component: () => import('../views/restricted/stock/ItemGroupListView.vue'),
        },
        {
          path: '/addItem',
          name: 'addItem',
          component: () => import('../views/restricted/stock/AddItemView.vue'),
          props: true,
        },
        {
          path: '/stockChanges',
          name: 'stockChanges',
          component: () => import('../views/restricted/stock/StockChangesView.vue'),
        },
        {
          path: '/stockChange/:changeId',
          name: 'stockChange',
          component: () => import('../views/restricted/stock/StockChangeView.vue'),
          props: true,
        },
        {
          path: '/itemGroupStock',
          name: 'itemGroupStock',
          component: () => import('../views/restricted/stock/ItemGroupStockListView.vue'),
        },
        {
          path: '/itemStock',
          name: 'itemStock',
          component: () => import('../views/restricted/stock/ItemStockListView.vue'),
        },
        {
          path: '/itemRequests',
          name: 'itemRequests',
          component: () => import('../views/restricted/stock/ItemRequestsView.vue'),
        },
        {
          path: '/addStockChange',
          name: 'addStockChange',
          component: () => import('../views/restricted/stock/AddStockChangeView.vue'),
          props: true,
        },
        {
          path: '/scannedItem',
          name: 'scannedItem',
          component: () => import('../views/restricted/stock/ScannedItemPageView.vue'),
        },
        {
          path: '/invoice/:invoiceId',
          name: 'invoice',
          component: () => import('../views/restricted/stock/InvoiceView.vue'),
          props: true,
        },
        {
          path: '/invoices',
          name: 'invoiceList',
          component: () => import('../views/restricted/stock/InvoiceListView.vue'),
        },
        {
          path: '/addInvoice',
          component: () => import('../views/restricted/stock/InvoiceListView.vue'),
          props: {
            addNew: true,
          },
        },
      ],
    },
  ],
});

export default router;
