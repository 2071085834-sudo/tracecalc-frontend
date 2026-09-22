export type Category = 'calculation' | 'unit' | 'base'

export interface Position {
  start: number
  end: number
}

export interface CalculationStep {
  index: number
  expression: string
  result: string
  position: Position | null
}

export interface HistoryRecord {
  id: number
  request_id: string
  category: Category
  expression: string
  result: string
  result_meta: string | null
  steps: CalculationStep[]
  source_params: Record<string, unknown>
  approximate: boolean
  note: string
  favorite: boolean
  created_at: string
}

export interface Pagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface HistoryResponse {
  items: HistoryRecord[]
  pagination: Pagination
}

export interface Stats {
  total: number
  favorites: number
  last_seven_days: number
}

