import type { Env } from '../env'

// Queue consumer entry. EMAIL_QUEUE routes email-outbox messages; PULSE_QUEUE
// routes pulse extract / match work. Runtime dispatch keys stay explicit so the
// two queues can share this Worker entry without conflating message contracts.
export async function queue(
  _batch: MessageBatch,
  _env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  // TODO(phase-0): branch on message.type and dispatch accordingly.
}
