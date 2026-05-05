import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { AppContract } from '@duedatehq/contracts'

import { attachLocaleHeader } from '@/i18n/i18n'

// CONSTRAINT (docs/dev-file/05 §4): apps/app may only reach the Worker via this module.
// React surfaces consume `orpc.*.queryOptions()` / `mutationOptions()` only.
// Route loaders may use `orpc.*.call()` for pre-render redirects.
// `fetch('/rpc/...')`, hand-rolled oRPC clients, and direct `rpc.*` calls are forbidden.

function buildInit(init: RequestInit | undefined): RequestInit {
  const headers = new Headers(init?.headers)
  attachLocaleHeader(headers)
  return { ...init, headers, credentials: 'include' }
}

const link = new RPCLink({
  url: `${window.location.origin}/rpc`,
  fetch: (req, init) => fetch(req, buildInit(init)),
})

const rpc: ContractRouterClient<AppContract> = createORPCClient(link)
export const orpc = createTanstackQueryUtils(rpc)
