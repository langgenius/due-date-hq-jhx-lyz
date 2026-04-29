import type { Env } from '../env'
import { consumeDashboardBriefRefresh } from './dashboard-brief/consumer'
import { isDashboardBriefRefreshMessage } from './dashboard-brief/message'

interface QueueBatchLike {
  queue: string
  messages: readonly { body?: unknown }[]
}

export function assertQueueDispatchable(batch: QueueBatchLike): void {
  if (batch.messages.length === 0) return
  if (batch.messages.every((message) => isDashboardBriefRefreshMessage(message.body))) return
  throw new Error(`No queue dispatcher is implemented for ${batch.queue}.`)
}

// Queue consumer entry. Keep message contracts explicit so additional queues
// can be routed here without conflating job payloads.
export async function queue(batch: MessageBatch, env: Env, _ctx: ExecutionContext): Promise<void> {
  assertQueueDispatchable(batch)
  await Promise.all(batch.messages.map((message) => dispatchMessage(message, env)))
}

async function dispatchMessage(message: Message, env: Env): Promise<void> {
  try {
    await consumeDashboardBriefRefresh(message.body, env)
    message.ack()
  } catch {
    message.retry()
  }
}
