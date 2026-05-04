import { describe, expect, it } from 'vitest'

import { isThisWeekFilterActive, nextThisWeekFilterPatch } from './workboard'

describe('workboard quick filters', () => {
  it('applies the this week days filter when inactive', () => {
    expect(nextThisWeekFilterPatch(null, null)).toEqual({
      dueWithin: null,
      due: null,
      daysMin: null,
      daysMax: 7,
      obligation: null,
      row: null,
    })
  })

  it('clears the this week days filter when clicked while active', () => {
    expect(nextThisWeekFilterPatch(null, 7)).toEqual({
      dueWithin: null,
      due: null,
      daysMin: null,
      daysMax: null,
      obligation: null,
      row: null,
    })
  })

  it('only treats an empty lower bound and seven-day upper bound as this week', () => {
    expect(isThisWeekFilterActive(null, 7)).toBe(true)
    expect(isThisWeekFilterActive(0, 7)).toBe(false)
    expect(isThisWeekFilterActive(null, 14)).toBe(false)
  })
})
