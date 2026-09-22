<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, ApiError } from './api'
import CalculatorPanel from './components/CalculatorPanel.vue'
import ConverterPanel from './components/ConverterPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'

const ready = ref(false)
const startupError = ref('')
const refreshKey = ref(0)
const reuseExpression = ref('')
const reuseKey = ref(0)
const theme = ref<'light' | 'dark'>('light')

function applyTheme(value: 'light' | 'dark') {
  theme.value = value
  document.documentElement.dataset.theme = value
  localStorage.setItem('tracecalc-theme', value)
}

function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}

async function initialize() {
  startupError.value = ''
  try {
    await api.createSession()
    ready.value = true
  } catch (caught) {
    startupError.value = caught instanceof ApiError ? caught.message : '工作区初始化失败'
  }
}

function saved() {
  refreshKey.value += 1
}

function reuse(value: string) {
  reuseExpression.value = value
  reuseKey.value += 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  const savedTheme = localStorage.getItem('tracecalc-theme')
  const preferred = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  applyTheme(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : preferred)
  void initialize()
})
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="算迹首页">
        <span class="brand-mark" aria-hidden="true">Σ</span>
        <span><strong>算迹</strong><small>TraceCalc</small></span>
      </a>
      <div class="header-note">结果之外，也留下思路。</div>
      <button class="theme-button" type="button" :aria-label="theme === 'light' ? '切换到深色主题' : '切换到浅色主题'" @click="toggleTheme">
        <span aria-hidden="true">{{ theme === 'light' ? '☾' : '☀' }}</span>
        {{ theme === 'light' ? '深色' : '浅色' }}
      </button>
    </header>

    <main id="top">
      <section class="hero">
        <div>
          <p class="hero-kicker">CALCULATE · EXPLAIN · RECALL</p>
          <h1>每一步，<em>都有迹可循。</em></h1>
        </div>
        <p>安全解析复合表达式，展示真实运算顺序；计算、换算和笔记由后端统一保存。</p>
      </section>

      <div v-if="startupError" class="startup-state panel" role="alert">
        <span class="status-orb offline" />
        <div><strong>暂时无法连接后端</strong><p>{{ startupError }}</p></div>
        <button class="primary-button" type="button" @click="initialize">重新连接</button>
      </div>
      <div v-else-if="!ready" class="startup-state panel">
        <span class="spinner dark-spinner" aria-hidden="true" />
        <div><strong>正在准备匿名工作区</strong><p>历史记录会保存在后端数据库中。</p></div>
      </div>

      <template v-else>
        <div class="workspace-grid">
          <CalculatorPanel :reuse-expression="reuseExpression" :reuse-key="reuseKey" @saved="saved" />
          <ConverterPanel @saved="saved" />
        </div>
        <HistoryPanel :refresh-key="refreshKey" @reuse="reuse" />
      </template>
    </main>

    <footer>
      <span>算迹 TraceCalc</span>
      <span>匿名工作区依赖当前浏览器 Cookie；清除 Cookie 后会创建新工作区。</span>
    </footer>
  </div>
</template>

