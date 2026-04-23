import { Hono } from 'hono'
import type { Env, ContextVars } from '../env'

// /api/auth/* · better-auth handler mount point.
// The actual handler is produced by @duedatehq/auth's createAuth factory and plugged in here.
export const authRoute = new Hono<{ Bindings: Env; Variables: ContextVars }>().all(
  '*',
  async (c) => {
    // TODO(phase-0):
    //   const auth = createAuth({ db: createDb(c.env.DB), env: c.env })
    //   return auth.handler(c.req.raw)
    return c.json({ error: 'auth handler not wired yet' }, 501)
  },
)
