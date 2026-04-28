import { createMiddleware } from 'hono/factory'
import { createDb, makeFirmsRepo } from '@duedatehq/db'
import type { Env, ContextVars } from '../env'

export const firmAccessMiddleware = createMiddleware<{ Bindings: Env; Variables: ContextVars }>(
  async (c, next) => {
    c.set('firms', makeFirmsRepo(createDb(c.env.DB)))
    return next()
  },
)
