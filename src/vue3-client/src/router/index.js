import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import axios from '@/http-common';
import Roles from '@/roles';

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
  ],
});

export default router;
