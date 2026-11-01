<template>
  <div class="encourage-page">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <!-- ============ Hero 头部：渐变 + 爱心粒子 ============ -->
    <header class="hero">
      <div class="hero-glow glow-1"></div>
      <div class="hero-glow glow-2"></div>

      <!-- 漂浮爱心粒子 -->
      <span
        v-for="(p, i) in particles"
        :key="i"
        class="heart-particle"
        :style="{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          fontSize: p.size + 'px'
        }"
      >❤</span>

      <div class="hero-content">
        <div class="hero-badge">💖 SUPPORT THE AUTHOR</div>
        <h1 class="hero-title">支持作者</h1>
        <p class="hero-subtitle">一杯咖啡 ☕ 一份心意，让创作持续发热</p>
        <div class="hero-divider"></div>
        <p class="hero-note">您的每一次支持，都是我坚持更新的最大动力<br />感谢您的每一份鼓励与陪伴<br />你的名字博主不会忘记</p>
      </div>
    </header>

    <!-- ============ 打赏主体 ============ -->
    <main class="encourage-main">
      <div class="reward-card">
        <!-- 二维码区域 -->
        <div class="qr-area">
          <img :src="qrSrc" alt="收款二维码" class="qr-img" />
          <button class="save-btn" @click="saveImage">
            <i class="fa-solid fa-download"></i> 保存图片
          </button>
        </div>

        <!-- 感谢语 -->
        <div class="thanks-box">
          <span class="thanks-emoji">🙏</span>
          <p>感谢您的支持！每一份打赏都会被认真对待</p>
        </div>
      </div>

      <!-- 返回首页 -->
      <div class="back-row">
        <button class="back-btn" @click="goHome">
          <i class="fa-solid fa-arrow-left"></i> 返回首页
        </button>
      </div>
    </main>

    <footer class="site-footer">
      <p>© 2026 360HP博客. 保留所有权利。</p>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import qrSrc from '@/assets/image/5.png'

const router = useRouter()


// ---------- 爱心粒子（随机分布，setup 只执行一次） ----------
const particles = Array.from({ length: 14 }, () => ({
  left: Math.round(Math.random() * 100),
  delay: +(Math.random() * 7).toFixed(2),
  duration: +(8 + Math.random() * 8).toFixed(2),
  size: Math.round(12 + Math.random() * 18)
}))

// ---------- 保存图片 ----------
async function saveImage() {
  try {
    const res = await fetch(qrSrc)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '比起金钱，我更珍视的是屏幕另一端的你的这声“加油”.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('保存失败', e)
  }
}

// ---------- 返回 ----------
function goHome() {
  router.push('/')
}
</script>

<style scoped>
/* ================= 页面整体 ================= */
.encourage-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f8f9fa;
  margin: 0;
  padding: 0;
}
/* ================= Hero 头部 ================= */
.hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
  padding: 70px 20px 60px;
  text-align: center;
  color: #fff;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: glowFloat 8s ease-in-out infinite alternate;
}

.glow-1 {
  width: 430px;
  height: 445px;
  background: radial-gradient(circle, rgba(66, 185, 131, 0.55), transparent 70%);
  top: -160px;
  left: -100px;
}

.glow-2 {
  width: 480px;
  height: 450px;
  background: radial-gradient(circle, rgba(52, 152, 219, 0.5), transparent 70%);
  bottom: -200px;
  right: -120px;
  animation-delay: 2s;
}

@keyframes glowFloat {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(40px, -30px) scale(1.15); }
}

.heart-particle {
  position: absolute;
  bottom: -30px;
  color: rgba(255, 107, 129, 0.85);
  animation: floatUp linear infinite;
  pointer-events: none;
  user-select: none;
}

@keyframes floatUp {
  0%   { transform: translateY(0) rotate(0deg) scale(0.6); opacity: 0; }
  12%  { opacity: 0.9; }
  100% { transform: translateY(-520px) rotate(25deg) scale(1.1); opacity: 0; }
}

.hero-content {
  position: relative;
  z-index: 2;
  animation: fadeInDown 0.9s ease both;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero-badge {
  display: inline-block;
  font-size: 0.75rem;
  letter-spacing: 3px;
  font-weight: 600;
  color: #ffd97d;
  border: 1px solid rgba(255, 217, 125, 0.5);
  border-radius: 20px;
  padding: 5px 16px;
  margin-bottom: 18px;
  background: rgba(255, 217, 125, 0.06);
}

.hero-title {
  font-size: 2.6rem;
  margin: 0 0 12px;
  font-weight: 700;
  background: linear-gradient(90deg, #fff, #a8e6c9);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 20px;
}

.hero-divider {
  width: 70px;
  height: 3px;
  margin: 0 auto 18px;
  border-radius: 3px;
  background: linear-gradient(90deg, #42b983, #3498db);
}

.hero-note {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

/* ================= 主体 ================= */
.encourage-main {
  flex: 1;
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
  padding: 40px 20px 30px;
  box-sizing: border-box;
}

.reward-card {
  background: #fff;
  border-radius: 16px;
  border-left: 4px solid #42b983;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.07);
  padding: 32px 30px;
  animation: fadeInUp 0.7s ease both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ================= 二维码 ================= */
.qr-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1.5px solid #42b983;
  border-radius: 20px;
  background: #fff;
  color: #42b983;
  font-size: 0.88rem;
  font-weight: 550;
  cursor: pointer;
  transition: all 0.25s;
  font-family: inherit;
}

.save-btn:hover {
  background: #42b983;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.qr-box {
  text-align: center;
}

.qr-img {
  width: 220px;
  height: 220px;
  object-fit: contain;
  border: 1px solid #eef1f4;
  border-radius: 12px;
  padding: 8px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

/* 切换动画 */

/* ================= 感谢语 ================= */
.thanks-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(90deg, rgba(66, 185, 131, 0.08), rgba(52, 152, 219, 0.08));
  border-radius: 12px;
  padding: 14px;
}

.thanks-emoji {
  font-size: 1.4rem;
  animation: beat 1.6s ease-in-out infinite;
}

@keyframes beat {
  0%, 100% { transform: scale(1); }
  25%      { transform: scale(1.2); }
  40%      { transform: scale(1); }
  60%      { transform: scale(1.15); }
}

.thanks-box p {
  margin: 0;
  color: #2c3e50;
  font-size: 0.92rem;
}

/* ================= 返回按钮 ================= */
.back-row {
  text-align: center;
  margin-top: 26px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 26px;
  border: 1.5px solid #42b983;
  border-radius: 24px;
  background: #fff;
  color: #42b983;
  font-size: 0.95rem;
  font-weight: 560;
  cursor: pointer;
  transition: all 0.25s;
  font-family: inherit;
}

.back-btn:hover {
  background: #42b983;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 185, 131, 0.3);
}

/* ================= 页脚（匹配主页） ================= */
.site-footer {
  background-color: #1a252f;
  color: #7f8c8d;
  text-align: center;
  padding: 20px 0;
  margin-top: auto;
}

.site-footer p {
  margin: 0;
}

/* ================= 响应式 ================= */
@media (max-width: 540px) {
  .hero-title { font-size: 2rem; }
    .reward-card { padding: 24px 18px; }
  .qr-img { width: 190px; height: 190px; }
}

</style>
