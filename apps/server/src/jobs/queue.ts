import type { Env } from '../env'

interface QueueBatchLike {
  queue: string
  messages: readonly unknown[]
}

export function assertQueueDispatchable(batch: QueueBatchLike): void {
  if (batch.messages.length === 0) return
  throw new Error(`No queue dispatcher is implemented for ${batch.queue}.`)
}

// Queue consumer entry. EMAIL_QUEUE routes email-outbox messages; PULSE_QUEUE
// routes pulse extract / match work. Runtime dispatch keys stay explicit so the
// two queues can share this Worker entry without conflating message contracts.
export async function queue(batch: MessageBatch, _env: Env, _ctx: ExecutionContext): Promise<void> {
  assertQueueDispatchable(batch)
}
