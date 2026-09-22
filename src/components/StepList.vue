<script setup lang="ts">
import type { CalculationStep } from '../types'

defineProps<{
  steps: CalculationStep[]
}>()
</script>

<template>
  <ol v-if="steps.length" class="step-list" aria-label="实际运算步骤">
    <li v-for="step in steps" :key="step.index" class="step-item">
      <span class="step-index">{{ step.index }}</span>
      <span class="step-expression">{{ step.expression }}</span>
      <span class="step-equals">=</span>
      <strong>{{ step.result }}</strong>
    </li>
  </ol>
  <p v-else class="muted">这个表达式不需要额外运算步骤。</p>
</template>

