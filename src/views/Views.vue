<template>
  <div class="views-page-container">
    <header class="site-header">
      <h1>360</h1>
      <p>为平等和自由服务</p>
    </header>

    <nav class="site-nav">
      <router-link to="/">首页</router-link>
      <router-link to="/articles">文章</router-link>
      <router-link to="/views">浏览量</router-link>
    </nav>

    <main class="views-main">
      <h2 class="page-title">📊 数据统计</h2>

      <div class="stats-cards">
        <div class="card">
          <div class="card-icon">🚀</div>
          <div class="card-info">
            <div class="card-label">总浏览量</div>
            <div class="card-value">{{ totalViews }} 次</div>
          </div>
        </div>
        <div class="card">
          <div class="card-icon">🔥</div>
          <div class="card-info">
            <div class="card-label">今日新增</div>
            <div class="card-value">+{{ todayViews }} 次</div>
          </div>
        </div>
        <div class="card">
          <div class="card-icon">📝</div>
          <div class="card-info">
            <div class="card-label">全站文章</div>
            <div class="card-value">{{ articleCount }} 篇</div>
          </div>
        </div>
      </div>

      <div class="chart-section" style="margin-bottom: 30px;">
        <h3 style="margin-top:0">📈 近七日浏览趋势</h3>
        <EchartsTrend />
      </div>

      <div class="chart-section">
        <h3>🔝 热门文章浏览量排行</h3>
        <div class="bar-chart">
          <div class="chart-item" v-for="item in chartData" :key="item.id">
            <div class="article-name" :title="item.title">{{ item.title }}</div>
            <div class="bar-container">
              <div class="bar" :style="{ width: (item.views / maxViews) * 100 + '%' }">
                <span class="bar-text">{{ item.views }} 次</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="site-footer">
      <p>© 2026 我的个人博客. 保留所有权利。</p>
    </footer>
  </div>
</template>

<script setup>
import EchartsTrend from '../views/Echarts.vue' // 🌟 引入刚刚改好的文件
import { ref, computed } from 'vue'

// 模拟数据（这里的浏览量和文章页面的数据对应）
const chartData = ref([
  { id: 1, title: '写给开发者的生活思考：如何在代码与自由之间找到平衡', views: 230 },
  { id: 2, title: '探索 Vue 3 中的数据驱动魔法', views: 142 },
  { id: 3, title: '现代前端必修课：为什么你应该选择 Vite 而不是 Webpack', views: 98 }
])

// 今日新增浏览量（模拟）
const todayViews = ref(24)
const articleCount = ref(3)

// 🌟 自动计算总浏览量
const totalViews = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.views, 0) + todayViews.value
})

// 🌟 找出浏览量最高的值，用来按比例计算柱状图的宽度百分比
const maxViews = computed(() => {
  return Math.max(...chartData.value.map(item => item.views))
})
</script>

<style scoped>
/* 页面整体布局 */
.views-page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f8f9fa;
}

/* 网站头 */
.site-header {
  background-color: #2c3e50;
  width: 100%;
  color: white;
  text-align: center;
  padding: 5px 0;
}

.site-header h1 {
  margin: 0;
  font-size: 2.5rem;
}

.site-header p {
  margin: 0;
  color: #aeb6bf;
}

/* 导航栏 */
.site-nav {
  background-color: #34495e;
  display: flex;
  justify-content: flex-start;
  gap: 100px;
  padding: 15px 90px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.site-nav a {
  color: white;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  transition: color 0.3s;
}

.site-nav a:hover, .site-nav a.router-link-active {
  color: #42b983;
}

/* 主体内容 */
.views-main {
  flex-grow: 1;
  width: 100%;
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
  box-sizing: border-box;
}

.page-title {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 1.8rem;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
  width: fit-content;
}

/* 数据卡片布局 */
.stats-cards {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 40px;
}

.card {
  flex: 1;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.card-icon {
  font-size: 2.5rem;
}

.card-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.card-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

/* 图表区域 */
.chart-section {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.chart-section h3 {
  margin-top: 0;
  color: #2c3e50;
  margin-bottom: 25px;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.article-name {
  font-size: 0.95rem;
  color: #34495e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 文字过长显示省略号 */
}

/* 柱状图条形槽 */
.bar-container {
  background-color: #eaeded;
  border-radius: 4px;
  width: 100%;
  height: 24px;
}

/* 动态有颜色的柱子 */
.bar {
  background-color: #42b983;
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  box-sizing: border-box;
  transition: width 0.8s ease-out; /* 载入时有滑动的动画效果 */
}

.bar-text {
  color: white;
  font-size: 0.85rem;
  font-weight: bold;
}

/* 网页注脚 */
.site-footer {
  background-color: #1a252f;
  color: #7f8c8d;
  text-align: center;
  padding: 20px 0;
  margin-top: auto;
}
</style>