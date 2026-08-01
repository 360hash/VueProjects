<template>
  <div class="articles-page-container">
    <header class="site-header">
      <h1>360</h1>
      <p>为平等和自由服务</p>
    </header>

    <nav class="site-nav">
      <router-link to="/">首页</router-link>
      <router-link to="/articles">文章</router-link>
      <router-link to="/admin">写作后台</router-link>
    </nav>

    <main class="articles-main">
      <h2 class="page-title">📝 全部文章</h2>
      
      <!-- 加载中状态 -->
      <div v-if="loading" class="loading-state">
        ⏳ 正在从 Cloudflare 边缘节点获取文章...
      </div>

      <!-- 文章列表 -->
      <div v-else-if="articles.length > 0" class="articles-list">
        <article class="article-card" v-for="article in articles" :key="article.id">
          <div class="article-info">
            <span class="article-date">📅 {{ article.date }}</span>
            <span class="article-category">🏷️ {{ article.category }}</span>
          </div>
          
          <h3 class="article-title">{{ article.title }}</h3>
          <p class="article-excerpt">{{ article.excerpt }}</p>
          
          <div class="article-footer">
            <span class="article-views">👁️ {{ article.views }} 次浏览</span>
            <!-- 修改点：将 button 换成了 router-link，实现点击跳转 -->
            <router-link :to="'/post/' + article.slug" class="read-more-btn">
              阅读全文 →
            </router-link>
          </div>
        </article>
      </div>

      <!-- 无文章状态 -->
      <div v-else class="empty-state">
        暂无文章，快去后台发布第一篇吧！
      </div>
    </main>

    <footer class="site-footer">
      <p>© {{ new Date().getFullYear() }} 我的个人博客. 保留所有权利。</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const articles = ref([])
const loading = ref(true)

// 页面加载时向 Cloudflare 后端请求 D1 数据库的数据
onMounted(async () => {
  try {
    const res = await fetch('/api/posts')
    if (res.ok) {
      const data = await res.json()
      // 将数据库拿到的字段映射回你的页面变量
      articles.value = data.map(item => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        excerpt: item.description || '暂无摘要...',
        date: item.created_at ? item.created_at.split('T')[0] : '近期',
        category: item.category || '技术随笔',
        views: item.views || 1
      }))
    }
  } catch (err) {
    console.error('获取文章失败:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* 保持你原本优秀的 CSS 样式不变 */
.articles-page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f8f9fa;
}

.site-header {
  background-color: #2c3e50;
  width: 100%;
  color: white;
  text-align: center;
  padding: 15px 0;
}

.site-header h1 {
  margin: 0;
  font-size: 2.5rem;
}

.site-header p {
  margin: 5px 0 0 0;
  color: #aeb6bf;
}

.site-nav {
  background-color: #34495e;
  display: flex;
  justify-content: flex-start;
  gap: 60px;
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

.articles-main {
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

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.article-card {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  border-left: 5px solid #34495e;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  border-left-color: #42b983;
}

.article-info {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 12px;
}

.article-title {
  color: #2c3e50;
  margin: 0 0 12px 0;
  font-size: 1.5rem;
}

.article-excerpt {
  color: #555;
  line-height: 1.6;
  font-size: 1.05rem;
  margin: 0 0 20px 0;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed #eee;
  padding-top: 15px;
}

.article-views {
  font-size: 0.9rem;
  color: #95a5a6;
}

/* 链接样式改为按钮形状 */
.read-more-btn {
  background-color: transparent;
  color: #42b983;
  border: 1px solid #42b983;
  padding: 6px 14px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-block;
}

.read-more-btn:hover {
  background-color: #42b983;
  color: white;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 50px;
  color: #7f8c8d;
  background: white;
  border-radius: 8px;
}

.site-footer {
  background-color: #1a252f;
  color: #7f8c8d;
  text-align: center;
  padding: 20px 0;
  margin-top: auto;
}
</style>