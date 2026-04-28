import { createMiddleware } from 'hono/factory'
import { createDb, makeFirmsRepo, makeMembersRepo } from '@duedatehq/db'
import type { Env, ContextVars } from '../env'

export const firmAccessMiddleware = createMiddleware<{ Bindings: Env; Variables: ContextVars }>(
  async (c, next) => {
    const db = createDb(c.env.DB)
    c.set('firms', makeFirmsRepo(db))
    c.set('members', makeMembersRepo(db))
    return next()
  },
)
