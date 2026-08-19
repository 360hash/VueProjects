<template>
  <div class="login-page">
    <div class="login-card">
      <h1>管理员登录</h1>
      <p class="subtitle">进入博客管理后台</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>

          <input
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
            required
          />
        </div>

        <div class="form-group">
          <label>密码</label>

          <input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="login-btn"
          :disabled="loading"
        >
          {{ loading ? "登录中..." : "登录" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { login } from "@/api/article";

const router = useRouter();
const route = useRoute();

const username = ref("");
const password = ref("");

const loading = ref(false);
const errorMessage = ref("");

async function handleLogin() {
  errorMessage.value = "";
  loading.value = true;

  try {
    const result = await login(
      username.value.trim(),
      password.value
    );

    if (!result.success) {
      throw new Error(result.message || "登录失败");
    }

    localStorage.setItem("admin_token", result.token);

    const redirect =
      typeof route.query.redirect === "string"
        ? route.query.redirect
        : "/admin";

    router.replace(redirect);
  } catch (error) {
    errorMessage.value =
      error.message || "登录失败，请重试";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f4f7f6;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

.login-card h1 {
  margin: 0;
  text-align: center;
  color: #2c3e50;
}

.subtitle {
  text-align: center;
  color: #888;
  margin: 10px 0 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 16px;
}

.form-group input:focus {
  outline: none;
  border-color: #42b983;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 15px;
}

.login-btn {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 8px;
  background: #42b983;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
