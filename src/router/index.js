import { createRouter, createWebHistory } from 'vue-router'
// 1. 确保导入了你的主页和刚刚新建的文章页
import Home from '../views/Home.vue'
import Articles from '../views/Articles.vue' 

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  // 2. 🌟 加上这一段！告诉路由：当网址变成 /articles 时，展示 Articles 组件
  {
    path: '/articles',
    name: 'articles',
    component: Articles
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router