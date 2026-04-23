import type { Env } from '../env'

// Queue consumer entry — routes messages to jobs/pulse/extract, jobs/email-outbox, etc.
export async function queue(
  _batch: MessageBatch,
  _env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  // TODO(phase-0): branch on message.type and dispatch accordingly.
}
