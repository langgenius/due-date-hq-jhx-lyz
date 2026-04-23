import { Hono } from 'hono'
import { createWorkerAuth } from '../auth'
import type { Env, ContextVars } from '../env'

export const authRoute = new Hono<{ Bindings: Env; Variables: ContextVars }>().on(
  ['GET', 'POST'],
  '*',
  async (c) => {
    const auth = createWorkerAuth(c.env, c.executionCtx)
    return auth.handler(c.req.raw)
  },
)
