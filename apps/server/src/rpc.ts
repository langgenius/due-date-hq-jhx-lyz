import { RPCHandler } from '@orpc/server/fetch'
import type { Env, ContextVars } from './env'
import { router } from './procedures/index'

// oRPC RPCHandler wired against the root router.
// Contract stays in @duedatehq/contracts; implementation lives under ./procedures.
const handler = new RPCHandler(router)

export async function rpcHandler(
  request: Request,
  env: Env,
  meta: { vars: ContextVars },
): Promise<Response> {
  const { matched, response } = await handler.handle(request, {
    prefix: '/rpc',
    context: { env, vars: meta.vars },
  })

  if (!matched) {
    return new Response('Not Found', { status: 404 })
  }
  return response
}
