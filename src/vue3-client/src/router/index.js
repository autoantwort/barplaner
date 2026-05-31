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
      meta: { title: 'Login' },
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
      meta: { title: 'Reset Password' },
      component: () => import('../views/RequestPasswordResetView.vue'),
    },
    {
      path: '/resetPassword/:token',
      name: 'resetPassword',
      meta: { title: 'Reset Password' },
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
          meta: { title: 'Add Bar' },
          component: () => import('../views/restricted/AddBarView.vue'),
        },
        {
          path: '/bars',
          name: 'bar-list',
          meta: { title: 'Bars' },
          component: () => import('../views/restricted/BarListView.vue'),
        },
        {
          path: '/users',
          name: 'user-list',
          meta: { title: 'Users' },
          component: () => import('../views/restricted/UserListView.vue'),
        },
        {
          path: '/roles',
          name: 'role-list',
          meta: { title: 'Roles' },
          component: () => import('../views/restricted/RoleListView.vue'),
        },
        {
          path: '/duty',
          name: 'duty-list',
          meta: { title: 'Duties' },
          component: () => import('../views/restricted/DutyListView.vue'),
        },
        {
          path: '/addUser',
          name: 'add-user',
          meta: { title: 'Add User' },
          component: () => import('../views/restricted/AddUserView.vue'),
        },
        {
          path: '/account',
          name: 'account',
          meta: { title: 'Account' },
          component: () => import('../views/restricted/AccountView.vue'),
        },
        {
          path: '/settings',
          name: 'settings',
          meta: { title: 'Settings' },
          component: () => import('../views/restricted/SettingsView.vue'),
        },
        {
          path: '/remoteVolumeControl',
          name: 'remote-volume-control',
          meta: { title: 'Volume', icon: '/icon-volume.png' },
          component: () => import('../views/restricted/RemoteVolumeControlView.vue'),
        },
        {
          path: '/remoteControlPane',
          name: 'remote-control-pane',
          meta: { title: 'Control Pane', icon: '/icon-control.png' },
          component: () => import('../views/restricted/RemoteControlPaneView.vue'),
        },
        // Stock management
        {
          path: '/addPosition',
          name: 'addPosition',
          meta: { title: 'Add Position' },
          component: () => import('../views/restricted/stock/AddPositionView.vue'),
        },
        {
          path: '/addItemGroup',
          name: 'addItemGroup',
          meta: { title: 'Add Item Group' },
          component: () => import('../views/restricted/stock/AddItemGroupView.vue'),
        },
        {
          path: '/positions',
          name: 'position-list',
          meta: { title: 'Positions' },
          component: () => import('../views/restricted/stock/PositionListView.vue'),
        },
        {
          path: '/position/:positionId',
          name: 'position',
          meta: { title: 'Position' },
          component: () => import('../views/restricted/stock/PositionView.vue'),
          props: true,
        },
        {
          path: '/itemGroup/:itemGroupId',
          name: 'itemGroup',
          meta: { title: 'Item Group' },
          component: () => import('../views/restricted/stock/ItemGroupView.vue'),
          props: true,
        },
        {
          path: '/item/:itemId',
          name: 'item',
          meta: { title: 'Item' },
          component: () => import('../views/restricted/stock/ItemView.vue'),
          props: true,
        },
        {
          path: '/itemGroups',
          name: 'itemGroups-list',
          meta: { title: 'Item Groups' },
          component: () => import('../views/restricted/stock/ItemGroupListView.vue'),
        },
        {
          path: '/addItem',
          name: 'addItem',
          meta: { title: 'Add Item' },
          component: () => import('../views/restricted/stock/AddItemView.vue'),
          props: true,
        },
        {
          path: '/stockChanges',
          name: 'stockChanges',
          meta: { title: 'Stock Changes' },
          component: () => import('../views/restricted/stock/StockChangesView.vue'),
        },
        {
          path: '/stockChange/:changeId',
          name: 'stockChange',
          meta: { title: 'Stock Change' },
          component: () => import('../views/restricted/stock/StockChangeView.vue'),
          props: true,
        },
        {
          path: '/itemGroupStock',
          name: 'itemGroupStock',
          meta: { title: 'Shopping', icon: '/icon-shop.png' },
          component: () => import('../views/restricted/stock/ItemGroupStockListView.vue'),
        },
        {
          path: '/itemStock',
          name: 'itemStock',
          meta: { title: 'Item Stock' },
          component: () => import('../views/restricted/stock/ItemStockListView.vue'),
        },
        {
          path: '/itemRequests',
          name: 'itemRequests',
          meta: { title: 'Item Requests' },
          component: () => import('../views/restricted/stock/ItemRequestsView.vue'),
        },
        {
          path: '/addStockChange',
          name: 'addStockChange',
          meta: { title: 'Add Stock Change' },
          component: () => import('../views/restricted/stock/AddStockChangeView.vue'),
          props: true,
        },
        {
          path: '/scannedItem',
          name: 'scannedItem',
          meta: { title: 'Scanned Item' },
          component: () => import('../views/restricted/stock/ScannedItemPageView.vue'),
        },
        {
          path: '/invoice/:invoiceId',
          name: 'invoice',
          meta: { title: 'Invoice' },
          component: () => import('../views/restricted/stock/InvoiceView.vue'),
          props: true,
        },
        {
          path: '/invoices',
          name: 'invoiceList',
          meta: { title: 'Invoices' },
          component: () => import('../views/restricted/stock/InvoiceListView.vue'),
        },
        {
          path: '/addInvoice',
          meta: { title: 'Add Invoice' },
          component: () => import('../views/restricted/stock/InvoiceListView.vue'),
          props: {
            addNew: true,
          },
        },
      ],
    },
  ],
});

const faviconLink = document.head.querySelector('link[rel="icon"]');
const appleTouchLink = document.head.querySelector('link[rel="apple-touch-icon"]');
const appTitleMeta = document.head.querySelector('meta[name="apple-mobile-web-app-title"]');

router.afterEach(to => {
  const title = to.meta?.title ?? 'Barplaner';
  const icon = to.meta?.icon ?? '/icon.png';
  document.title = title;
  faviconLink?.setAttribute('href', icon);
  appleTouchLink?.setAttribute('href', icon);
  appTitleMeta?.setAttribute('content', title);
});

export default router;
