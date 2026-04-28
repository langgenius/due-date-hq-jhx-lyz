import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import type { Env, ContextVars } from './env'
import { logServerError } from './middleware/logger'
import { router } from './procedures/index'

// oRPC RPCHandler wired against the root router.
// Contract stays in @duedatehq/contracts; implementation lives under ./procedures.
const handler = new RPCHandler(router, {
  clientInterceptors: [
    onError((error, options) => {
      logServerError({
        boundary: 'orpc',
        error,
        requestId: options.context.vars.requestId,
        path: `/rpc/${options.path.join('/')}`,
        procedure: options.path.join('.'),
        firmId: options.context.vars.firmId,
        userId: options.context.vars.userId,
      })
    }),
  ],
})

export async function rpcHandler(
  request: Request,
  env: Env,
  meta: { vars: ContextVars },
): Promise<Response> {
  const { matched, response } = await handler.handle(request, {
    prefix: '/rpc',
    context: { env, request, vars: meta.vars },
  })

  if (!matched) {
    return new Response('Not Found', { status: 404 })
  }
  return response
}
