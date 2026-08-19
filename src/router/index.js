import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Articles from '../views/Articles.vue'
import Admin from '../views/Admin.vue'
import Navigation from '../views/Navigation.vue'
import Manage from '../views/Manage.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/articles',
    name: 'articles',
    component: Articles
  },
  {
    path: '/articles/:id',
    name: 'article-detail',
    component: Articles
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/Navigation',
    name: 'Navigation',
    component: Navigation
  },
  {
    path: '/Manage',
    name: 'Manage',
    component: Manage,
    meta: {
      requiresAuth: true,
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: {
      requiresAuth: true,
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')

  if (to.meta.requiresAuth && !token) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      }
    }
  }

  if (to.path === '/login' && token) {
    return '/Manage'
  }

  return true
})

export default router