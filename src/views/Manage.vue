<template>
  <div class="Navigation-container">
    <header class="Navigation-header">
      <h1>📚 文章管理</h1>
      <router-link to="/admin" class="write-btn">✍️ 写文章</router-link>
    </header>

    <div class="article-list">
      <div v-for="article in articles" :key="article.id" class="article-card" @click="openPreview(article)">
        <div class="article-info">
          <h2>{{ article.title }}</h2>
          <p class="time">发布时间：{{ article.created_at }}</p>
          <p class="preview-text">{{ getPreview(article.content) }}</p>

          <div class="actions">
            <button @click.stop="startEdit(article)" class="edit-btn">✏ 修改</button>
            <button @click.stop="deleteArticle(article.id)" class="delete-btn">🗑 删除</button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedArticle" class="modal-mask" @click.self="closePreview">
          <div class="modal-box">
            <button class="close-btn" @click="closePreview">×</button>

            <h1>{{ selectedArticle.title }}</h1>
            <p class="modal-time">{{ selectedArticle.created_at }}</p>
            <img v-if="selectedArticle.cover_image" :src="selectedArticle.cover_image" class="cover" />

            <div v-if="!isEditing" class="content">{{ selectedArticle.content }}</div>

            <div v-else class="edit-panel">
              <div class="form-row">
                <label>标题</label>
                <input v-model="editForm.title" type="text" />
              </div>

              <div class="form-row">
                <label>封面图片</label>
                <input v-model="editForm.cover_image" type="text" placeholder="可选" />
              </div>

              <div class="form-row">
                <label>正文</label>
                <textarea v-model="editForm.content" rows="12"></textarea>
              </div>

              <div class="edit-actions">
                <button @click="saveEdit" class="save-btn">保存</button>
                <button @click="cancelEdit" class="cancel-btn">取消</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getArticles, deleteArticle as removeArticle, updateArticle } from '@/api/article'

const articles = ref([])
const selectedArticle = ref(null)
const isEditing = ref(false)
const editForm = ref({ title: '', content: '', cover_image: '' })

async function loadArticles() {
  try {
    const data = await getArticles()
    articles.value = data
  } catch (error) {
    console.error('获取文章失败:', error)
  }
}

function getPreview(content) {
  if (!content) return ''
  if (content.length > 120) return content.substring(0, 120) + '...'
  return content
}

function openPreview(article) {
  selectedArticle.value = article
  isEditing.value = false
}

function closePreview() {
  selectedArticle.value = null
  isEditing.value = false
  editForm.value = { title: '', content: '', cover_image: '' }
}

function startEdit(article) {
  selectedArticle.value = article
  isEditing.value = true
  editForm.value = {
    title: article.title || '',
    content: article.content || '',
    cover_image: article.cover_image || ''
  }
}

function cancelEdit() {
  isEditing.value = false
  editForm.value = { title: '', content: '', cover_image: '' }
}

async function saveEdit() {
  if (!selectedArticle.value) return

  try {
    await updateArticle(selectedArticle.value.id, {
      title: editForm.value.title,
      content: editForm.value.content,
      cover_image: editForm.value.cover_image || null
    })

    alert('修改成功')
    isEditing.value = false
    await loadArticles()
    const updated = articles.value.find(item => Number(item.id) === Number(selectedArticle.value.id))
    selectedArticle.value = updated || selectedArticle.value
  } catch (error) {
    console.error('修改失败:', error)
    alert('修改失败')
  }
}

async function deleteArticle(id) {
  const confirmDelete = confirm('确定删除这篇文章吗？')
  if (!confirmDelete) return

  try {
    const res = await removeArticle(id)
    if (res.success) {
      alert('删除成功')
      await loadArticles()
      if (selectedArticle.value && Number(selectedArticle.value.id) === Number(id)) {
        selectedArticle.value = null
      }
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败')
  }
}

onMounted(() => {
  loadArticles()
})
</script>

<style scoped>
.Navigation-container {
  max-width: 1000px;
  margin: 40px auto;
  padding: 20px;
}

.Navigation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
}

.Navigation-header h1 {
  color: #2c3e50;
  margin: 0;
}

.write-btn {
  background: #42b983;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.article-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 5px 20px rgba(0,0,0,.08);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.article-card:hover {
  transform: translateY(-2px);
}

.article-card h2 {
  margin-top: 0;
  color: #333;
}

.time {
  color: #999;
  font-size: 14px;
}

.preview-text {
  line-height: 1.8;
  color: #555;
  overflow: hidden;
}

.actions {
  margin-top: 20px;
}

.actions button,
.edit-actions button {
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 10px;
}

.edit-btn {
  background: #3498db;
  color: white;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-box {
  width: 850px;
  max-width: 90%;
  max-height: 85vh;
  overflow: auto;
  background: white;
  padding: 35px;
  border-radius: 15px;
  position: relative;
}

.close-btn {
  position: absolute;
  right: 20px;
  top: 15px;
  font-size: 30px;
  border: none;
  background: none;
  cursor: pointer;
}

.modal-time {
  color: #888;
  margin-bottom: 20px;
}

.cover {
  width: 100%;
  border-radius: 10px;
  margin-bottom: 20px;
}

.content {
  white-space: pre-wrap;
  line-height: 2;
  font-size: 16px;
  color: #333;
}

.edit-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row label {
  font-weight: 600;
  color: #2c3e50;
}

.form-row input,
.form-row textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  font-size: 1rem;
}

.form-row textarea {
  min-height: 220px;
  resize: vertical;
}

.save-btn {
  background: #42b983;
  color: white;
}

.cancel-btn {
  background: #e5e7eb;
  color: #374151;
}

.modal-enter-active,
.modal-leave-active { transition: .25s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box,
.modal-leave-to .modal-box { transform: scale(.9); }
</style>