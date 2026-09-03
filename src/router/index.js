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
  let token = localStorage.getItem('admin_token')

  // 检查 token 是否为 JWT，并校验 exp
  const isJwtExpired = (t) => {
    if (!t) return false
    const parts = t.split('.')
    if (parts.length !== 3) return false // 不是 JWT

    try {
      // atob 部分需要将 URL-safe base64 恢复
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      // atob 可能抛异常
      const json = decodeURIComponent(
        Array.prototype.map
          .call(atob(b64), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const payload = JSON.parse(json)
      if (payload && typeof payload.exp === 'number') {
        return payload.exp <= Math.floor(Date.now() / 1000)
      }
      return false
    } catch (e) {
      // 无法解析为 JWT 或解析失败，视为不可判断（不当作已过期）
      return false
    }
  }

  // 如果是 JWT 且过期了，清除 token
  if (token && isJwtExpired(token)) {
    localStorage.removeItem('admin_token')
    token = null
  }

  // 必须登录的页面且没有 token -> 跳转登录并记录要去的页面
  if (to.meta.requiresAuth && !token) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      }
    }
  }

  // 已登录访问登录页 -> 重定向到后台首页
  if (to.path === '/login' && token) {
    return '/Manage'
  }

  return true
})

export default router