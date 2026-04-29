import type { Env } from '../env'
import { consumeDashboardBriefRefresh } from './dashboard-brief/consumer'
import { isDashboardBriefRefreshMessage } from './dashboard-brief/message'
import { flushEmailOutbox } from './email/outbox'
import { extractPulseSnapshot } from './pulse/extract'

interface QueueBatchLike {
  queue: string
  messages: readonly { body?: unknown }[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function assertQueueDispatchable(batch: QueueBatchLike): void {
  for (const message of batch.messages) {
    if (!isDispatchableMessage(message.body)) {
      throw new Error(`No queue dispatcher is implemented for ${batch.queue}.`)
    }
  }
}

function isDispatchableMessage(body: unknown): boolean {
  return (
    isDashboardBriefRefreshMessage(body) || isPulseExtractMessage(body) || isEmailFlushMessage(body)
  )
}

function isPulseExtractMessage(
  body: unknown,
): body is { type: 'pulse.extract'; snapshotId: string } {
  return isRecord(body) && body.type === 'pulse.extract' && typeof body.snapshotId === 'string'
}

function isEmailFlushMessage(body: unknown): body is { type: 'email.flush' } {
  return isRecord(body) && body.type === 'email.flush'
}

// Queue consumer entry. Keep message contracts explicit so additional queues
// can be routed here without conflating job payloads.
export async function queue(batch: MessageBatch, env: Env, _ctx: ExecutionContext): Promise<void> {
  assertQueueDispatchable(batch)
  await Promise.all(batch.messages.map((message) => dispatchMessage(message, env)))
}

async function dispatchMessage(message: Message, env: Env): Promise<void> {
  try {
    const body = message.body
    if (isDashboardBriefRefreshMessage(body)) {
      await consumeDashboardBriefRefresh(body, env)
    }
    if (isPulseExtractMessage(body)) {
      await extractPulseSnapshot(env, body.snapshotId)
    }
    if (isEmailFlushMessage(body)) {
      await flushEmailOutbox(env)
    }
    message.ack()
  } catch {
    message.retry()
  }
}
