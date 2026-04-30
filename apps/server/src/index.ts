import type { Env } from './env'
import { createApp } from './app'
import { scheduled as scheduledHandler } from './jobs/cron'
import { ingestGovDeliveryEmail } from './jobs/pulse/govdelivery'
import { queue as queueHandler } from './jobs/queue'

// Single Worker entry — fetch + scheduled + queue. This is the only deployed module.

const app = createApp()

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    return app.fetch(request, env, ctx)
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    await scheduledHandler(controller, env, ctx)
  },

  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    await queueHandler(batch, env, ctx)
  },

  async email(message: ForwardableEmailMessage, env: Env, _ctx: ExecutionContext): Promise<void> {
    await ingestGovDeliveryEmail(env, message)
  },
} satisfies ExportedHandler<Env>
