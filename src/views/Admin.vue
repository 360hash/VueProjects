<template>
  <div class="admin-container">
    <header class="admin-header">
      <h2>✍️ 博客写作后台</h2>
      <router-link to="/" class="back-link">返回主页</router-link>
    </header>

    <main class="admin-main">
      <form @submit.prevent="submitArticle" class="article-form">
        
        <div class="form-group">
          <label for="title">文章标题 <span>*</span></label>
          <input 
            type="text" 
            id="title" 
            v-model="articleForm.title" 
            placeholder="请输入文章标题..." 
            required 
          />
        </div>

        <div class="form-group">
          <label for="cover">封面图链接 (URL) <span>可选</span></label>
          <input 
            type="url" 
            id="cover" 
            v-model="articleForm.cover_image" 
            placeholder="例如: https://xxx.com/image.jpg" 
          />
        </div>

        <div class="form-group">
          <label for="content">文章正文 <span>*</span></label>
          <textarea 
            id="content" 
            v-model="articleForm.content" 
            placeholder="在这里开始你的创作..." 
            rows="15" 
            required
          ></textarea>
        </div>

        <button type="submit" class="submit-btn">发布文章</button>

      </form>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { publishArticle } from "@/api/article";

// 定义一个对象，用来把输入框里的数据绑定收集起来
const articleForm = ref({
  title: '',
  cover_image: '',
  content: ''
})

// 点击“发布文章”按钮后触发的函数
const submitArticle = async () => {
  try {
    console.log("开始发布");
    console.log(articleForm.value);

    const res = await publishArticle(articleForm.value);

    console.log("接口返回：", res);

    if (res.success) {
      alert("发布成功");
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}
</script>

<style scoped>
/* 后台页面的专属样式 */
.admin-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
  margin-bottom: 30px;
}

.admin-header h2 {
  color: #2c3e50;
  margin: 0;
}

.back-link {
  color: #7f8c8d;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s;
}

.back-link:hover {
  color: #42b983;
}

.article-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: bold;
  color: #2c3e50;
}

.form-group label span {
  font-weight: normal;
  font-size: 0.85rem;
  color: #e74c3c;
}

input[type="text"],
input[type="url"],
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.3s;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 5px rgba(66, 185, 131, 0.3);
}

.submit-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 12px 20px;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 10px;
}

.submit-btn:hover {
  background-color: #3aa876;
}
</style>