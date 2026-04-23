import { describe, expect, it } from 'vitest'
import { cn, formatCents } from './utils'

describe('utils', () => {
  it('merges Tailwind classes with later conflicting utilities winning', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4')
  })

  it('formats cents as US dollars', () => {
    expect(formatCents(14230000)).toBe('$142,300.00')
  })
})
