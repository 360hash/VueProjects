<template>
  <div class="Navigation-dashboard">
    <!-- 背景动态元素 -->
    <div class="bg-animation">
      <div v-for="n in 4" :key="n" class="floating-circle"></div>
    </div>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/css/all.min.css">

    <!-- 页面布局：顶部搜索/分类 + 内容区 -->
    <div class="page-layout">
    <!-- 顶部面板：搜索 + 分类（不固定，随页面滚动） -->
    <div class="top-panel">
      <!-- 搜索栏 -->
      <div class="search-section">
        <div class="search-container">
          <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索站点..."
            @keyup.enter="handleExternalSearch"
          />
          <!-- 右侧搜索按钮（图标+名称） -->
          <button 
            class="search-submit"
            @click="handleExternalSearch"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            搜索
          </button>
        </div>
      </div>

      <!-- 分类标签栏（横排） -->
      <div class="category-bar">
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
            <div class="card-icon">
              <!-- 使用我们刚才写的方法动态绑定图片 src -->
              <img 
                :src="getFavicon(site.url)" 
                :alt="site.name" 
                class="site-favicon" 
                @error="$event.target.style.display = 'none'; $event.target.nextElementSibling.style.display = 'block'"
              />
              <!-- 这是一个备用的纯文本/Emoji图标，默认隐藏 -->
              <span style="display: none;">🌐</span>
            </div>
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
    </div><!-- /page-layout -->

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
import { ref, computed } from "vue";

// ==================== 状态定义 ====================
const searchQuery = ref("");
const selectedCategory = ref("all");
const selectedSite = ref(null);

const categories = [
  { id: "all", name: "全部" },
  { id: "dev", name: "开发工具" },
  { id: "design", name: "设计资源" },
  { id: "ai", name: "AI 工具" },
  { id: "learn", name: "学习平台" },
  { id: "materials", name: "素材" },
  { id: "game", name: "游戏资源" },
];

const websites = ref([
  {
    id: 1,
    name: "GitHub",
    description: "全球最大的代码托管平台，开发者社区",
    icon: "⚙️",
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
  {
    id: 9,
    name: "Docker Hub",
    description: "全球最大的容器镜像仓库，提供官方镜像与社区镜像，一键拉取部署，容器化开发必备",
    icon: "🎓",
    category: "dev",
    url: "https://hub.docker.com",
    favorite: false,
  },
  {
    "id": 10,
    "name": "Unsplash",
    "description": "全球知名免费高清摄影图库，提供300万+张高质量图片，支持4K画质，免费商用无需署名",
    "icon": "📷",
    "category": "materials",
    "url": "https://unsplash.com",
    "favorite": false,
  },
  {
    "id": 11,
    "name": "Pexels",
    "description": "全球CC0免费素材库，提供高清图片与4K视频，支持中文搜索，完全免费商用无需注册",
    "icon": "🖼️",
    "category": "materials",
    "url": "https://www.pexels.com/zh-cn/",
    "favorite": false,
  },
  {
    "id": 12,
    "name": "Pixabay",
    "description": "老牌免费素材平台，提供600万+图片、矢量图、插画及视频素材，支持4K画质，CC0协议可自由商用",
    "icon": "🎨",
    "category": "materials",
    "url": "https://www.pixabay.com",
    "favorite": false,
  },
  {
    "id": 13,
    "name": "Mixkit",
    "description": "免费4K视频素材站，每周更新50+艺术短片，涵盖自然、科技、动画等题材，视频音乐音效全免费",
    "icon": "🎬",
    "category": "materials",
    "url": "https://mixkit.co",
    "favorite": false,
  },
  {
    "id": 14,
    "name": "Freepik",
    "description": "设计师超级仓库，提供海量矢量图、PSD源文件、图标和Mockup样机素材，部分免费可商用",
    "icon": "✏️",
    "category": "materials",
    "url": "https://www.freepik.com",
    "favorite": false,
  },
  {
    "id": 15,
    "name": "Coverr",
    "description": "专注网页背景与Vlog封面的免费4K视频素材站，每周更新高质量素材，无水印无需注册可商用",
    "icon": "🎥",
    "category": "materials",
    "url": "https://coverr.co",
    "favorite": false,
  },
  {
    "id": 16,
    "name": "Adobe Stock",
    "description": "Adobe官方素材库，行业标杆级专业素材，深度集成Photoshop等软件，图片构图专业色彩科学",
    "icon": "💎",
    "category": "materials",
    "url": "https://stock.adobe.com",
    "favorite": false,
  },
  {
    "id": 17,
    "name": "Vecteezy",
    "description": "矢量图与插画素材平台，提供SVG/AI格式矢量素材，版权把控严格，每张免费图片附带模型授权",
    "icon": "🔷",
    "category": "materials",
    "url": "https://www.vecteezy.com",
    "favorite": false,
  },
  {
    "id": 18,
    "name": "Videvo",
    "description": "专业视频素材库，提供70万+高清视频及音效配乐，支持4K/60fps下载，免费素材可商用",
    "icon": "🎞️",
    "category": "materials",
    "url": "https://www.videvo.net",
    "favorite": false,
  },
  {
    "id": 19,
    "name": "Flaticon",
    "description": "海量图标资源库，支持SVG/PNG/字体格式下载，提供整套风格统一的图标素材",
    "icon": "🔘",
    "category": "materials",
    "url": "https://www.flaticon.com",
    "favorite": false,
  },
  {
    id: 20,
    name: "Stack Overflow",
    description: "全球最大的开发者问答社区，涵盖几乎所有编程问题，答案质量高，开发者必备排错工具",
    icon: "🤖",
    category: "dev",
    url: "https://stackoverflow.com",
    favorite: false,
  },
  {
    id: 21,
    name: "MDN Web Docs",
    description: "Mozilla维护的前端开发权威文档，覆盖HTML、CSS、JavaScript及Web API，前端开发者圣经",
    icon: "🧠",
    category: "dev",
    url: "https://developer.mozilla.org",
    favorite: false,
  },
  {
    id: 22,
    name: "Gemini",
    description: "Google出品，多模态能力天花板，与Gmail、Docs等谷歌全家桶无缝打通",
    icon: "💎",
    category: "ai",
    url: "https://gemini.google.com",
    favorite: false,
  },
  {
    id: 23,
    name: "DeepSeek",
    description: "国产性价比之王，Agent能力顶尖，中文语境理解出色，免费额度充足",
    icon: "🔍",
    category: "ai",
    url: "https://deepseek.com",
    favorite: false,
  },
  {
    id: 24,
    name: "Grok",
    description: "马斯克旗下xAI开发，独家接入X平台实时数据，支持DeepSearch智能搜索、多模态交互及图像生成，风格幽默直率",
    icon: "🚀",
    category: "ai",
    url: "https://www.grok.com",
    favorite: false,
  },
  {
    id: 25,
    name: "Kimi",
    description: "月之暗面出品，支持200万字超长上下文，长文档分析与论文阅读标杆",
    icon: "📄",
    category: "ai",
    url: "https://www.kimi.com",
    favorite: false,
  },
  {
    id: 26,
    name: "Perplexity",
    description: "AI搜索引擎先驱，提供带来源引用的精准答案，支持限定学术/社交媒体等搜索范围",
    icon: "🔎",
    category: "ai",
    url: "https://www.perplexity.ai",
    favorite: false,
  },
  {
    id: 27,
    name: "Runway",
    description: "专业AI视频生成与编辑工具，支持运动笔刷精准控制画面动态、风格迁移及智能剪辑",
    icon: "🎬",
    category: "ai",
    url: "https://runwayml.com",
    favorite: false,
  },
  {
    id: 28,
    name: "GitHub Copilot",
    description: "微软/OpenAI出品，全球普及率最高的AI编程助手，深度集成GitHub生态，支持多模型切换",
    icon: "💻",
    category: "ai",
    url: "https://github.com/features/copilot",
    favorite: false,
  },
  {
    id: 29,
    name: "ElevenLabs",
    description: "AI语音合成与克隆工具，支持多语言及高拟真语音生成，适合播客、有声书及视频配音",
    icon: "🎙️",
    category: "ai",
    url: "https://elevenlabs.io",
    favorite: false,
  },
  {
    id: 30,
    name: "即梦AI",
    description: "字节跳动出品，支持文/图生图及视频，中文提示词友好，每日赠送免费积分，性价比极高",
    icon: "✨",
    category: "ai",
    url: "https://jimeng.jianying.com",
    favorite: false,
  },
  {
    id: 31,
    name: "Cursor",
    description: "基于VS Code的AI原生编辑器，支持项目级理解与自然语言驱动重构，端到端编辑延迟低于600ms",
    icon: "⚡",
    category: "ai",
    url: "https://www.cursor.com",
    favorite: false,
  },{
    id: 32,
    name: "edX",
    description: "哈佛大学与麻省理工学院联合创办的非营利平台，提供全球顶尖高校课程，学术性强，支持免费旁听",
    icon: "🏛️",
    category: "learn",
    url: "https://www.edx.org",
    favorite: false,
  },
  {
    id: 33,
    name: "Khan Academy",
    description: "非营利教育平台，覆盖数学、科学、经济等全学科，完全免费无广告，支持个性化学习路径",
    icon: "📐",
    category: "learn",
    url: "https://www.khanacademy.org",
    favorite: false,
  },
  {
    id: 34,
    name: "Udemy",
    description: "全球最大实用技能课程平台，汇聚数十万门课程，涵盖编程、设计、营销等，由行业专家授课，注重实战",
    icon: "📚",
    category: "learn",
    url: "https://www.udemy.com",
    favorite: false,
  },
  {
    id: 35,
    name: "中国大学MOOC",
    description: "教育部指导、网易与高教社联合打造，汇聚国内顶尖高校精品课，覆盖全学科，可免费学习并申请证书",
    icon: "🎓",
    category: "learn",
    url: "https://www.icourse163.org",
    favorite: false,
  },
  {
    id: 36,
    name: "学堂在线",
    description: "清华大学发起，汇集国内外200多所高校超5000门课程，工科与计算机资源丰富，部分课程支持学分互认",
    icon: "🏫",
    category: "learn",
    url: "https://www.xuetangx.com",
    favorite: false,
  },
  {
    id: 37,
    name: "Skillshare",
    description: "创意设计类学习社区，涵盖插画、摄影、设计、写作等课程，以项目制教学为主，适合创意从业者",
    icon: "🎨",
    category: "learn",
    url: "https://www.skillshare.com",
    favorite: false,
  },
  {
    id: 38,
    name: "Codecademy",
    description: "交互式编程学习平台，支持Python、JavaScript、SQL等主流语言，边学边练，零基础友好",
    icon: "💻",
    category: "learn",
    url: "https://www.codecademy.com",
    favorite: false,
  },
  {
    id: 39,
    name: "Duolingo",
    description: "游戏化语言学习平台，支持40多种语言，通过闯关模式轻松学外语，基础功能完全免费",
    icon: "🦉",
    category: "learn",
    url: "https://www.duolingo.com",
    favorite: false,
  },
  {
    id: 40,
    name: "LinkedIn Learning",
    description: "微软旗下职业发展学习平台，课程与职场技能深度绑定，支持技能认证，与LinkedIn职业档案打通",
    icon: "💼",
    category: "learn",
    url: "https://www.linkedin.com/learning",
    favorite: false,
  },
  {
    id: 41,
    name: "Udacity",
    description: "专注前沿科技的纳米学位平台，提供AI、数据科学、自动驾驶等课程，与谷歌、亚马逊等企业合作授课",
    icon: "🚀",
    category: "learn",
    url: "https://www.udacity.com",
    favorite: false,
  },
  {
    id: 42,
    name: "网易公开课",
    description: "整合哈佛、耶鲁、牛津等全球名校课程及TED演讲，配备专业中文字幕，涵盖人文社科等22个领域",
    icon: "🎬",
    category: "learn",
    url: "https://open.163.com",
    favorite: false,
  },
  {
    id: 43,
    name: "菜鸟教程",
    description: "编程入门免费平台，支持HTML、Python、Java等主流语言，内置在线编译器，边学边练无需注册",
    icon: "🐣",
    category: "learn",
    url: "https://www.runoob.com",
    favorite: false,
  },
  {
    id: 44,
    name: "剪映AI",
    description: "字节跳动旗下剪映团队推出的智能视频编辑工具,智能成片",
    icon: "🎓",
    category: "ai",
    url: "https://www.capcut.cn/",
    favorite: false,
  },
  {
    id: 45,
    name: "Midjourney",
    description: "AI图像生成天花板，画质、光影、细节达商业级水准，适合插画、海报及概念设计",
    icon: "🎨",
    category: "ai",
    url: "https://www.midjourney.com",
    favorite: false,
  },
  {
  id: 46,
  name: "Steam",
  description: "全球最大的PC游戏平台，拥有数万款游戏，定期举办夏促/冬促大幅折扣，社区功能丰富",
  icon: "🎮",
  category: "game",
  url: "https://store.steampowered.com",
  favorite: false,
  },
  {
    id: 47,
    name: "Epic Games",
    description: "每周免费赠送1-2款正版游戏，独占大作频出，虚幻引擎开发商旗下平台",
    icon: "🏪",
    category: "game",
    url: "https://epicgames.com",
    favorite: false,
  },
  {
    id: 48,
    name: "GOG",
    description: "CDPR旗下平台，主打无DRM正版游戏，购买后可自由备份，经典老游戏兼容性好",
    icon: "🎯",
    category: "game",
    url: "https://www.gog.com",
    favorite: false,
  },
  {
    id: 49,
    name: "itch.io",
    description: "独立游戏天堂，海量创意小游戏，许多免费或随心付费，独立开发者首选发布平台",
    icon: "🕹️",
    category: "game",
    url: "https://itch.io",
    favorite: false,
  },
  {
    id: 50,
    name: "Nintendo eShop",
    description: "任天堂官方数字商店，Switch游戏主阵地，独占大作与精品独立游戏兼备",
    icon: "🍄",
    category: "game",
    url: "https://www.nintendo.com/us/store/",
    favorite: false,
  },
  {
    id: 51,
    name: "PlayStation Store",
    description: "索尼官方数字商店，PS5/PS4游戏及DLC购买平台，定期推出会员折扣与免费游戏",
    icon: "🎮",
    category: "game",
    url: "https://store.playstation.com",
    favorite: false,
  },
  {
    id: 52,
    name: "Xbox商店",
    description: "微软官方游戏平台，Xbox Game Pass订阅制畅玩数百款游戏，性价比极高",
    icon: "🟢",
    category: "game",
    url: "https://www.xbox.com/games/store",
    favorite: false,
  },
  {
    id: 53,
    name: "Humble Bundle",
    description: "游戏慈善捆绑包平台，低价打包购买多款正版游戏，部分收入捐赠公益，经常有超值大包",
    icon: "🎁",
    category: "game",
    url: "https://www.humblebundle.com",
    favorite: false,
  },
  {
    id: 54,
    name: "gdgame",
    description: "游戏资源网站，提供最新pj游戏、汉化补丁及MOD下载，支持PC/安卓/iOS平台",
    icon: "📱",
    category: "game",
    url: "https://www.gdgame.net",
    favorite: false,
  },
  {
    id: 55,
    name: "WeGame",
    description: "腾讯旗下PC游戏平台，引进多款海外大作国服版本，支持中文支付与本地化服务",
    icon: "🐧",
    category: "game",
    url: "https://www.wegame.com.cn",
    favorite: false,
  },
  {
    id: 56,
    name: "4399小游戏",
    description: "国内最知名的在线小游戏平台，拥有数万款即点即玩的Flash/H5游戏，涵盖动作、益智、双人、冒险等全品类，童年回忆聚集地",
    icon: "🎮",
    category: "game",
    url: "https://www.4399.com",
    favorite: false,
  },
  {
    id: 57,
    name: "7k7k小游戏",
    description: "国内老牌在线小游戏平台，主打年轻化社交化体验，支持跨设备进度同步，设有青少年模式，游戏种类丰富",
    icon: "🕹️",
    category: "game",
    url: "https://www.7k7k.com",
    favorite: false,
  },
  {
    id: 58,
    name: "Poki",
    description: "荷兰阿姆斯特丹出品的全球知名免费游戏平台，收录3000+款HTML5游戏，月活超9000万，无需注册登录，无弹窗干扰",
    icon: "🌍",
    category: "game",
    url: "https://poki.com",
    favorite: false,
  },
  {
    id: 59,
    name: "CrazyGames",
    description: "高质量免费在线网页游戏平台，涵盖动作、冒险、射击、赛车、塔防等类型，无需Flash插件，无需注册，打开即玩",
    icon: "🤪",
    category: "game",
    url: "https://www.crazygames.com",
    favorite: false,
  },
  {
    id: 60,
    name: "Minecraft网页版",
    description: "Mojang官方推出的浏览器版我的世界，基于经典0.023a版本重制，支持生存/创造模式，无需下载客户端，浏览器直接开玩",
    icon: "⛏️",
    category: "game",
    url: "https://classic.minecraft.net",
    favorite: false,
  },
  {
    id: 61,
    name: "Y8 Games",
    description: "老牌免费在线游戏平台，收录数千款网页游戏，涵盖3D、多人联机、体育、益智等品类，支持HTML5即点即玩",
    icon: "🎯",
    category: "game",
    url: "https://www.y8.com",
    favorite: false,
  },
  {
    id: 62,
    name: "MCJS网页版",
    description: "基于Eaglercraft开源项目的我的世界网页版，支持1.8.8/1.12.2版本，完整中文汉化，支持联机、材质包，免Java环境",
    icon: "🧱",
    category: "game",
    url: "https://mcjs.link",
    favorite: false,
  },
  {
    id: 63,
    name: "KBH Games",
    description: "免费在线网页游戏平台，收录数千款不同类型游戏，包含经典4399小游戏及海外热门作品，特别适合节奏音乐类游戏爱好者",
    icon: "🎵",
    category: "game",
    url: "https://kbhgames.com",
    favorite: false,
  },
  {
    id: 64,
    name: "itch.io",
    description: "独立游戏天堂，海量创意小游戏，许多免费或随心付费，支持浏览器直接游玩，独立开发者首选发布平台",
    icon: "🕹️",
    category: "game",
    url: "https://itch.io",
    favorite: false,
  },
  {
    id: 65,
    name: "npm",
    description: "Node.js官方包管理平台，拥有全球最大的开源软件注册表，超200万个包可供安装使用",
    icon: "📦",
    category: "dev",
    url: "https://www.npmjs.com",
    favorite: false,
  },
  {
  id: 66,
  name: "Postman",
  description: "API开发与测试工具，支持接口调试、自动化测试、Mock服务器及API文档生成，团队协作友好",
  icon: "📮",
  category: "dev",
  url: "https://www.postman.com",
  favorite: false,
  },
  {
    id: 67,
    name: "CodePen",
    description: "在线前端代码编辑器，支持HTML/CSS/JS实时预览与分享，适合快速原型开发与灵感探索",
    icon: "🖊️",
    category: "dev",
    url: "https://codepen.io",
    favorite: false,
  },
  {
    id: 68,
    name: "Cloudflare",
    description: "全球领先的云安全与CDN平台，提供免费DDoS防护、WAF防火墙、全球CDN加速、Workers无服务器计算、R2对象存储及1.1.1.1免费DNS，开发者必备基础设施",
    icon: "☁️",
    category: "dev",
    url: "https://www.cloudflare.com",
    favorite: false,
  },
  {
    id: 69,
    name: "Vercel",
    description: "前端部署平台，与Next.js深度集成，支持Git推送自动部署、全球CDN加速，个人项目免费",
    icon: "▲",
    category: "dev",
    url: "https://vercel.com",
    favorite: false,
  },
  {
    id: 70,
    name: "DevDocs",
    description: "开发者文档聚合平台，整合上百种编程语言与框架的官方文档，支持离线访问与全文搜索",
    icon: "📖",
    category: "dev",
    url: "https://devdocs.io",
    favorite: false,
  },
  {
    id: 71,
    name: "Regex101",
    description: "正则表达式在线测试工具，支持实时匹配高亮、表达式解释及多语言模式，调试正则必备",
    icon: "🔤",
    category: "dev",
    url: "https://regex101.com",
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

  // 搜索：过滤不匹配的，匹配的按相关度排序（名称匹配 > 描述匹配）
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase();

    const score = (site) => {
      const name = site.name.toLowerCase();
      const desc = site.description.toLowerCase();
      if (name.includes(query)) return 0;        // 名称匹配：最前
      if (desc.includes(query)) return 1;        // 描述匹配：次之
      return 2;                                  // 不匹配：过滤掉
    };

    result = result
      .map((site) => ({ site, s: score(site) }))
      .filter((item) => item.s < 2)
      .sort((a, b) => a.s - b.s)
      .map((item) => item.site);
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

// 新增：自动获取网站图标
const getFavicon = (url) => {
  try {
    // 提取域名 (例如从 https://github.com 提取出 github.com)
    const domain = new URL(url).hostname;
    // 使用 Google 的服务获取清晰图标（sz=128代表128px高清）
    return `https://favicon.im/${domain}?larger=128`;
  } catch (error) {
    return ''; // 解析失败时返回空
  }
};

// 新增：外部搜索跳转功能
const handleExternalSearch = () => {
  const keyword = searchQuery.value.trim();
  if (!keyword) return;
  // 这里以百度为例，如果想换谷歌，改为 https://www.google.com/search?q=
  const searchUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`;
  window.open(searchUrl, '_blank'); // 在新标签页打开
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
// 分类栏改为侧边栏竖排后不再需要 sticky 滚动监听
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

/* ===== 页面布局：顶部面板 + 内容区 ===== */
.page-layout {
  max-width: 1400px;
  margin: 0 auto;
  padding: 84px 24px 24px;   /* 顶部留出全局导航栏空间 */
  position: relative;
  z-index: 1;
}

/* ===== 顶部面板（搜索 + 分类，不固定） ===== */
.top-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

/* ===== 搜索栏（一体式卡片） ===== */
.search-section {
  display: flex;
  justify-content: center;
}

.search-container {
  width: 620px;
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 24px;
  padding: 5px 5px 5px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

/* 聚焦时：绿色边框 + 柔光 */
.search-container:focus-within {
  border-color: #42b983;
  box-shadow: 0 0 0 4px rgba(66, 185, 131, 0.12),
              0 4px 16px rgba(66, 185, 131, 0.10);
}

.search-icon {
  flex-shrink: 0;
  color: #909399;
  transition: color 0.3s ease;
}

.search-container:focus-within .search-icon {
  color: #42b983;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 36px;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #2c3e50;
}

.search-input::placeholder {
  color: #a8abb2;
}

/* 搜索按钮：渐变 + 动效 */
.search-submit {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, #42b983, #2e9e6e);
  color: #fff;
  border: none;
  border-radius: 18px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 585;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.search-submit:hover {
  filter: brightness(1.07);
  box-shadow: 0 3px 12px rgba(66, 185, 131, 0.35);
  transform: translateY(-1px);
}

.search-submit:active {
  transform: translateY(0) scale(0.97);
}

/* ===== 分类标签栏（顶部横排，不固定） ===== */
.category-bar {
  display: flex;
  justify-content: center;
  background-color: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.category-tag {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #e4e7ed;
  background: #fff;
  color: #606266;
  font-size: 13px;
  font-weight: 555;
  cursor: pointer;
  transition: all 0.25s var(--ease-smooth);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  text-align: left;
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
  position: relative;
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

/* 新增：网站图标图片样式 */
.site-favicon {
  width: 24px;   /* 可以根据你的喜好调整大小，比如 28px */
  height: 24px;
  border-radius: 4px; /* 让图标有一点点圆角更精美 */
  object-fit: contain; /* 保证图标比例不失真 */
}

/* ===== 移动端适配：顶部面板紧凑 ===== */
@media (max-width: 700px) {
  .page-layout {
    padding: 72px 14px 20px;
  }

  .top-panel {
    gap: 12px;
    margin-bottom: 16px;
  }

  .search-container {
    width: 100%;
    padding: 4px 4px 4px 12px;
    border-radius: 20px;
  }

  .search-input {
    height: 32px;
    font-size: 13px;
  }

  .search-icon {
    width: 14px;
    height: 14px;
  }

  /* 手机端：搜索按钮小号 */
  .search-submit {
    padding: 7px 12px;
    border-radius: 15px;
    font-size: 12px;
    gap: 4px;
  }

  .search-submit svg {
    width: 11px;
    height: 11px;
  }

  .category-tags {
    gap: 8px;
  }

  .category-tag {
    padding: 7px 12px;
    font-size: 12px;
  }

  /* 卡片网格单列 */
  .card-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}
</style>