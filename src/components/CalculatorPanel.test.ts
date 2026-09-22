import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CalculatorPanel from './CalculatorPanel.vue'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CalculatorPanel', () => {
  it('uses the API response as the displayed result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 1,
            request_id: '00000000-0000-4000-8000-000000000001',
            category: 'calculation',
            expression: '1+2*3',
            result: '7',
            result_meta: null,
            steps: [
              { index: 1, expression: '2 * 3', result: '6', position: { start: 2, end: 5 } },
              { index: 2, expression: '1 + 6', result: '7', position: { start: 0, end: 5 } },
            ],
            source_params: { expression: '1+2*3' },
            approximate: false,
            note: '',
            favorite: false,
            created_at: '2026-09-22T00:00:00.000Z',
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    const wrapper = mount(CalculatorPanel, { props: { reuseExpression: '', reuseKey: 0 } })
    await wrapper.get('button.primary-button').trigger('click')
    await flushPromises()
    expect(wrapper.get('output').text()).toBe('= 7')
    expect(wrapper.emitted('saved')).toHaveLength(1)
  })
})

