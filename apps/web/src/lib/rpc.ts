import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { AppContract } from '@duedatehq/contracts'

// CONSTRAINT (docs/Dev File/05 §4): apps/web may only reach the Worker via this module.
// `fetch('/rpc/...')` or any other hand-rolled oRPC client is forbidden.

const link = new RPCLink({
  url: `${window.location.origin}/rpc`,
  fetch: (req, init) => fetch(req, { ...init, credentials: 'include' }),
})

export const rpc = createORPCClient<AppContract>(link)
export const orpc = createTanstackQueryUtils(rpc)
