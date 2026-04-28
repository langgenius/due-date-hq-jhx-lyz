import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logServerError } from './logger'

describe('logServerError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not log 4xx errors as server errors', () => {
    logServerError({
      boundary: 'orpc',
      error: Object.assign(new Error('Invalid input'), { status: 400 }),
      requestId: 'req_123',
      procedure: 'migration.runNormalizer',
    })

    expect(console.error).not.toHaveBeenCalled()
  })

  it('logs 5xx errors with request and procedure context', () => {
    logServerError({
      boundary: 'orpc',
      error: Object.assign(new Error('Normalizer failed'), {
        code: 'INTERNAL_SERVER_ERROR',
        status: 500,
      }),
      requestId: 'req_123',
      path: '/rpc/migration/runNormalizer',
      procedure: 'migration.runNormalizer',
      firmId: 'firm_123',
      userId: 'user_123',
    })

    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        event: 'server_error',
        boundary: 'orpc',
        requestId: 'req_123',
        path: '/rpc/migration/runNormalizer',
        procedure: 'migration.runNormalizer',
        firmId: 'firm_123',
        userId: 'user_123',
        error: expect.objectContaining({
          name: 'Error',
          message: 'Normalizer failed',
          code: 'INTERNAL_SERVER_ERROR',
          status: 500,
        }),
      }),
    )
  })
})
