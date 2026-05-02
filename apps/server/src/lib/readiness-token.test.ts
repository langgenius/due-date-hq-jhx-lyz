import { describe, expect, it } from 'vitest'
import { sha256Hex, signReadinessPortalToken, verifyReadinessPortalToken } from './readiness-token'

const secret = '0123456789abcdefghijklmnopqrstuvwxyz'

describe('readiness portal tokens', () => {
  it('signs and verifies request-scoped HMAC tokens', async () => {
    const token = await signReadinessPortalToken({
      secret,
      requestId: 'req_123',
      expiresAtMs: 1_800,
    })

    await expect(
      verifyReadinessPortalToken({
        secret,
        token,
        nowMs: 1_700,
      }),
    ).resolves.toEqual({
      requestId: 'req_123',
      exp: 1_800,
    })
  })

  it('rejects expired, tampered, and wrong-secret tokens', async () => {
    const token = await signReadinessPortalToken({
      secret,
      requestId: 'req_123',
      expiresAtMs: 1_800,
    })

    await expect(
      verifyReadinessPortalToken({
        secret,
        token,
        nowMs: 1_800,
      }),
    ).resolves.toBeNull()

    await expect(
      verifyReadinessPortalToken({
        secret,
        token: `${token}x`,
        nowMs: 1_700,
      }),
    ).resolves.toBeNull()

    await expect(
      verifyReadinessPortalToken({
        secret: `${secret}-other`,
        token,
        nowMs: 1_700,
      }),
    ).resolves.toBeNull()
  })

  it('hashes tokens deterministically for stored lookup', async () => {
    await expect(sha256Hex('readiness-token')).resolves.toBe(
      '5d1f506c6d1aca5a998e0cbb8bc9702c0421742ec97904a4cc4e84fb899ef91c',
    )
  })
})
