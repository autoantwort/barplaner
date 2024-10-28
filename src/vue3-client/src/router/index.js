import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import axios from '@/http-common';
import Roles from '@/roles';
import Restricted from '@/views/restricted/Restricted.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
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
      ],
    },
  ],
});

export default router;
