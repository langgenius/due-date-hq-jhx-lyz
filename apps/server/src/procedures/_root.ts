import { implement } from '@orpc/server'
import { appContract } from '@duedatehq/contracts'
import type { RpcContext } from './_context'

/**
 * Root procedure builder. Bind the context type once so every handler sees
 * `context: RpcContext` (env + vars). Per-domain handler files import `os`
 * from this module instead of from index.ts to avoid a circular reference.
 */
export const os = implement(appContract).$context<RpcContext>()
