<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { api, ApiError } from '../api'
import type { Category, HistoryRecord, Pagination, Stats } from '../types'

const props = defineProps<{
  refreshKey: number
}>()

const emit = defineEmits<{
  reuse: [expression: string]
}>()

const items = ref<HistoryRecord[]>([])
const pagination = ref<Pagination>({ page: 1, page_size: 6, total: 0, total_pages: 1 })
const keyword = ref('')
const category = ref<Category | ''>('')
const favoritesOnly = ref(false)
const loading = ref(false)
const error = ref('')
const stats = ref<Stats>({ total: 0, favorites: 0, last_seven_days: 0 })
let loadVersion = 0

const categoryLabels: Record<Category, string> = {
  calculation: '表达式',
  unit: '单位',
  base: '进制',
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

async function load() {
  const version = ++loadVersion
  loading.value = true
  error.value = ''
  const params = new URLSearchParams({
    page: String(pagination.value.page),
    page_size: String(pagination.value.page_size),
  })
  if (keyword.value.trim()) params.set('keyword', keyword.value.trim())
  if (category.value) params.set('category', category.value)
  if (favoritesOnly.value) params.set('favorite', 'true')
  try {
    const [history, latestStats] = await Promise.all([api.getHistory(params), api.getStats()])
    if (version !== loadVersion) return
    if (history.pagination.total_pages < pagination.value.page && pagination.value.page > 1) {
      pagination.value.page = history.pagination.total_pages
      await load()
      return
    }
    items.value = history.items
    pagination.value = history.pagination
    stats.value = latestStats
  } catch (caught) {
    if (version === loadVersion) {
      error.value = caught instanceof ApiError ? caught.message : '历史记录加载失败'
    }
  } finally {
    if (version === loadVersion) loading.value = false
  }
}

function applyFilters() {
  pagination.value.page = 1
  void load()
}

async function toggleFavorite(record: HistoryRecord) {
  const oldValue = record.favorite
  record.favorite = !oldValue
  try {
    await api.updateHistory(record.id, { favorite: record.favorite })
    await load()
  } catch (caught) {
    record.favorite = oldValue
    error.value = caught instanceof ApiError ? caught.message : '收藏状态保存失败'
  }
}

async function saveNote(record: HistoryRecord) {
  try {
    const updated = await api.updateHistory(record.id, { note: record.note })
    record.note = updated.note
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : '备注保存失败'
  }
}

function finishNote(event: KeyboardEvent) {
  ;(event.currentTarget as HTMLInputElement).blur()
}

async function remove(record: HistoryRecord) {
  if (!window.confirm(`确定删除“${record.expression}”吗？此操作会从数据库中删除记录。`)) return
  try {
    await api.deleteHistory(record.id)
    if (items.value.length === 1 && pagination.value.page > 1) pagination.value.page -= 1
    await load()
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : '删除失败'
  }
}

function changePage(page: number) {
  pagination.value.page = page
  void load()
}

watch(
  () => props.refreshKey,
  () => void load(),
)

onMounted(() => void load())
</script>

<template>
  <section class="panel history-panel" aria-labelledby="history-title">
    <div class="history-header">
      <div>
        <p class="eyebrow">计算笔记</p>
        <h2 id="history-title">历史记录</h2>
      </div>
      <dl class="stats" aria-label="历史统计">
        <div><dt>全部</dt><dd>{{ stats.total }}</dd></div>
        <div><dt>收藏</dt><dd>{{ stats.favorites }}</dd></div>
        <div><dt>近 7 天</dt><dd>{{ stats.last_seven_days }}</dd></div>
      </dl>
    </div>

    <form class="history-filters" @submit.prevent="applyFilters">
      <label class="search-field">
        <span class="sr-only">搜索表达式和备注</span>
        <input v-model="keyword" type="search" maxlength="100" placeholder="搜索表达式或备注" />
      </label>
      <label>
        <span class="sr-only">记录类型</span>
        <select v-model="category" @change="applyFilters">
          <option value="">全部类型</option>
          <option value="calculation">表达式</option>
          <option value="unit">单位换算</option>
          <option value="base">进制转换</option>
        </select>
      </label>
      <label class="favorite-filter">
        <input v-model="favoritesOnly" type="checkbox" @change="applyFilters" />
        只看收藏
      </label>
      <button class="quiet-button" type="submit">查找</button>
    </form>

    <div v-if="error" class="message error-message" role="alert">
      <strong>{{ error }}</strong>
      <button type="button" @click="load">重试</button>
    </div>

    <div v-if="loading && !items.length" class="history-empty">正在从数据库读取…</div>
    <div v-else-if="!items.length" class="history-empty">
      <span>∅</span>
      <strong>还没有符合条件的记录</strong>
      <p>完成一次计算或换算后，它会安全地保存在后端。</p>
    </div>
    <ul v-else class="history-list" :aria-busy="loading">
      <li v-for="record in items" :key="record.id" class="history-item">
        <div class="record-main">
          <div class="record-meta">
            <span class="category-chip">{{ categoryLabels[record.category] }}</span>
            <time :datetime="record.created_at">{{ formatTime(record.created_at) }}</time>
          </div>
          <p class="record-expression">{{ record.expression }}</p>
          <p class="record-result">
            <span>{{ record.approximate ? '≈' : '=' }}</span>
            {{ record.result }}
            <small v-if="record.result_meta">{{ record.category === 'base' ? `${record.result_meta} 进制` : record.result_meta }}</small>
          </p>
          <label class="note-field">
            <span class="sr-only">记录备注</span>
            <input
              v-model="record.note"
              maxlength="200"
              placeholder="添加一条简短备注…"
              @blur="saveNote(record)"
              @keydown.enter.prevent="finishNote"
            />
          </label>
        </div>
        <div class="record-actions">
          <button
            type="button"
            class="star-button"
            :class="{ selected: record.favorite }"
            :aria-label="record.favorite ? '取消收藏' : '收藏记录'"
            :title="record.favorite ? '取消收藏' : '收藏'"
            @click="toggleFavorite(record)"
          >
            {{ record.favorite ? '★' : '☆' }}
          </button>
          <button v-if="record.category === 'calculation'" type="button" class="icon-text-button" @click="emit('reuse', record.expression)">重用</button>
          <button type="button" class="danger-text-button" @click="remove(record)">删除</button>
        </div>
      </li>
    </ul>

    <nav v-if="pagination.total_pages > 1" class="pagination" aria-label="历史记录分页">
      <button type="button" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">上一页</button>
      <span>{{ pagination.page }} / {{ pagination.total_pages }}</span>
      <button type="button" :disabled="pagination.page >= pagination.total_pages" @click="changePage(pagination.page + 1)">下一页</button>
    </nav>
  </section>
</template>
