<template>
  <div class="home-container">
    <header class="site-header">
      <h1>360</h1>
      <p>为平等和自由服务</p>
    </header>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <nav class="site-nav">
      <router-link to="/">首页</router-link>
      <router-link to="/articles">文章</router-link>
      <router-link to="/navigation">工具导航</router-link>
      <!-- 👇 修改这里：加上类名 login-btn，并添加一个 user 图标 -->
      <router-link to="/Manage" class="login-btn">
        <i class="fa-solid fa-user"></i> 登 录
      </router-link>
    </nav>

    <main class="carousel-container" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay">
    </main>
  
    <main class="carousel-container" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay">
      <div class="carousel" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
        <div class="carousel-item" v-for="(img, index) in images" :key="index">
          <img :src="img.src" :alt="img.title" />
          <div class="caption">{{ img.title }}</div>
        </div>
      </div>
      
      <button class="carousel-btn prev" @click="prevSlide">❮</button>
      <button class="carousel-btn next" @click="nextSlide">❯</button>
      
      <div class="indicators">
        <span 
          v-for="(img, index) in images" 
          :key="'dot-'+index" 
          :class="{ active: index === currentIndex }"
          @click="currentIndex = index"
        ></span>
      </div>
    </main>
    
    <section class="recent-updates-section">
      <h2 class="section-title">✨ 最新文章</h2>
      <div class="updates-list">
        <!-- 🌟 修改 1：使用 .slice(0, 3) 只展示前 3 篇文章 -->
        <div 
          class="update-item" 
          v-for="item in articles.slice(0, 3)" 
          :key="item.id" 
          @click="goArticle(item.id)"
        >
          <!-- 封面图容器（方便做超出的放大动画） -->
          <div class="cover-wrapper" v-if="item.cover_image">
            <img :src="item.cover_image" alt="封面图" class="cover-img">
          </div>

          <div class="update-meta">
            <span class="update-date">📅 {{ item.created_at }}</span>
            <span class="update-tag">👁️ 阅读量: {{ item.views }}</span>
          </div>

          <h2 class="update-title">{{ item.title }}</h2>
          
          <!-- 文章预览内容 -->
          <p class="update-preview">{{ item.content }}</p>

          <!-- 🌟 修改 2：增加点击引导 -->
          <div class="read-more-btn">
            阅读全文 <i class="fa-solid fa-arrow-right"></i>
          </div>
        </div>
      </div>
    </section>

    <footer class="site-footer">
      <div class="footer-container">
        
        <div class="footer-section about">
          <h4>关于博主</h4>
          <p>一个走在前端开发路上的技术宅，热衷于用代码构建有趣的世界。在这里分享关于技术、思考与生活的点滴。</p>
        </div>

        <!-- 文章 -->
        <!-- <div v-for="article in articles" :key="article.id">
          <h2>
            {{article.title}}
          </h2>
          <p>{{article.content}}</p>
        </div> -->
        <!-- 文章 -->

        <div class="footer-section contact">
          <h4>联系方式</h4>
          <div class="contact-item">📧 邮箱：暂无</div>
          <div class="contact-item">🌐 网站：www.360.com</div>
          <div class="contact-item">📍 坐标：中国</div>
        </div>

        <div class="footer-section social">
          <h4>关注我</h4>
          <div class="social-links">
            <div class="social-item">
              <i class="fa-brands fa-weixin"></i>
              <span>微信</span>
            </div>
            <div class="social-item">
              <i class="fa-brands fa-weibo"></i>
              <span>微博</span>
            </div>
            <div class="social-item">
              <i class="fa-brands fa-qq"></i>
              <span>QQ群：1020207158</span>
            </div>
          </div>
        </div>

      </div>

      <div class="footer-bottom">
        <p>© 2026 我的个人博客. 保留所有权利。</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {getArticles} from "@/api/article"

// 文章列表数据
const articles=ref([])

onMounted(async()=>{

    articles.value =
        await getArticles()

})
// 文章列表数据
const currentIndex = ref(0)

// 1. 专门用来解析本地图片路径的“魔法函数”
// 🌟 修正点：路径改成了你文件树里实际的 ../assets/image/
const getImageUrl = (name) => {
  return new URL(`../assets/image/${name}`, import.meta.url).href
}

// 2. 轮播图数据
// 🌟 修正点：只传【文件名 + 正确的 .jpg 后缀】
const images = ref([
  { src: getImageUrl('img1.jpg'), title: '冰岛杰古沙龙湖' },
  { src: getImageUrl('img2.jpg'), title: '大海、沙滩与夕阳' },
  { src: getImageUrl('img3.jpg'), title: '高与低' },
  { src: getImageUrl('img4.jpg'), title: '凯恩戈姆山脉' },
  { src: getImageUrl('img5.jpg'), title: '第五张轮播图' },
  { src: getImageUrl('img6.jpg'), title: '闪亮的盐水' },
  { src: getImageUrl('img7.jpg'), title: '一个诗意的港口' },
  { src: getImageUrl('img8.jpg'), title: '西南方向的剪影' },
  { src: getImageUrl('img9.jpg'), title: '驾驭双色造型' },
  { src: getImageUrl('img10.jpg'), title: '中国丽江玉龙雪山蓝月谷' }
])
const nextSlide = () => {
  // 假设共 8 张图，(7 + 1) % 8 = 0。完美的自动回到了第一张！
  currentIndex.value = (currentIndex.value + 1) % images.value.length
}

const prevSlide = () => {
  // 假设在第 0 张，(0 - 1 + 8) % 8 = 7。完美的跳到了最后一张！
  currentIndex.value = (currentIndex.value - 1 + images.value.length) % images.value.length
}

let timer = null

// 开启自动播放
const startAutoPlay = () => {
  // 每隔 3000 毫秒（3秒），执行一次下一张函数
  timer = setInterval(nextSlide, 3000)
}

// 停止自动播放
const stopAutoPlay = () => {
  // 清除定时器，让轮播图停下来
  clearInterval(timer)
}

import { onMounted, onUnmounted } from 'vue'

// 页面加载完毕，开始播放
onMounted(() => {
  startAutoPlay()
})

// 用户离开这个页面，彻底销毁定时器
onUnmounted(() => {
  stopAutoPlay()
})

import { useRouter } from "vue-router"

const router = useRouter()

function goArticle(id){
  router.push(`/articles/${id}`)
}
// ...你原有的轮播图数据和定时器逻辑...

// 🌟 新增：最近发布的文字数据
// const recentTexts = ref([
//   {
//     id: 1,
//     date: '2026-06-20',
//     tag: 'article.title',
//     title: '今天成功调通了 Vue 3 轮播图！',
//     preview: '经历了几次路径找不到和组件逻辑卡壳后，终于利用 Vite 的新特性把本地图片成功加载了出来。顺便写好了自动播放和鼠标悬浮暂停的功能，前端开发真有意思！'
//   },
//   {
//     id: 2,
//     date: '2026-06-18',
//     tag: '前端技术',
//     title: '关于现代前端构建工具的一点随笔',
//     preview: '从 require() 到 import，从 Webpack 到 Vite，技术的更迭速度远超想象。旧的代码虽然能跑，但抱残守缺终究会被时代淘汰，拥抱新标准才是正解。'
//   }
// ])
</script>

<style scoped>
/* 页面整体布局 */
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 130vh;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
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
  margin: 0px 0 0;
  color: #aeb6bf;
}

/* 导航栏 */
.site-nav {
  background-color: #34495e;
  display: flex;
  
  /* ⬇️ 核心修改：把 center 改成 flex-start ⬇️ */
  justify-content: flex-start; /* 让里面的链接全部向左看齐 */
  
  gap: 100px;
  
  /* ⬇️ 调整内边距：原本是 15px 0 ⬇️ */
  padding: 15px 90px; /* 15px是上下，30px是左右。这样左边就会留出 30px 的舒适空隙 */
  
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  /* 👇 新增这一行：确保按钮和文字都在垂直方向居中对齐 */
  align-items: center;
}

/* ================= 炫酷登录按钮样式 ================= */
.site-nav a.login-btn {
  margin-left: auto; /* 🌟 神奇魔法：这行代码会把按钮推到导航栏的最右侧！ */
  background-color: #42b983; /* 按钮底色：Vue主题绿 */
  color: white !important; /* 强制文字白色，防止路由激活时变成绿色 */
  padding: 8px 26px; /* 按钮内边距，让它撑起来 */
  border-radius: 30px; /* 大圆角，变成胶囊形状 */
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px; /* 图标和文字的间距 */
  box-shadow: 0 4px 10px rgba(66, 185, 131, 0.3); /* 加上柔和的绿色发光阴影 */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); /* 平滑的过渡动画 */
}

/* 鼠标悬浮在按钮上时的动画效果 */
.site-nav a.login-btn:hover {
  background-color: #33a06f; /* 悬浮时颜色加深一点 */
  transform: translateY(-3px); /* 悬浮时按钮微微上浮 */
  box-shadow: 0 6px 15px rgba(66, 185, 131, 0.5); /* 阴影放大，增加立体浮雕感 */
}

/* 鼠标点击按下时的效果 */
.site-nav a.login-btn:active {
  transform: translateY(0); /* 按下时回落 */
  box-shadow: 0 2px 5px rgba(66, 185, 131, 0.4);
}

.site-nav a {
  color: white;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  transition: color 0.3s;
}

.site-nav a:hover, .site-nav a.router-link-active {
  color: #42b983; /* Vue主题绿 */
}

/* 轮播图主体区域 */
.carousel-container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 30px auto;
  overflow: hidden;
  
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.carousel {
  display: flex;
  transition: transform 0.5s ease-in-out;
}

.carousel-item {
  min-width: 100%;
  position: relative;
}

.carousel-item img {
  width: 100%;
  height: 400px;
  object-fit: cover;
  display: block;
}

/* 轮播图文字说明 */
.caption {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 10px 25px;
  border-radius: 20px;
  font-size: 1.2rem;
  letter-spacing: 2px;
}

/* 控制按钮 */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.4);
  color: white;
  border: none;
  font-size: 24px;
  padding: 15px 10px;
  cursor: pointer;
  transition: background 0.3s;
}

.carousel-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.prev { left: 0; border-radius: 0 4px 4px 0; }
.next { right: 0; border-radius: 4px 0 0 4px; }

/* 轮播图指示器 (小圆点) */
.indicators {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.indicators span {
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s;
}

.indicators span.active {
  background: #42b983;
}

/* 网页注脚 */
.site-footer {
  background-color: #1a252f;
  color: #7f8c8d;
  text-align: center;
  padding: 20px 0;
  margin-top: auto; /* 配合 flex-grow 使页脚永远在底部 */
}

/* 最近更新区域的大外壳 */
.recent-updates-section {
  width: 100%;
  max-width: 900px; /* 和文章页保持一致的宽度，看起来很舒服 */
  margin: 40px auto; /* 上下留出40px空隙，左右居中 */
  padding: 0 20px;
  box-sizing: border-box;
}

/* 区域大标题 */
.section-title {
  color: #2c3e50;
  font-size: 1.6rem;
  border-bottom: 2px solid #42b983; /* Vue主题绿的下划线 */
  padding-bottom: 8px;
  margin-bottom: 25px;
  width: fit-content;
}

/* 列表容器 */
.updates-list {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 每一条文字之间的间距 */
}

/* 单条文字卡片 */
/* 单条文字卡片基础设置 */
.update-item {
  background-color: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #42b983;
  cursor: pointer; /* 鼠标变为手型提示可点击 */
  
  /* 🌟 核心动画平滑过渡 */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  user-select: none; /* 防止频繁点击选中文字 */
}

/* 🌟 鼠标悬浮动画：卡片微微上浮 + 阴影扩散 */
.update-item:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

/* 🌟 点击按下的物理反馈：卡片按压按紧缩放效果 */
.update-item:active {
  transform: scale(0.98) translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.1s ease;
}

/* 封面图包裹框与悬浮放大特效 */
.cover-wrapper {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden; /* 超出的部分隐藏 */
  margin-bottom: 15px;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

/* 悬浮卡片时，图片微微放大 */
.update-item:hover .cover-img {
  transform: scale(1.05);
}

/* 文章标题悬浮变色 */
.update-title {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  transition: color 0.3s;
}

.update-item:hover .update-title {
  color: #42b983; /* 悬浮时标题变成 Vue 绿 */
}

/* 🌟 核心限制：内容换行 + 最多显示 3 行超长省略 */
.update-preview {
  color: #555;
  line-height: 1.8;
  font-size: 0.98rem;
  margin: 0 0 15px 0;
  
  /* 1. 支持保留换行 */
  white-space: pre-wrap; 
  
  /* 2. 多行文本截断展示省略号 (...) */
  display: -webkit-box;
  -webkit-line-clamp: 3; /* 限制只显示 3 行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  
  /* 防止过长的无空格单词打乱布局 */
  word-break: break-word; 
}

/* 阅读全文按钮与图标移动动画 */
.read-more-btn {
  color: #42b983;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s;
}

.read-more-btn i {
  transition: transform 0.3s ease;
}

/* 悬浮卡片时，箭头向右偏移 */
.update-item:hover .read-more-btn i {
  transform: translateX(6px);
}

/* 日期和标签 */
.update-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 10px;
}

.update-tag {
  background-color: #e8f8f5;
  color: #1abc9c;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
}



/* 跳转链接按钮 */
.read-more-link {
  color: #42b983;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s;
}

.read-more-link:hover {
  color: #35495e; /* 悬浮时变成深蓝色 */
}

/* ================= 页脚全新排版样式 ================= */
.site-footer {
  background-color: #1a252f; /* 保持原有的高级深色背景 */
  color: #aeb6bf; /* 次要文字变淡 */
  padding: 40px 0 20px 0;
  margin-top: auto;
  width: 100%;
}

/* 页脚内容多列容器 */
.footer-container {
  max-width: 5000px; /* 与你的主体内容宽度对齐，视觉上很整齐 */
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 完美的平分三列 */
  gap: 40px;
}

/* 每个小区块的公共样式 */
.footer-section h4 {
  color: #ffffff;
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 18px;
  position: relative;
  padding-bottom: 6px;
}

/* 加上一条 Vue 绿的小下划线，增加设计感 */
.footer-section h4::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 90px;
  height: 2px;
  background-color: #42b983;
}

/* 关于博主 ＆ 联系方式的文本调整 */
.footer-section p, 
.contact-item {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #aeb6bf;
}

.contact-item {
  margin-bottom: 8px;
}

/* 社交媒体排列容器 */
.social-links {
  display: flex;
  flex-direction: column;
  gap: 12px; /* 每行社交媒体的间距 */
}

/* 单个社交媒体项 */
.social-item {
  display: flex;
  align-items: center;
  gap: 10px; /* 图标和字之间的距离 */
  font-size: 0.95rem;
  cursor: pointer;
  width: fit-content;
  transition: color 0.2s, transform 0.2s;
}

/* 鼠标放上去时，变成 Vue 绿并且微微右移 */
.social-item:hover {
  color: #42b983;
  transform: translateX(4px);
}

/* 放大一些图标的尺寸 */
.social-item i {
  font-size: 1.15rem;
  width: 20px; /* 固定宽度，防止图标宽窄不同导致文字对不齐 */
  text-align: center;
}

/* 最底部的版权声明栏 */
.footer-bottom {
  max-width: 900px;
  margin: 30px auto 0 auto;
  padding: 20px 20px 0 20px;
  border-top: 1px solid #2c3e50; /* 极淡的分割线 */
  text-align: center;
  font-size: 0.85rem;
  color: #7f8c8d;
}

.footer-bottom p {
  margin: 0;
}

/* 响应式适配：如果屏幕太小（比如手机端），三列会自动变成垂直单列排列 */
@media (max-width: 768px) {
  .footer-container {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>