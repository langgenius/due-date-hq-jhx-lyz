import { describe, expect, it } from 'vitest'
import { splitSetCookieHeader } from 'better-auth/cookies'
import { appendResponseHeaders } from './rpc'

describe('appendResponseHeaders', () => {
  it('preserves multiple Set-Cookie values from auth API responses', () => {
    const target = new Headers({ 'content-type': 'application/json' })
    const source = new Headers()
    source.append(
      'set-cookie',
      'duedatehq.session_token=new; Path=/; HttpOnly, duedatehq.session_data=cache; Path=/; HttpOnly',
    )
    source.set('x-auth-state', 'rotated')

    appendResponseHeaders(target, source)

    expect(target.get('content-type')).toBe('application/json')
    expect(target.get('x-auth-state')).toBe('rotated')
    expect(splitSetCookieHeader(target.get('set-cookie') ?? '')).toEqual([
      'duedatehq.session_token=new; Path=/; HttpOnly',
      'duedatehq.session_data=cache; Path=/; HttpOnly',
    ])
  })
})
