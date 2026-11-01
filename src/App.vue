<template>
  <NavBar v-if="showNavBar" />
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'

const route = useRoute()

// 管理相关页面不显示全局导航栏（保留各自的头部）
const showNavBar = computed(() => {
  return !['/Manage', '/Admin', '/Login'].includes(route.path)
})
</script>

<style>
body {
  margin: 0;
}

/* 页面切换动效：水平滑动（新页从右滑入，旧页向左滑出），与灵动岛滑块方向一致 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.32s ease, transform 0.32s cubic-bezier(0.22, 0.8, 0.3, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateX(64px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-64px);
}

/* 尊重系统"减少动态效果"设置 */
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}
</style>
