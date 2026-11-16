import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Articles from '../views/Articles.vue'
import Admin from '../views/Admin.vue'
import Navigation from '../views/Navigation.vue'
import Manage from '../views/Manage.vue'
import Login from '../views/Login.vue'
import Rncourage from '../views/Rncourage.vue'
import Storage from '../views/Storage.vue'

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
    path: '/Rncourage',
    name: 'Rncourage',
    component: Rncourage
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
    path: '/Storage',
    name: 'Storage',
    component: Storage,
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

  // 判断 token 是否过期
  // 1) JWT（3 段）-> 读 exp
  // 2) 本站 token（base64(payload).签名）-> 读 expiresAt；
  //    老 token 没有 expiresAt 时，按 createdAt 推算当天末尾（北京时间 23:59:59.999）
  const isTokenExpired = (t) => {
    if (!t) return false
    const parts = t.split('.')

    if (parts.length === 3) {
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

    // 本站 token：base64(payload).签名
    try {
      const payload = JSON.parse(atob(parts[0]))
      const DAY = 24 * 60 * 60 * 1000
      const BEIJING_OFFSET = 8 * 60 * 60 * 1000

      let expiresAt = payload.expiresAt
      if (typeof expiresAt !== 'number') {
        if (typeof payload.createdAt !== 'number') return false
        expiresAt =
          (Math.floor((payload.createdAt + BEIJING_OFFSET) / DAY) + 1) * DAY -
          BEIJING_OFFSET -
          1
      }
      return Date.now() > expiresAt
    } catch (e) {
      return false
    }
  }

  // token 过期了就清掉，并带上 expired=1 让登录页提示
  let expired = false
  if (token && isTokenExpired(token)) {
    localStorage.removeItem('admin_token')
    token = null
    expired = true
  }

  // 必须登录的页面且没有 token -> 跳转登录并记录要去的页面
  if (to.meta.requiresAuth && !token) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
        ...(expired ? { expired: '1' } : {}),
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