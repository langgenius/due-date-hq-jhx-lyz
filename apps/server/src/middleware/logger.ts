import { createMiddleware } from 'hono/factory'
import type { Env, ContextVars } from '../env'

type ServerErrorBoundary = 'hono' | 'orpc'

interface ServerErrorLogInput {
  boundary: ServerErrorBoundary
  error: unknown
  requestId?: string | undefined
  method?: string | undefined
  path?: string | undefined
  procedure?: string | undefined
  status?: number | undefined
  firmId?: string | undefined
  userId?: string | undefined
}

type ErrorRecord = {
  name: string
  message: string
  stack?: string | undefined
  code?: string | undefined
  status?: number | undefined
  cause?: ErrorRecord | undefined
}

// Attach a request id. Real Sentry/Logpush wiring lands in Phase 0.
export const requestIdMiddleware = createMiddleware<{ Bindings: Env; Variables: ContextVars }>(
  async (c, next) => {
    const requestId = crypto.randomUUID()
    c.set('requestId', requestId)
    c.header('x-request-id', requestId)
    await next()
  },
)

export function logServerError(input: ServerErrorLogInput): void {
  const status =
    input.status ?? readNumber(input.error, 'status') ?? readNumber(input.error, 'statusCode')

  if (status !== undefined && status < 500) {
    return
  }

  console.error(
    compactRecord({
      level: 'error',
      event: 'server_error',
      boundary: input.boundary,
      requestId: input.requestId,
      method: input.method,
      path: input.path,
      procedure: input.procedure,
      status,
      firmId: input.firmId,
      userId: input.userId,
      error: serializeError(input.error),
    }),
  )
}

function serializeError(error: unknown): ErrorRecord {
  if (error instanceof Error) {
    const record: ErrorRecord = {
      name: error.name,
      message: error.message,
    }
    const status = readNumber(error, 'status') ?? readNumber(error, 'statusCode')
    const code = readString(error, 'code')
    if (error.stack !== undefined) record.stack = error.stack
    if (code !== undefined) record.code = code
    if (status !== undefined) record.status = status
    if (error.cause !== undefined) record.cause = serializeError(error.cause)
    return record
  }

  if (isRecord(error)) {
    const record: ErrorRecord = {
      name: readString(error, 'name') ?? 'Error',
      message: readString(error, 'message') ?? 'Unknown error',
    }
    const status = readNumber(error, 'status') ?? readNumber(error, 'statusCode')
    const code = readString(error, 'code')
    if (code !== undefined) record.code = code
    if (status !== undefined) record.status = status
    if (error.cause !== undefined) record.cause = serializeError(error.cause)
    return record
  }

  return {
    name: 'Error',
    message: String(error),
  }
}

function readString(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) {
    return undefined
  }
  const out = value[key]
  return typeof out === 'string' ? out : undefined
}

function readNumber(value: unknown, key: string): number | undefined {
  if (!isRecord(value)) {
    return undefined
  }
  const out = value[key]
  return typeof out === 'number' ? out : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function compactRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined))
}
