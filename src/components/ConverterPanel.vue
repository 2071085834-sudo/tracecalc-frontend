<script setup lang="ts">
import { ref } from 'vue'
import { api, ApiError } from '../api'
import type { HistoryRecord } from '../types'

const emit = defineEmits<{
  saved: [record: HistoryRecord]
}>()

const mode = ref<'unit' | 'base'>('unit')
const value = ref('1')
const fromUnit = ref('m')
const toUnit = ref('cm')
const fromBase = ref(16)
const toBase = ref(10)
const result = ref<HistoryRecord | null>(null)
const error = ref('')
const loading = ref(false)
const retryAction = ref<(() => Promise<void>) | null>(null)

const units = [
  { value: 'mm', label: '毫米 mm' },
  { value: 'cm', label: '厘米 cm' },
  { value: 'm', label: '米 m' },
  { value: 'km', label: '千米 km' },
  { value: 'mg', label: '毫克 mg' },
  { value: 'g', label: '克 g' },
  { value: 'kg', label: '千克 kg' },
  { value: 't', label: '吨 t' },
  { value: 'C', label: '摄氏度 °C' },
  { value: 'F', label: '华氏度 °F' },
  { value: 'K', label: '开尔文 K' },
]

const bases = [
  { value: 2, label: '二进制' },
  { value: 8, label: '八进制' },
  { value: 10, label: '十进制' },
  { value: 16, label: '十六进制' },
]

async function runUnit(requestId: string) {
  const record = await api.convertUnit(value.value, fromUnit.value, toUnit.value, requestId)
  result.value = record
  emit('saved', record)
}

async function runBase(requestId: string) {
  const record = await api.convertBase(value.value, fromBase.value, toBase.value, requestId)
  result.value = record
  emit('saved', record)
}

async function submit(existingAction?: () => Promise<void>) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  if (!existingAction) result.value = null
  const requestId = crypto.randomUUID()
  const action = existingAction ?? (mode.value === 'unit' ? () => runUnit(requestId) : () => runBase(requestId))
  retryAction.value = action
  try {
    await action()
    retryAction.value = null
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.message : '换算失败，请重试'
  } finally {
    loading.value = false
  }
}

function swap() {
  if (mode.value === 'unit') {
    ;[fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value]
  } else {
    ;[fromBase.value, toBase.value] = [toBase.value, fromBase.value]
  }
}
</script>

<template>
  <section class="panel converter-panel" aria-labelledby="converter-title">
    <div class="panel-heading compact-heading">
      <div>
        <p class="eyebrow">快捷工具</p>
        <h2 id="converter-title">换算器</h2>
      </div>
      <div class="segmented" aria-label="换算类型">
        <button type="button" :class="{ active: mode === 'unit' }" @click="mode = 'unit'; result = null; error = ''">单位</button>
        <button type="button" :class="{ active: mode === 'base' }" @click="mode = 'base'; result = null; error = ''">进制</button>
      </div>
    </div>

    <label class="field-label" for="convert-value">待换算数值</label>
    <input id="convert-value" v-model="value" class="standard-input" autocomplete="off" spellcheck="false" />

    <div class="conversion-route">
      <label>
        <span>从</span>
        <select v-if="mode === 'unit'" v-model="fromUnit">
          <option v-for="unit in units" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
        </select>
        <select v-else v-model="fromBase">
          <option v-for="base in bases" :key="base.value" :value="base.value">{{ base.label }}</option>
        </select>
      </label>
      <button class="swap-button" type="button" title="交换方向" aria-label="交换换算方向" @click="swap">⇄</button>
      <label>
        <span>到</span>
        <select v-if="mode === 'unit'" v-model="toUnit">
          <option v-for="unit in units" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
        </select>
        <select v-else v-model="toBase">
          <option v-for="base in bases" :key="base.value" :value="base.value">{{ base.label }}</option>
        </select>
      </label>
    </div>

    <button class="secondary-button full-button" type="button" :disabled="loading" @click="submit()">
      {{ loading ? '换算中…' : '开始换算' }}
    </button>
    <div v-if="error" class="message error-message" role="alert">
      <strong>{{ error }}</strong>
      <button v-if="retryAction" type="button" @click="submit(retryAction)">重试</button>
    </div>
    <div v-if="result" class="converter-result" aria-live="polite">
      <span>{{ result.expression }}</span>
      <strong>{{ result.result }} <small>{{ mode === 'unit' ? result.result_meta : `${result.result_meta} 进制` }}</small></strong>
    </div>
  </section>
</template>
