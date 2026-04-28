import { describe, expect, it } from 'vitest'

import { ErrorCodes } from '@duedatehq/contracts'

import { isPulseConflict, isPulseNotFound, pulseErrorDescriptor } from './error-mapping'

function rpcError(code: string): Error {
  const err = new Error(code)
  ;(err as Error & { code?: string }).code = code
  return err
}

describe('pulseErrorDescriptor', () => {
  it('returns specific descriptors for each Pulse code', () => {
    const ids = new Set(
      [
        ErrorCodes.PULSE_NOT_FOUND,
        ErrorCodes.PULSE_APPLY_CONFLICT,
        ErrorCodes.PULSE_REVERT_EXPIRED,
        ErrorCodes.PULSE_NO_ELIGIBLE_OBLIGATIONS,
      ].map((code) => pulseErrorDescriptor(rpcError(code)).id),
    )
    expect(ids.size).toBe(4)
  })

  it('falls back to a generic descriptor for unknown errors', () => {
    expect(pulseErrorDescriptor(new Error('boom')).id).toBeDefined()
    expect(pulseErrorDescriptor(null).id).toBeDefined()
  })

  it('detects conflict errors specifically', () => {
    expect(isPulseConflict(rpcError(ErrorCodes.PULSE_APPLY_CONFLICT))).toBe(true)
    expect(isPulseConflict(rpcError(ErrorCodes.PULSE_NOT_FOUND))).toBe(false)
  })

  it('detects not-found errors specifically', () => {
    expect(isPulseNotFound(rpcError(ErrorCodes.PULSE_NOT_FOUND))).toBe(true)
    expect(isPulseNotFound(new Error('no'))).toBe(false)
  })
})
