import { describe, expect, it } from 'vitest'
import { calendarFeedUrl, signCalendarToken, verifyCalendarToken } from './calendar-token'

const SECRET = 'x'.repeat(32)

describe('calendar token', () => {
  it('signs and verifies subscription id and nonce', async () => {
    const token = await signCalendarToken({
      secret: SECRET,
      subscriptionId: 'sub_123',
      nonce: 'nonce_123',
    })

    await expect(verifyCalendarToken({ secret: SECRET, token })).resolves.toEqual({
      subscriptionId: 'sub_123',
      nonce: 'nonce_123',
    })
  })

  it('rejects tampered and malformed tokens', async () => {
    const token = await signCalendarToken({
      secret: SECRET,
      subscriptionId: 'sub_123',
      nonce: 'nonce_123',
    })

    await expect(verifyCalendarToken({ secret: SECRET, token: `${token}x` })).resolves.toBeNull()
    await expect(verifyCalendarToken({ secret: SECRET, token: 'not-a-token' })).resolves.toBeNull()
  })

  it('builds the public ICS URL without double slashes', async () => {
    const token = await signCalendarToken({
      secret: SECRET,
      subscriptionId: 'sub_123',
      nonce: 'nonce_123',
    })

    expect(calendarFeedUrl('https://app.duedatehq.com/', token)).toBe(
      `https://app.duedatehq.com/api/ics/${encodeURIComponent(token)}.ics`,
    )
  })
})
