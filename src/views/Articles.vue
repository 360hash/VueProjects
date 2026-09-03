<template>
  <div class="article-container">
    <nav class="site-nav">
      <router-link to="/">首页</router-link>
      <router-link to="/Navigation">工具导航</router-link>
    </nav>

    <div v-if="!route.params.id" class="article-list-wrap">
      <header class="list-hero">
        <h1>文章列表</h1>
      </header>

      <main class="article-list">
        <!-- 🌟 1. 修改点击事件，传入 $event 与 item -->
        <div v-for="item in articles" :key="item.id" class="article-card" @click="goArticle($event, item)">
          <img v-if="item.cover_image" :src="item.cover_image" alt="cover" class="article-thumb" />
          <div class="article-card-body">
            <h3>{{ item.title }}</h3>
            <div class="meta-line">
              <span>📅 {{ item.created_at }}</span>
              <span>👁️ {{ item.views }}</span>
            </div>
            <p>{{ formatPreview(item.content) }}</p>
          </div>
        </div>
      </main>
    </div>

    <template v-else>
      <header class="article-hero" :style="{ backgroundImage: `url(${article.cover_image || defaultCover})` }">
        <div class="hero-overlay">
          <h1 class="hero-title tracking-in-expand">{{ article.title }}</h1>
          <div class="hero-meta fade-in-bottom">
            <span class="meta-tag">📅 {{ article.created_at }}</span>
            <span class="meta-tag">👁️ 阅读量: {{ article.views }}</span>
          </div>
        </div>
      </header>

      <main class="article-body">
        <article class="glass-card slide-up">
          <div class="content-text markdown-body" v-html="articleHtml"></div>

          <div class="action-bar">
            <button class="back-btn" @click="goBack">
              <i class="fa-solid fa-arrow-left"></i> 返回上一页
            </button>
          </div>
        </article>
      </main>
    </template>

    <!-- 🌟 2. 新增：全屏放大转场动画遮罩层 -->
    <!-- 🌟 新增：全屏放大转场动画遮罩层（仅文字区块白底放大） -->
    <div 
      v-if="transitionActive" 
      class="expand-overlay"
      :class="{ 'is-expanded': isExpanded }"
      :style="overlayStyle"
    >
      <div class="overlay-text-content">
        <h3>{{ transitionData.title }}</h3>
        <div class="meta-line">
          <span>📅 {{ transitionData.created_at }}</span>
          <span>👁️ {{ transitionData.views }}</span>
        </div>
        <p>{{ transitionData.preview }}</p>
      </div>
      <img v-if="transitioningCover" :src="transitioningCover" class="overlay-img" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'

import { getArticleById, getArticles } from '@/api/article'

const route = useRoute()
const router = useRouter()

const md = new MarkdownIt({
  html: true,
  breaks: true,
})

const defaultCover = new URL('../assets/image/img1.jpg', import.meta.url).href

const article = ref({
  title: '加载中...',
  created_at: '',
  views: 0,
  content: '',
  cover_image: ''
})

const articleHtml = ref('')
const articles = ref([])

function formatPreview(content) {
  if (!content) return '暂无内容'

  const text = String(content)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/[#*_>`~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return text || '图片内容'
}

function normalizeImageUrl(url) {
  if (!url) return ''

  const value = String(url).trim()
  const pexelsMatch = value.match(/pexels\.com\/(?:zh-cn\/)?photo\/(\d+)/i)
  if (pexelsMatch && pexelsMatch[1]) {
    const id = pexelsMatch[1]
    return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`
  }

  return value
}

function normalizeContentForRender(content) {
  if (!content) return ''

  let value = String(content).trim()

  value = value.replace(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi, (_, url) => {
    return `![](${normalizeImageUrl(url)})`
  })

  value = value.replace(/<img\s+[^>]*src=["']?(https?:\/\/[^"'\s>]+)["']?[^>]*>/gi, (match, url) => {
    return match.replace(url, normalizeImageUrl(url))
  })

  value = value.replace(/(https?:\/\/[^\s<>"]+\.(?:jpg|jpeg|png|gif|webp|avif|bmp)(?:\?[^\s<>"]*)?)/gi, (url) => {
    return normalizeImageUrl(url)
  })

  value = value.replace(/(https?:\/\/[^\s<>"]*pexels\.com\/[^\s<>"]+)/gi, (url) => {
    return normalizeImageUrl(url)
  })

  return value
}

function renderArticleContent(content) {
  if (!content) return '<p>暂无内容</p>'

  const value = normalizeContentForRender(content)
  const directImage = value.match(/^https?:\/\//i) ? value : ''

  if (directImage) {
    return `<img src="${normalizeImageUrl(directImage)}" alt="article-image" style="max-width:100%; border-radius:12px; margin:20px 0;" />`
  }

  return md.render(value)
}

async function loadArticleList() {
  try {
    const res = await getArticles()
    articles.value = Array.isArray(res) ? res : []
  } catch (error) {
    console.error('加载文章列表失败:', error)
  }
}

async function loadArticleDetail(id) {
  if (!id) return

  try {
    let res = await getArticleById(id)

    if (!res || typeof res !== 'object') {
      const list = await getArticles()
      const matched = Array.isArray(list) ? list.find(item => Number(item.id) === Number(id)) : null

      if (!matched) {
        article.value = {
          title: '文章异常',
          created_at: '',
          views: 0,
          content: '后端返回数据异常，请检查接口。',
          cover_image: ''
        }
        articleHtml.value = '<p>后端返回数据异常，请检查接口。</p>'
        return
      }

      res = matched
    }

    article.value = res
    articleHtml.value = renderArticleContent(res.content || '')
  } catch (error) {
    console.error('加载文章详情失败:', error)
    article.value = {
      title: '加载失败',
      created_at: '',
      views: 0,
      content: '文章加载失败',
      cover_image: ''
    }
    articleHtml.value = '<p>文章加载失败，请稍后重试。</p>'
  }
}

// 🌟 在你的 script setup 变量定义区域新增：
const transitionActive = ref(false)
const transitioningCover = ref('')
const overlayStyle = ref({})

// 🌟 替换原来的 goArticle 函数
function goArticle(event, item) {
  // 1. 获取点击卡片在屏幕中的绝对位置
  const cardEl = event.currentTarget
  const rect = cardEl.getBoundingClientRect()
  
  // 2. 拿到当前文章封面（无封面用默认图）
  transitioningCover.value = item.cover_image || defaultCover
  
  // 3. 初始状态：让遮罩层与点击的卡片完全重合
  overlayStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: '18px',
    opacity: 1
  }
  
  // 激活遮罩节点
  transitionActive.value = true

  // 4. 双重 requestAnimationFrame 确保 DOM 渲染初始样式后，再触发展开动画
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlayStyle.value = {
        top: '0px',
        left: '0px',
        width: '100vw',
        height: '100vh',
        borderRadius: '0px',
        opacity: 1
      }
    })
  })

  // 5. 动画播放完毕后（450ms），切换路由并关闭遮罩
  setTimeout(() => {
    router.push(`/articles/${item.id}`)
    
    // 给路由渲染留 100ms 缓冲后渐隐遮罩，实现无缝衔接
    setTimeout(() => {
      transitionActive.value = false
    }, 150)
  }, 450)
}

function goBack() {
  router.back()
}

async function initPage() {
  if (route.params.id) {
    await loadArticleDetail(route.params.id)
  } else {
    await loadArticleList()
  }
}

onMounted(() => {
  initPage()
})

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      await loadArticleDetail(newId)
    } else {
      await loadArticleList()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.article-container {
  min-height: 100vh;
  background-color: #f4f7f6;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.site-nav {
  background-color: #34495e;
  display: flex;
  justify-content: flex-start;
  gap: 100px;
  padding: 15px 90px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  z-index: 10;
}
.site-nav a { color: white; text-decoration: none; font-size: 1.1rem; font-weight: 500; transition: color 0.3s; }
.site-nav a:hover, .site-nav a.router-link-active { color: #42b983; }

.article-list-wrap {
  max-width: 1100px;
  margin: 40px auto 80px;
  padding: 0 20px;
}

.list-hero {
  margin-bottom: 24px;
  padding: 30px 20px;
  background: linear-gradient(135deg, #2d3748, #3b82f6);
  border-radius: 18px;
  color: white;
  box-shadow: 0 20px 30px rgba(44, 62, 80, 0.15);
}

.list-hero h1 {
  margin: 0;
  font-size: 2.3rem;
}

.article-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.article-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.12);
}

.article-thumb {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

.article-card-body {
  padding: 18px 18px 20px;
}

.article-card-body h3 {
  margin: 0 0 10px;
  font-size: 1.35rem;
  color: #1f2937;
}

.meta-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.82rem;
  color: #64748b;
  margin-bottom: 12px;
}

.article-card-body p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.article-hero {
  position: relative;
  width: 100%;
  height: 60vh;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
}

.hero-title {
  color: white;
  font-size: 3rem;
  font-weight: bold;
  text-shadow: 0 4px 10px rgba(0,0,0,0.3);
  margin-bottom: 20px;
  text-align: center;
  padding: 0 20px;
}

.hero-meta {
  display: flex;
  gap: 20px;
}

.meta-tag {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  padding: 6px 15px;
  border-radius: 30px;
  color: white;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.article-body {
  max-width: 900px;
  margin: -100px auto 50px auto;
  padding: 0 20px;
  position: relative;
  z-index: 5;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 50px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.5);
}

.content-text {
  font-size: 1.15rem;
  line-height: 2;
  color: #2c3e50;
  white-space: pre-wrap;
  letter-spacing: 0.5px;
}

.action-bar {
  margin-top: 50px;
  padding-top: 20px;
  border-top: 1px dashed #ddd;
  text-align: right;
}

.back-btn {
  background: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background: #33a06f;
  transform: translateX(-5px);
}

.tracking-in-expand {
  animation: tracking-in-expand 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) both;
}
@keyframes tracking-in-expand {
  0% { letter-spacing: -0.5em; opacity: 0; }
  40% { opacity: 0.6; }
  100% { opacity: 1; }
}

.fade-in-bottom {
  animation: fade-in-bottom 1s cubic-bezier(0.390, 0.575, 0.565, 1.000) 0.5s both;
}
@keyframes fade-in-bottom {
  0% { transform: translateY(50px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.slide-up {
  animation: slide-up 0.8s ease-out 0.3s both;
}
@keyframes slide-up {
  0% { transform: translateY(60px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@media (max-width: 768px) {
  .glass-card { padding: 30px 20px; }
  .hero-title { font-size: 2rem; }
  .article-body { margin-top: -60px; }
}

.markdown-body img {
  max-width: 100%;
  border-radius: 12px;
  margin: 20px 0;
}

.markdown-body h1 {
  font-size: 32px;
}

.markdown-body p {
  line-height: 2;
}

.markdown-body code {
  background: #f5f5f5;
  padding: 3px 6px;
  border-radius: 5px;
}

/* 🌟 新增：全屏放大转场遮罩层样式 */
/* ================= 升级版转场动画样式 (纯文字白底放大) ================= */
.expand-overlay {
  position: fixed;
  z-index: 9999;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.overlay-text-content {
  padding: 18px 18px 20px; /* 严格匹配原卡片的内边距，防止跳闪 */
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 当展开到全屏时，文字区块下移，内边距变大 */
.expand-overlay.is-expanded .overlay-text-content {
  padding: 80px 40px; 
}

.overlay-text-content h3 {
  margin: 0 0 10px;
  font-size: 1.35rem; /* 匹配原标题大小 */
  color: #1f2937;
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 展开时标题变大，视觉上引导至文章详情的大标题 */
.expand-overlay.is-expanded .overlay-text-content h3 {
  font-size: 2.5rem;
  margin-bottom: 20px;
}

.overlay-text-content p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.overlay-text-content .meta-line,
.overlay-text-content p {
  transition: all 0.3s ease;
}

/* 🌟 神奇魔法：展开快结束时，把预览文字和日期渐隐，只留大标题过渡 */
.expand-overlay.is-expanded .overlay-text-content .meta-line,
.expand-overlay.is-expanded .overlay-text-content p {
  opacity: 0;
  transform: translateY(15px); /* 伴随轻微的下沉消失感 */
}
</style>