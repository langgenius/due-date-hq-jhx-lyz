import { describe, expect, it } from 'vitest'
import { derivePracticeName, slugifyPracticeName } from './practice-name'

const FALLBACK = 'My Practice'

describe('derivePracticeName', () => {
  const cases: Array<{
    label: string
    input: { name?: string | null; email?: string | null }
    expected: string
  }> = [
    {
      label: 'custom domain wins over name',
      input: { name: 'Alex Chen', email: 'alex@bright-cpa.com' },
      expected: 'Bright CPA',
    },
    {
      label: 'custom domain Title-Cases multi-token roots and uppercases acronyms',
      input: { email: 'partner@riverbend-tax-llp.com' },
      expected: 'Riverbend Tax LLP',
    },
    {
      label: 'compound public TLDs are stripped',
      input: { email: 'contact@chen-tax.co.uk' },
      expected: 'Chen Tax',
    },
    {
      label: 'gmail user falls back to display name',
      input: { name: 'Alex Chen', email: 'alex.chen@gmail.com' },
      expected: 'Alex Chen',
    },
    {
      label: 'public domain is case-insensitive',
      input: { name: 'Sarah Lee', email: 'Sarah@Outlook.COM' },
      expected: 'Sarah Lee',
    },
    {
      label: 'gmail user without display name uses fallback',
      input: { email: 'noname@gmail.com' },
      expected: FALLBACK,
    },
    {
      label: 'completely empty input uses fallback',
      input: {},
      expected: FALLBACK,
    },
    {
      label: 'whitespace-only display name with public domain falls back',
      input: { name: '   ', email: '  user@yahoo.com  ' },
      expected: FALLBACK,
    },
    {
      label: 'too-short custom domain root falls back to name',
      input: { name: 'Pat Doe', email: 'pat@a.io' },
      expected: 'Pat Doe',
    },
    {
      label: 'underscore-separated domain root tokenizes correctly',
      input: { email: 'admin@bright_cpa.com' },
      expected: 'Bright CPA',
    },
    {
      label: 'null name + null email returns fallback',
      input: { name: null, email: null },
      expected: FALLBACK,
    },
  ]

  for (const tc of cases) {
    it(tc.label, () => {
      expect(derivePracticeName(tc.input, FALLBACK)).toBe(tc.expected)
    })
  }

  it('honours a localized fallback', () => {
    expect(derivePracticeName({ email: 'noname@gmail.com' }, '我的事务所')).toBe('我的事务所')
  })

  it('never returns an empty string', () => {
    expect(derivePracticeName({}, FALLBACK).length).toBeGreaterThan(0)
    expect(derivePracticeName({ name: '', email: '' }, FALLBACK).length).toBeGreaterThan(0)
  })
})

describe('slugifyPracticeName', () => {
  it('produces the same body but a different suffix when called twice', () => {
    const name = 'Bright CPA Practice'
    const a = slugifyPracticeName(name)
    const b = slugifyPracticeName(name)
    expect(a).not.toBe(b)
    const [bodyA, suffixA] = a.split(/-(?=[a-z0-9]{6}$)/)
    const [bodyB, suffixB] = b.split(/-(?=[a-z0-9]{6}$)/)
    expect(bodyA).toBe(bodyB)
    expect(bodyA).toBe('bright-cpa-practice')
    expect(suffixA).not.toBe(suffixB)
    expect(suffixA).toMatch(/^[a-z2-9]{6}$/)
  })

  it('falls back to a "practice" body when the name has no slug-safe chars', () => {
    const slug = slugifyPracticeName('!!! ???')
    expect(slug.startsWith('practice-')).toBe(true)
  })

  it('strips diacritics so the slug is ASCII-only', () => {
    const slug = slugifyPracticeName('Café Ölander')
    expect(slug).toMatch(/^cafe-olander-[a-z2-9]{6}$/)
  })

  it('truncates very long names', () => {
    const long = 'word '.repeat(40).trim()
    const slug = slugifyPracticeName(long)
    // body capped to 48 chars + "-" + 6-char suffix = 55 max
    expect(slug.length).toBeLessThanOrEqual(48 + 1 + 6)
    expect(slug).toMatch(/-[a-z2-9]{6}$/)
  })
})
