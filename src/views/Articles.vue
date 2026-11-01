<template>
  <div class="article-container">
    <div v-if="!route.params.id" class="article-list-wrap">
      <header class="list-hero">
        <div class="hero-deco hero-deco-1"></div>
        <div class="hero-deco hero-deco-2"></div>
        <div class="hero-deco hero-deco-3"></div>
        <h1>📝 文章列表</h1>
        <p>记录技术与思考的点点滴滴</p>
      </header>

      <main class="article-list">
        <!-- 点击事件，传入 $event 与 item -->
        <div v-for="item in articles" :key="item.id" class="article-card" @click="goArticle($event, item)">
          <!-- 图片区：固定高度，无图时显示渐变占位，保证卡片高度一致 -->
          <div class="thumb-wrap">
            <img v-if="item.cover_image" :src="item.cover_image" alt="cover" class="article-thumb" />
            <div v-else class="thumb-placeholder">
              <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span>暂无封面</span>
            </div>
          </div>

          <div class="article-card-body">
            <h3>{{ item.title }}</h3>
            <div class="meta-line">
              <span class="meta-date">📅 {{ item.created_at }}</span>
              <span class="meta-views">👁️ {{ item.views }}</span>
            </div>
            <p>{{ formatPreview(item.content) }}</p>
          </div>
        </div>
      </main>
    </div>

    <template v-else>
      <header class="article-hero" :class="{ 'no-cover': !article.cover_image }" :style="article.cover_image ? { backgroundImage: `url(${article.cover_image})` } : {}">
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

    <!-- 全屏放大转场动画遮罩层 -->
    <div 
      v-if="transitionActive" 
      class="expand-overlay"
      :class="{ 'is-expanded': isExpanded, 'no-cover': !transitioningCover }"
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

    <!-- 一键回到顶部 -->
    <button
      v-if="showTopBtn"
      class="back-to-top"
      @click="scrollToTop"
      aria-label="回到顶部"
      title="回到顶部"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'

import { getArticleById, getArticles } from '@/api/article'

const route = useRoute()
const router = useRouter()

const md = new MarkdownIt({
  html: true,
  breaks: true,
})

const defaultCover = new URL('../assets/image/3.jpg', import.meta.url).href

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

const transitionActive = ref(false)
const transitioningCover = ref('')
const overlayStyle = ref({})
const isExpanded = ref(false)
const transitionData = ref({
  title: '',
  created_at: '',
  views: 0,
  preview: ''
})

function goArticle(event, item) {
  const cardEl = event.currentTarget
  const rect = cardEl.getBoundingClientRect()
  
  // 填充转场数据
  transitionData.value = {
    title: item.title,
    created_at: item.created_at,
    views: item.views,
    preview: formatPreview(item.content)
  }
  transitioningCover.value = item.cover_image || ''   // 无封面则不显示图片，用渐变
  isExpanded.value = false
  
  overlayStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: '18px',
    opacity: 1
  }
  
  transitionActive.value = true

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
      isExpanded.value = true
    })
  })

  setTimeout(() => {
    router.push(`/articles/${item.id}`)
    
    setTimeout(() => {
      transitionActive.value = false
      isExpanded.value = false
    }, 150)
  }, 450)
}

function goBack() {
  router.back()
}

// ============ 一键回到顶部 ============
const showTopBtn = ref(false)

function onScroll() {
  showTopBtn.value = window.scrollY > 300
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
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
)
</script>

<style scoped>
.article-container {
  min-height: 100vh;
  background-color: #f4f7f6;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.article-list-wrap {
  max-width: 1400px;
  margin: 0 auto 80px;      /* 顶部不留空隙，hero 顶到页面顶部 */
  padding: 0 20px;
}

/* ============ 列表页 Hero（美化） ============ */
.list-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 32px;
  padding: 48px 28px;
  background: linear-gradient(135deg, #2d3748 0%, #3b82f6 55%, #42b983 100%);
  border-radius: 22px;
  color: white;
  box-shadow: 0 20px 30px rgba(44, 62, 80, 0.18);
}

.list-hero h1 {
  margin: 0 0 8px;
  font-size: 2.4rem;
  position: relative;
  z-index: 1;
}

.list-hero p {
  margin: 0;
  opacity: 0.85;
  font-size: 1.02rem;
  position: relative;
  z-index: 1;
}

/* 装饰光斑 */
.hero-deco {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.35;
  pointer-events: none;
}

.hero-deco-1 {
  width: 220px; height: 220px;
  background: radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%);
  top: -80px; right: -40px;
}

.hero-deco-2 {
  width: 140px; height: 140px;
  background: radial-gradient(circle, rgba(255,255,255,0.4), transparent 70%);
  bottom: -50px; left: 18%;
}

.hero-deco-3 {
  width: 90px; height: 90px;
  background: radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%);
  top: 30%; left: 45%;
}

/* ============ 文章卡片 ============ */
.article-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);   /* 电脑 4 列 */
  gap: 24px;
}

.article-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07);
  border: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.article-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.13);
}

/* 图片区：固定高度，有图无图高度一致 */
.thumb-wrap {
  height: 200px;
  flex-shrink: 0;
  overflow: hidden;
}

.article-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.article-card:hover .article-thumb {
  transform: scale(1.05);
}

/* 无封面占位：渐变背景 + 图标 */
.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.thumb-placeholder span {
  font-size: 0.85rem;
  opacity: 0.85;
}

.article-card-body {
  padding: 18px 18px 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.article-card-body h3 {
  margin: 0 0 10px;
  font-size: 1.3rem;
  color: #1f2937;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.meta-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  color: #64748b;
  margin-bottom: 12px;
}

.meta-date {
  background: #f1f5f9;
  padding: 3px 10px;
  border-radius: 20px;
}

.meta-views {
  background: #effef5;
  color: #059669;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;
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

/* ============ 详情页 Hero ============ */
.article-hero {
  position: relative;
  width: 100%;
  height: 55vh;
  min-height: 320px;
  background-size: cover;
  background-position: center;
}

/* 无封面：渐变填充 */
.article-hero.no-cover {
  background: linear-gradient(135deg, #2d3748 0%, #3b82f6 55%, #42b983 100%);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.8) 100%);
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
  max-width: 850px;
}

.hero-meta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
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
  max-width: 880px;
  margin: -90px auto 50px auto;
  padding: 0 20px;
  position: relative;
  z-index: 5;
}

.glass-card {
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  padding: 50px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.5);
}

.content-text {
  font-size: 1.05rem;
  line-height: 1.2;
  color: #2c3e50;
  white-space: pre-wrap;
  letter-spacing: 0;
  word-break: break-word;      /* 长单词/命令自动换行，防止溢出文本框 */
  overflow-wrap: anywhere;
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
  border-radius: 30px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background: #33a06f;
  transform: translateX(-5px);
}

/* ============ 一键回到顶部 ============ */
.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 32px;
  z-index: 901;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #42b983, #2d8f5f);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(66, 185, 131, 0.4);
  transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease;
  opacity: 0.92;
}

.back-to-top:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(66, 185, 131, 0.55);
  opacity: 1;
}

.back-to-top:active {
  transform: translateY(-1px) scale(0.95);
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

.markdown-body img {
  max-width: 100%;
  border-radius: 12px;
  margin: 20px 0;
}

.markdown-body h1 {
  font-size: 32px;
}

.markdown-body p {
  line-height: 1.65;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.markdown-body li {
  line-height: 1.65;
  margin-bottom: 6px;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.markdown-body code {
  background: #f5f5f5;
  padding: 3px 6px;
  border-radius: 5px;
}

/* 全屏放大转场遮罩层样式 */
.expand-overlay {
  position: fixed;
  z-index: 9350;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

/* 无封面：渐变背景（与详情页 hero 一致） */
.expand-overlay.no-cover {
  background: linear-gradient(135deg, #2d3748 0%, #3b82f6 55%, #42b983 100%);
}

.expand-overlay.no-cover .overlay-text-content {
  background: transparent;
}

.expand-overlay.no-cover .overlay-text-content h3 {
  color: #ffffff;
}

.expand-overlay.no-cover .overlay-text-content p {
  color: rgba(255, 255, 255, 0.85);
}

/* 转场封面图：铺满遮罩（底层） */
.overlay-img {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 文字层：居中显示，半透明底透出封面 */
.overlay-text-content {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.overlay-text-content h3 {
  margin: 0 0 10px;
  font-size: 1.35rem;
  color: #1f2937;
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

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
  max-width: 600px;
}

.overlay-text-content .meta-line,
.overlay-text-content p {
  transition: all 0.3s ease;
}

.expand-overlay.is-expanded .overlay-text-content .meta-line,
.expand-overlay.is-expanded .overlay-text-content p {
  opacity: 0;
  transform: translateY(15px);
}

/* ============ 响应式适配 ============ */
@media (max-width: 1280px) {
  .article-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 964px) {
  .article-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 628px) {
  .article-list {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .list-hero {
    padding: 34px 22px;
  }
  .list-hero h1 {
    font-size: 1.8rem;
  }
  .glass-card {
    padding: 28px 20px;
  }
  .hero-title {
    font-size: 2rem;
  }
  .article-body {
    margin-top: -60px;
  }
  .article-hero {
    height: 42vh;
    min-height: 260px;
  }
  .back-to-top {
    right: 16px;
    bottom: 24px;
    width: 42px;
    height: 42px;
  }
}
</style>
