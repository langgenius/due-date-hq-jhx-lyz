import { describe, expect, it } from 'vitest'
import * as core from './index'

describe('@duedatehq/core', () => {
  it('keeps the package root free of barrel exports', () => {
    expect(Object.keys(core)).toEqual([])
  })
})
