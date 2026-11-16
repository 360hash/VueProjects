<template>
  <div class="storage-container">
    <header class="storage-header">
      <h1>📦 存储空间</h1>
      <div class="header-actions">
        <button class="refresh-btn" @click="loadRecords">🔄 刷新</button>
        <button class="clear-btn" @click="clearAll" :disabled="!records.length">
          🗑 清空全部
        </button>
      </div>
    </header>

    <p v-if="loading" class="tip">加载中…</p>
    <p v-else-if="!records.length" class="tip">还没有任何记录</p>

    <div class="record-list">
      <div v-for="record in records" :key="record.id" class="record-card">
        <div class="record-meta">
          <span class="rid">#{{ record.id }}</span>
          <span class="time">{{ formatTime(record.created_at) }}</span>
          <span class="ip">IP: {{ record.ip }}</span>
          <button class="delete-btn" @click="remove(record.id)">🗑 删除</button>
        </div>
        <pre class="content">{{ record.content }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStoredTexts, deleteStoredText, clearStoredTexts } from '@/api/store'

const records = ref([])
const loading = ref(false)

async function loadRecords() {
  loading.value = true
  try {
    const data = await getStoredTexts()
    records.value = data.items || []
  } catch (error) {
    console.error('获取记录失败:', error)
    alert('获取记录失败：' + (error.message || error))
  } finally {
    loading.value = false
  }
}

// 后端存的是 ISO 时间，这里转成北京时间
function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return (
    new Date(d.getTime() + 8 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19) + ' (北京时间)'
  )
}

async function remove(id) {
  if (!confirm(`确定删除 #${id} 吗？`)) return
  try {
    await deleteStoredText(id)
    await loadRecords()
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败：' + (error.message || error))
  }
}

async function clearAll() {
  if (!confirm('确定清空全部记录吗？此操作不可恢复。')) return
  try {
    await clearStoredTexts()
    await loadRecords()
  } catch (error) {
    console.error('清空失败:', error)
    alert('清空失败：' + (error.message || error))
  }
}

onMounted(loadRecords)
</script>

<style scoped>
.storage-container {
  max-width: 1000px;
  margin: 40px auto;
  padding: 20px;
}

.storage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
}

.storage-header h1 {
  color: #2c3e50;
  margin: 0;
}

.header-actions button {
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  margin-left: 10px;
}

.refresh-btn {
  background: #3498db;
  color: white;
}

.clear-btn {
  background: #e74c3c;
  color: white;
}

.clear-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.tip {
  color: #999;
  text-align: center;
  padding: 40px 0;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-card {
  background: white;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.record-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 14px;
  color: #888;
  margin-bottom: 12px;
}

.record-meta .rid {
  font-weight: 700;
  color: #2c3e50;
}

.record-meta .ip {
  color: #3498db;
}

.delete-btn {
  margin-left: auto;
  background: #e74c3c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.content {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  background: #f7f9f8;
  border-radius: 8px;
  padding: 14px;
  margin: 0;
  line-height: 1.7;
  font-size: 14px;
  color: #333;
  max-height: 320px;
  overflow: auto;
}
</style>
