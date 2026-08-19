<template>
  <div class="Navigation-dashboard">
    <!-- 背景动态元素 -->
    <div class="bg-animation">
      <div v-for="n in 4" :key="n" class="floating-circle"></div>
    </div>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/css/all.min.css">

    <!-- 导航栏 -->
    <nav class="navbar" :class="{ scrolled: isScrolled }">
      <div class="logo">N</div>
      <div class="search-container">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索网站..."
        />
      </div>
      <div class="user-avatar">U</div>
    </nav>

    <!-- 分类标签栏 -->
    <div class="category-bar" :class="{ 'sticky-active': isScrolled }">
      <div class="category-tags">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="category-tag"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectedCategory = cat.id"
        >
          {{ cat.name }}
          <span class="tag-badge">{{ getCategoryCount(cat.id) }}</span>
        </button>
      </div>
    </div>

    <div v-for="site in sites" :key="site.id" class="site-card">
      <!-- ✅ 关键改动：:class 绑定 -->
      <i :class="['site-icon', site.icon]"></i>

      <div class="info">
        <h3>{{ site.name }}</h3>
        <p>{{ site.description }}</p>
      </div>
    </div>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="card-grid">
        <div
          v-for="site in filteredWebsites"
          :key="site.id"
          class="website-card"
          :class="{
            match: isMatch(site),
            unmatch: !isMatch(site) && searchQuery,
          }"
          @click="openModal(site)"
        >
          <div class="card-header">
            <div
              class="card-icon-wrapper"
              @mousemove="handleIconMouseMove"
              @mouseleave="handleIconMouseLeave"
            >
              <div class="card-icon">{{ site.icon }}</div>
            </div>
            <button
              class="favorite-btn"
              :class="{ active: site.favorite }"
              @click.stop="site.favorite = !site.favorite"
            >
              {{ site.favorite ? "❤️" : "🤍" }}
            </button>
          </div>
          <h3 class="card-title">{{ site.name }}</h3>
          <p class="card-desc">{{ site.description }}</p>
          <div class="card-footer">
            <span class="card-tag">{{ getCategoryName(site.category) }}</span>
          </div>
        </div>
      </div>
    </main>

    <!-- 模态框 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedSite" class="modal-overlay" @click.self="closeModal">
          <div class="modal-content">
            <div class="modal-header">
              <h2 class="modal-title">{{ selectedSite.name }}</h2>
              <button class="modal-close" @click="closeModal">×</button>
            </div>
            <div class="modal-body">
              <p>{{ selectedSite.description }}</p>
              <p class="modal-meta">
                分类：{{ getCategoryName(selectedSite.category) }}
              </p>
              <a
                :href="selectedSite.url"
                target="_blank"
                rel="noopener noreferrer"
                class="modal-link"
              >
                访问网站 →
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

// ==================== 状态定义 ====================
const searchQuery = ref("");
const selectedCategory = ref("all");
const isScrolled = ref(false);
const selectedSite = ref(null);

const categories = [
  { id: "all", name: "全部" },
  { id: "dev", name: "开发工具" },
  { id: "design", name: "设计资源" },
  { id: "ai", name: "AI 工具" },
  { id: "learn", name: "学习平台" },
];

const websites = ref([
  {
    id: 1,
    name: "GitHub",
    description: "全球最大的代码托管平台，开发者社区",
    icon: "🎨",
    category: "dev",
    url: "https://github.com",
    favorite: false,
  },
  {
    id: 2,
    name: "Figma",
    description: "协作式界面设计工具，支持实时协作",
    icon: "🎨",
    category: "design",
    url: "https://figma.com",
    favorite: true,
  },
  {
    id: 3,
    name: "ChatGPT",
    description: "OpenAI 开发的智能对话助手",
    icon: "🤖",
    category: "ai",
    url: "https://chat.openai.com",
    favorite: false,
  },
  {
    id: 4,
    name: "MDN Web Docs",
    description: "Mozilla 的 Web 开发文档，权威技术参考",
    icon: "📚",
    category: "learn",
    url: "https://developer.mozilla.org",
    favorite: true,
  },
  {
    id: 5,
    name: "VS Code",
    description: "轻量级但功能强大的代码编辑器",
    icon: "💻",
    category: "dev",
    url: "https://code.visualstudio.com",
    favorite: false,
  },
  {
    id: 6,
    name: "Dribbble",
    description: "设计师作品展示平台，获取设计灵感",
    icon: "🏀",
    category: "design",
    url: "https://dribbble.com",
    favorite: false,
  },
  {
    id: 7,
    name: "Claude",
    description: "Anthropic 开发的 AI 助手",
    icon: "🧠",
    category: "ai",
    url: "https://claude.ai",
    favorite: false,
  },
  {
    id: 8,
    name: "Coursera",
    description: "在线学习平台，提供世界顶尖大学课程",
    icon: "🎓",
    category: "learn",
    url: "https://coursera.org",
    favorite: false,
  },
]);

// ==================== 计算属性 ====================
const filteredWebsites = computed(() => {
  let result = websites.value;

  // 分类过滤
  if (selectedCategory.value !== "all") {
    result = result.filter((site) => site.category === selectedCategory.value);
  }

  return result;
});

// ==================== 方法 ====================
const getCategoryCount = (catId) => {
  if (catId === "all") return websites.value.length;
  return websites.value.filter((site) => site.category === catId).length;
};

const getCategoryName = (catId) => {
  return categories.find((c) => c.id === catId)?.name || "";
};

const isMatch = (site) => {
  if (!searchQuery.value) return true;
  const query = searchQuery.value.toLowerCase();
  return (
    site.name.toLowerCase().includes(query) ||
    site.description.toLowerCase().includes(query)
  );
};

const openModal = (site) => {
  selectedSite.value = site;
};

const closeModal = () => {
  selectedSite.value = null;
};

// 3D 图标倾斜效果
const handleIconMouseMove = (event) => {
  const wrapper = event.currentTarget;
  const icon = wrapper.querySelector(".card-icon");
  const rect = wrapper.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotateX = ((y - centerY) / centerY) * -15;
  const rotateY = ((x - centerX) / centerX) * 15;

  icon.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
};

const handleIconMouseLeave = (event) => {
  const icon = event.currentTarget.querySelector(".card-icon");
  icon.style.transform = "rotateX(0) rotateY(0)";
};

// ==================== 滚动监听 ====================
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
/* ===== CSS 变量（仅作用于当前组件） ===== */
.nav-dashboard {
  --color-lightest-green: #e8f8f0;
  --color-primary-green: #42b983;
  --color-dark-green: #2e7d5a;
  --color-cloud: #f5f7fa;
  --color-silver: #e4e7ed;
  --color-warm-gray: #909399;
  --color-dark-blue-gray: #2c3e50;
  --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* ===== 全局重置（通过 deep 或外部处理更佳，此处简化） ===== */
.nav-dashboard * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.nav-dashboard {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--color-cloud);
  color: var(--color-dark-blue-gray);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* ===== 背景动画 ===== */
.bg-animation {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.floating-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 20s infinite ease-in-out;
}

.floating-circle:nth-child(1) {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #42b983, #1abc9c);
  top: 10%;
  left: 10%;
}
.floating-circle:nth-child(2) {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #5dade2, #9b8ec4);
  top: 60%;
  right: 15%;
  animation-delay: 5s;
}
.floating-circle:nth-child(3) {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #ff8559, #f0a868);
  bottom: 20%;
  left: 20%;
  animation-delay: 10s;
}
.floating-circle:nth-child(4) {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #e88ca5, #9b8ec4);
  top: 30%;
  right: 30%;
  animation-delay: 15s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(50px, -50px) rotate(90deg);
  }
  50% {
    transform: translate(0, -100px) rotate(180deg);
  }
  75% {
    transform: translate(-50px, -50px) rotate(270deg);
  }
}

/* ===== 导航栏 ===== */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background-color: #35495e;
  display: flex;
  align-items: center;
  padding: 0 24px;
  z-index: 1000;
  transition:
    background-color 0.3s var(--ease-smooth),
    box-shadow 0.3s var(--ease-smooth);
}

.navbar.scrolled {
  background-color: #2c3e50;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #42b983;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(66, 185, 131, 0.7);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(66, 185, 131, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(66, 185, 131, 0);
  }
}

.search-container {
  flex: 1;
  max-width: 600px;
  margin: 0 32px;
  position: relative;
}

.search-input {
  width: 100%;
  height: 40px;
  border-radius: 24px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  padding: 0 16px 0 40px;
  font-size: 14px;
  color: #2c3e50;
  outline: none;
  transition: all 0.3s var(--ease-smooth);
}

.search-input::placeholder {
  color: #909399;
}

.search-input:focus {
  border-color: #42b983;
  background-color: #e8f8f0;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  pointer-events: none;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #42b983, #1abc9c);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.user-avatar:active {
  transform: scale(0.96);
}

/* ===== 分类标签栏 ===== */
.category-bar {
  position: sticky;
  top: 64px;
  background-color: #f5f7fa;
  padding: 16px 24px;
  z-index: 900;
  border-bottom: 3px solid transparent;
  transition: border-color 0.3s var(--ease-smooth);
  overflow-x: auto;
  white-space: nowrap;
}

.category-bar::-webkit-scrollbar {
  display: none;
}

.category-bar.sticky-active {
  border-bottom-color: #42b983;
}

.category-tags {
  display: flex;
  gap: 12px;
}

.category-tag {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #e4e7ed;
  background: transparent;
  color: #909399;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s var(--ease-smooth);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.category-tag:hover {
  color: #42b983;
  border-color: #a8e6cf;
}

.category-tag.active {
  background-color: #e8f8f0;
  color: #42b983;
  border-color: #e8f8f0;
}

.tag-badge {
  background-color: #9b8ec4;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

/* ===== 主内容区 ===== */
.main-content {
  padding: 24px;
  max-width: 1400px;
  margin: 88px auto 0;
  position: relative;
  z-index: 1;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* ===== 卡片 ===== */
.website-card {
  background-color: #fff;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  padding: 20px;
  cursor: pointer;
  position: relative;
  transition:
    transform 0.3s var(--ease-smooth),
    box-shadow 0.3s var(--ease-smooth),
    border-color 0.3s var(--ease-smooth);
  overflow: hidden;
}

.website-card:hover {
  box-shadow: 0 8px 24px rgba(66, 185, 131, 0.15);
  border-color: #a8e6cf;
  transform: translateY(-4px);
}

.website-card.match {
  border-color: #42b983;
}

.website-card.unmatch {
  opacity: 0.3;
  pointer-events: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-icon-wrapper {
  perspective: 500px;
  width: 40px;
  height: 40px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: #e8f8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: transform 0.2s ease-out;
  transform-style: preserve-3d;
  will-change: transform;
}

.favorite-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #e4e7ed;
  font-size: 18px;
  transition: all 0.3s var(--ease-bounce);
  position: relative;
  z-index: 2;
}

.favorite-btn.active {
  color: #e88ca5;
}

.favorite-btn:active {
  transform: scale(0.96);
}

.card-title {
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 6px;
}

.card-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #e8f8f0;
  color: #42b983;
}

/* ===== 模态框 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(44, 62, 80, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background-color: #fff;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #2c3e50;
}

.modal-body {
  color: #606266;
  line-height: 1.6;
}

.modal-meta {
  margin-top: 12px;
  color: #909399;
  font-size: 13px;
}

.modal-link {
  display: inline-block;
  margin-top: 20px;
  padding: 10px 24px;
  background-color: #42b983;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.modal-link:hover {
  background-color: #2e7d5a;
}

/* ===== 模态框过渡动画 ===== */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: all 0.3s var(--ease-bounce);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content {
  transform: translateY(30px) scale(0.95);
}

.modal-leave-to .modal-content {
  transform: translateY(30px) scale(0.95);
}
</style>