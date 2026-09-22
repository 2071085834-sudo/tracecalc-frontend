import type { HistoryRecord, HistoryResponse, Stats } from './types'

interface ApiSuccess<T> {
  success: true
  data: T
}

interface ApiFailure {
  success: false
  error: {
    code: string
    message: string
    position?: { start: number; end: number }
  }
}

export class ApiError extends Error {
  code: string
  position?: { start: number; end: number }
  status: number

  constructor(message: string, code = 'NETWORK_ERROR', status = 0, position?: { start: number; end: number }) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.position = position
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 10_000): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
    let body: ApiSuccess<T> | ApiFailure
    try {
      body = (await response.json()) as ApiSuccess<T> | ApiFailure
    } catch {
      throw new ApiError('服务返回了无法识别的响应，请稍后重试', 'INVALID_RESPONSE', response.status)
    }
    if (!response.ok || !body.success) {
      const failure = body as ApiFailure
      throw new ApiError(
        failure.error?.message ?? `请求失败（${response.status}）`,
        failure.error?.code ?? 'REQUEST_FAILED',
        response.status,
        failure.error?.position,
      )
    }
    return body.data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('请求超时，点击重试将安全复用同一请求编号', 'TIMEOUT')
    }
    throw new ApiError('无法连接计算服务，请检查后端是否已启动', 'NETWORK_ERROR')
  } finally {
    window.clearTimeout(timer)
  }
}

export const api = {
  createSession: () => request<{ ready: boolean; created: boolean }>('/api/session', { method: 'POST' }),

  calculate: (expression: string, requestId: string) =>
    request<HistoryRecord>('/api/calculate', {
      method: 'POST',
      body: JSON.stringify({ expression, request_id: requestId }),
    }),

  convertUnit: (value: string, fromUnit: string, toUnit: string, requestId: string) =>
    request<HistoryRecord>('/api/convert/unit', {
      method: 'POST',
      body: JSON.stringify({ value, from_unit: fromUnit, to_unit: toUnit, request_id: requestId }),
    }),

  convertBase: (value: string, fromBase: number, toBase: number, requestId: string) =>
    request<HistoryRecord>('/api/convert/base', {
      method: 'POST',
      body: JSON.stringify({ value, from_base: fromBase, to_base: toBase, request_id: requestId }),
    }),

  getHistory: (params: URLSearchParams) => request<HistoryResponse>(`/api/history?${params.toString()}`),

  updateHistory: (id: number, patch: { favorite?: boolean; note?: string }) =>
    request<HistoryRecord>(`/api/history/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteHistory: (id: number) =>
    request<{ deleted: boolean; id: number }>(`/api/history/${id}`, { method: 'DELETE' }),

  getStats: () => request<Stats>('/api/stats'),
}

