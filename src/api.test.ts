import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from './api'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('api client', () => {
  it('sends calculations to the backend with credentials', async () => {
    const record = { id: 1, result: '7' }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: record }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(api.calculate('1+2*3', 'request-0001')).resolves.toMatchObject(record)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/calculate',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ expression: '1+2*3', request_id: 'request-0001' }),
      }),
    )
  })

  it('preserves a structured backend error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'DIVISION_BY_ZERO', message: '除数不能为零', position: { start: 2, end: 3 } },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    try {
      await api.calculate('1/0', 'request-0002')
      throw new Error('expected request to fail')
    } catch (caught) {
      expect(caught).toBeInstanceOf(ApiError)
      expect(caught).toMatchObject({ code: 'DIVISION_BY_ZERO', position: { start: 2, end: 3 } })
    }
  })
})

