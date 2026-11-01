<template>
  <nav class="nav-bar">
    <!-- 左侧：2.jpg logo -->
    <router-link to="/" class="nav-logo">
      <img :src="logoImg" alt="360hp" />
    </router-link>

    <!-- 中间：灵动岛胶囊（hover / 点击左右弹开） -->
    <div
      class="nav-island"
      :class="{ expanded: panelOpen }"
      @mouseenter="openPanel"
      @mouseleave="scheduleClose"
    >
      <div class="island-pill" ref="pillEl">
        <!-- 玻璃滑块：跟随当前页面在菜单项之间滑动 -->
        <span
          class="island-indicator"
          :style="indicatorStyle"
          :class="{ 'indicator-hidden': !indicatorMatched }"
        ></span>

        <router-link to="/" class="island-label" data-path="/" @click="closePanel">首页</router-link>
        <router-link to="/articles" class="island-label" data-path="/articles" @click="closePanel">文章</router-link>

        <button class="island-trigger" @click="togglePanel" aria-label="展开导航">
          <span class="island-dot"></span>
          <span class="island-dot"></span>
          <span class="island-dot"></span>
          <span class="island-dot"></span>
        </button>

        <router-link to="/Navigation" class="island-label" data-path="/Navigation" @click="closePanel">工具导航</router-link>
        <router-link to="/Rncourage" class="island-label" data-path="/Rncourage" @click="closePanel">支持作者</router-link>
      </div>
    </div>

    <!-- 右侧：登录按钮已移除 -->
    <div class="nav-right"></div>
  </nav>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import logoImg from '@/assets/image/2-transparent.png'

const route = useRoute()
const panelOpen = ref(false)
const pillEl = ref(null)
const indicatorStyle = ref({})
const indicatorMatched = ref(true)
let closeTimer = null
let ro = null

// 灵动岛菜单对应的路径
const menuPaths = ['/', '/articles', '/Navigation', '/Rncourage']

// 当前路由对应哪个菜单项（文章详情 /articles/:id 归入"文章"）
function matchMenuPath() {
  if (route.path.startsWith('/articles')) return '/articles'
  return menuPaths.includes(route.path) ? route.path : null
}

// 测量激活菜单项的位置，移动玻璃滑块
function updateIndicator() {
  const target = matchMenuPath()
  if (!target) {
    indicatorMatched.value = false
    return
  }
  indicatorMatched.value = true
  const el = pillEl.value?.querySelector(`.island-label[data-path="${target}"]`)
  if (!el) return
  nextTick(() => {
    indicatorStyle.value = {
      transform: `translateY(-50%) translateX(${el.offsetLeft}px)`,
      width: `${el.offsetWidth}px`,
    }
  })
}

onMounted(() => {
  updateIndicator()
  // 灵动岛弹开/收起时宽度变化，滑块位置需要重新测量
  ro = new ResizeObserver(() => updateIndicator())
  if (pillEl.value) ro.observe(pillEl.value.parentElement)
  window.addEventListener('resize', updateIndicator)
})

onUnmounted(() => {
  clearTimeout(closeTimer)
  ro?.disconnect()
  window.removeEventListener('resize', updateIndicator)
})

// 路由变化 → 滑块滑到对应菜单项
watch(
  () => route.path,
  () => nextTick(updateIndicator)
)

function openPanel() {
  cancelClose()
  panelOpen.value = true
}

function closePanel() {
  panelOpen.value = false
}

function togglePanel() {
  if (panelOpen.value) {
    closePanel()
  } else {
    openPanel()
  }
}

function scheduleClose() {
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    panelOpen.value = false
  }, 390)
}

function cancelClose() {
  clearTimeout(closeTimer)
}
</script>

<style scoped>
/* ============ 顶部悬浮导航（透明，不挡内容） ============ */
.nav-bar {
  position: fixed;         /* 置顶悬浮 */
  top: 0;
  left: 0;
  right: 0;
  z-index: 952;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background: transparent; /* 透明背景，不挡内容 */
  pointer-events: none;    /* 空白区域点击穿透 */
  animation: nav-slide-down 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* 进场：从顶部滑入 */
@keyframes nav-slide-down {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 左侧 logo */
.nav-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  pointer-events: auto;    /* logo 可点击 */
}

.nav-logo img {
  height: 67px;
  width: auto;
  display: block;
  animation: logo-float 3.2s ease-in-out infinite;
  transition: transform 0.3s ease;
}

/* logo 轻微悬浮呼吸 */
@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.nav-logo:hover img {
  animation-play-state: paused;
  transform: translateY(-4px) scale(1.06);
}

/* ============ 灵动岛（左右弹开） ============ */
.nav-island {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 6.25rem;          /* 收起时：只露中间圆钮 */
  height: 2.5rem;
  border-radius: 1.875rem;
  will-change: width;
  transition: width 0.6s cubic-bezier(0.44, 1.85, 0.6, 1), opacity 0.2s;
  pointer-events: auto;    /* 灵动岛可交互 */
}

.nav-island:hover,
.nav-island.expanded {
  width: 26rem;            /* 弹开时：左右展开 */
}

/* 胶囊本体：毛玻璃 + 淡光效（呼吸） */
.island-pill {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding-inline: 1.25rem;
  border-radius: 1.875rem;
  background: rgba(234, 234, 227, 0.4);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  overflow: hidden;
  box-shadow: 0 0 18px rgba(66, 185, 131, 0.18),
              0 2px 10px rgba(0, 0, 0, 0.09);
  transition: box-shadow 0.4s ease;
  animation: island-glow 3.6s ease-in-out infinite;
}

/* 光晕呼吸 */
@keyframes island-glow {
  0%, 100% {
    box-shadow: 0 0 14px rgba(66, 185, 131, 0.14),
                0 2px 10px rgba(0, 0, 0, 0.09);
  }
  50% {
    box-shadow: 0 0 26px rgba(66, 185, 131, 0.30),
                0 0 46px rgba(66, 185, 131, 0.10),
                0 2px 10px rgba(0, 0, 0, 0.09);
  }
}

.nav-island:hover .island-pill,
.nav-island.expanded .island-pill {
  animation-play-state: paused;
  box-shadow: 0 0 26px rgba(66, 185, 131, 0.32),
              0 0 60px rgba(66, 185, 131, 0.12),
              0 2px 10px rgba(0, 0, 0, 0.09);
}

/* ============ 玻璃滑块（跟随当前页面滑动） ============ */
.island-indicator {
  position: absolute;
  top: 50%;
  left: 0;
  height: 1.675rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08),
              inset 0 0 0 1px rgba(255, 255, 255, 0.45);
  opacity: 0;
  pointer-events: none;
  z-index: 0;
  transition: transform 0.455s cubic-bezier(0.345, 1.315, 0.515, 1.005),
              width 0.435s cubic-bezier(0.335, 1.325, 0.525, 1.015),
              opacity 0.295s ease;
}

/* 灵动岛弹开时滑块淡入 */
.nav-island:hover .island-indicator,
.nav-island.expanded .island-indicator {
  opacity: 1;
}

/* 当前页面不在菜单中（如登录页）时完全隐藏 */
.island-indicator.indicator-hidden {
  opacity: 0 !important;
}

/* 菜单项：默认隐藏，弹开时淡入 */
.island-label {
  font-size: 0.95rem;
  font-weight: 530;
  color: #2c3e50;
  text-decoration: none;
  white-space: nowrap;
  position: relative;
  min-width: 4.5rem;       /* 固定宽度，保证左右对称 */
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transform: scale(0.9);
  z-index: 1;              /* 文字在玻璃滑块之上 */
  transition: opacity 0.55s, transform 0.4s cubic-bezier(0.34, 1.4, 0.6, 1);
}

.nav-island:hover .island-label,
.nav-island.expanded .island-label {
  opacity: 1;
  pointer-events: all;
  transform: scale(1);
}

.island-label:hover {
  color: #42b983;
}

/* 中间圆钮（4 个点） */
.island-trigger {
  position: relative;
  flex-shrink: 0;
  width: 1.875rem;
  height: 1.875rem;
  border-radius: 50%;
  border: 0;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.4, 0.6, 1);
}

.nav-island:hover .island-trigger,
.nav-island.expanded .island-trigger {
  transform: rotate(90deg);
}

.island-dot {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(25, 25, 25, 0.65);
}

.island-dot:nth-child(1) { top: calc(50% - 4.5px); left: calc(50% - 4.5px); }
.island-dot:nth-child(2) { top: calc(50% - 4.5px); left: calc(50% + 1.5px); }
.island-dot:nth-child(3) { top: calc(50% + 1.5px); left: calc(50% - 4.5px); }
.island-dot:nth-child(4) { top: calc(50% + 1.5px); left: calc(50% + 1.5px); }

/* 移动端适配 */
@media (max-width: 980px) {
  .nav-island:hover,
  .nav-island.expanded {
    width: 22rem;
  }
}

@media (max-width: 690px) {
  .nav-bar {
    padding: 0 12px;
  }
  .nav-island:hover,
  .nav-island.expanded {
    width: calc(100vw - 24px);
  }
  .island-pill {
    gap: 0.9rem;
    padding-inline: 0.9rem;
  }
  .island-label {
    font-size: 0.85rem;
  }
}
</style>
