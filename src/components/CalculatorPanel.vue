<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { api, ApiError } from '../api'
import type { HistoryRecord } from '../types'
import StepList from './StepList.vue'

const props = defineProps<{
  reuseExpression: string
  reuseKey: number
}>()

const emit = defineEmits<{
  saved: [record: HistoryRecord]
}>()

const expression = ref('1+2*3')
const input = ref<HTMLInputElement | null>(null)
const result = ref<HistoryRecord | null>(null)
const error = ref<ApiError | null>(null)
const loading = ref(false)
const stepsOpen = ref(true)
const operationVersion = ref(0)
const retryPayload = ref<{ expression: string; requestId: string } | null>(null)

const errorSlices = computed(() => {
  const position = error.value?.position
  const source = retryPayload.value?.expression ?? expression.value
  if (!position) return null
  const end = Math.max(position.end, position.start + 1)
  return {
    before: source.slice(0, position.start),
    marked: source.slice(position.start, end) || '▯',
    after: source.slice(end),
  }
})

watch(
  () => props.reuseKey,
  async () => {
    if (!props.reuseExpression) return
    expression.value = props.reuseExpression
    result.value = null
    error.value = null
    await nextTick()
    input.value?.focus()
    input.value?.setSelectionRange(expression.value.length, expression.value.length)
  },
)

function makeRequestId() {
  return crypto.randomUUID()
}

async function execute(payload: { expression: string; requestId: string }) {
  if (loading.value) return
  const version = ++operationVersion.value
  loading.value = true
  error.value = null
  retryPayload.value = payload
  try {
    const record = await api.calculate(payload.expression, payload.requestId)
    emit('saved', record)
    if (version === operationVersion.value && expression.value === payload.expression) {
      result.value = record
      retryPayload.value = null
    }
  } catch (caught) {
    if (version === operationVersion.value) {
      error.value = caught instanceof ApiError ? caught : new ApiError('计算失败，请重试')
    }
  } finally {
    if (version === operationVersion.value) loading.value = false
  }
}

function submit() {
  const value = expression.value.trim()
  if (!value) {
    error.value = new ApiError('请输入表达式', 'EMPTY_EXPRESSION')
    return
  }
  result.value = null
  void execute({ expression: value, requestId: makeRequestId() })
}

function retry() {
  if (retryPayload.value) void execute(retryPayload.value)
}

function clear() {
  operationVersion.value += 1
  expression.value = ''
  result.value = null
  error.value = null
  retryPayload.value = null
  loading.value = false
  nextTick(() => input.value?.focus())
}

async function insertSymbol(symbol: string) {
  const element = input.value
  const start = element?.selectionStart ?? expression.value.length
  const end = element?.selectionEnd ?? start
  expression.value = `${expression.value.slice(0, start)}${symbol}${expression.value.slice(end)}`
  await nextTick()
  element?.focus()
  const cursor = start + symbol.length
  element?.setSelectionRange(cursor, cursor)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    submit()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    clear()
  }
}
</script>

<template>
  <section class="panel calculator-panel" aria-labelledby="calculator-title">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">表达式计算</p>
        <h2 id="calculator-title">把过程也算清楚</h2>
      </div>
      <span class="server-badge"><i /> 后端计算</span>
    </div>

    <label class="field-label" for="expression">表达式</label>
    <div class="expression-row">
      <input
        id="expression"
        ref="input"
        v-model="expression"
        class="expression-input"
        autocomplete="off"
        inputmode="text"
        maxlength="512"
        spellcheck="false"
        aria-describedby="expression-help"
        @keydown="handleKeydown"
      />
      <button class="primary-button" type="button" :disabled="loading" @click="submit">
        <span v-if="loading" class="spinner" aria-hidden="true" />
        {{ loading ? '计算中' : '计算' }}
      </button>
    </div>
    <p id="expression-help" class="field-help">支持 + − × ÷、括号、sqrt、abs 和整数幂 ^；Enter 计算，Esc 清空。</p>

    <div class="keypad" aria-label="快捷输入">
      <button v-for="symbol in ['(', ')', 'sqrt(', 'abs(', '^', '×', '÷', '−']" :key="symbol" type="button" @click="insertSymbol(symbol)">
        {{ symbol }}
      </button>
      <button type="button" class="quiet-button" @click="clear">清空</button>
    </div>

    <div v-if="error" class="message error-message" role="alert">
      <div>
        <strong>{{ error.message }}</strong>
        <code v-if="errorSlices" class="error-source"><span>{{ errorSlices.before }}</span><mark>{{ errorSlices.marked }}</mark><span>{{ errorSlices.after }}</span></code>
      </div>
      <button v-if="retryPayload && ['TIMEOUT', 'NETWORK_ERROR'].includes(error.code)" type="button" @click="retry">重试</button>
    </div>

    <div v-if="result" class="result-card" aria-live="polite">
      <div>
        <span class="result-label">{{ result.approximate ? '近似结果' : '计算结果' }}</span>
        <output>{{ result.approximate ? '≈ ' : '= ' }}{{ result.result }}</output>
      </div>
      <button class="icon-text-button" type="button" @click="stepsOpen = !stepsOpen">
        {{ stepsOpen ? '收起步骤' : `查看 ${result.steps.length} 步` }}
      </button>
    </div>
    <StepList v-if="result && stepsOpen" :steps="result.steps" />
  </section>
</template>
