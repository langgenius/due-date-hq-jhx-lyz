import { implement } from '@orpc/server'
import { appContract } from '@duedatehq/contracts'

// Root router — implements appContract.
// Each slice (clients/obligations/…) lives under its own folder and is plugged in here.
// Constraint (docs/dev-file/08 §4.1): procedures may NOT import `@duedatehq/db` or subpaths.
// They receive a scoped repo via `context.vars.scoped`, injected by tenant middleware.
export const os = implement(appContract)

export const router = os.router({
  clients: {},
  obligations: {},
  dashboard: {},
  workboard: {},
  pulse: {},
  migration: {},
})
