import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StepList from './StepList.vue'

describe('StepList', () => {
  it('renders the backend-provided evaluation order', () => {
    const wrapper = mount(StepList, {
      props: {
        steps: [
          { index: 1, expression: '2 * 3', result: '6', position: { start: 2, end: 5 } },
          { index: 2, expression: '1 + 6', result: '7', position: { start: 0, end: 5 } },
        ],
      },
    })
    expect(wrapper.text()).toContain('2 * 3')
    expect(wrapper.text()).toContain('1 + 6')
    expect(wrapper.findAll('li')).toHaveLength(2)
  })
})

