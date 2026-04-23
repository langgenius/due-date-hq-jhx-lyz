import type { Env } from '../env'

// Cron Trigger entry — fan out by cron expression in Phase 0.
// Current schedule: */30 * * * * (see wrangler.toml). Drives Pulse ingest + reminders.
export async function scheduled(
  _controller: ScheduledController,
  _env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  // TODO(phase-0): dispatch to jobs/pulse/ingest.ts and jobs/reminders/*.
}
