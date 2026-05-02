import { Hono } from 'hono'
import type { Env, ContextVars } from '../env'

export const authCapabilitiesRoute = new Hono<{
  Bindings: Env
  Variables: ContextVars
}>().get('/', (c) =>
  c.json({
    providers: {
      google: true,
      microsoft: Boolean(c.env.MICROSOFT_CLIENT_ID && c.env.MICROSOFT_CLIENT_SECRET),
    },
  }),
)
