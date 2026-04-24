import { implement, ORPCError } from '@orpc/server'
import { appContract } from '@duedatehq/contracts'

// Root router — implements appContract.
// Each slice (clients/obligations/…) lives under its own folder and is plugged in here.
// Constraint (docs/dev-file/08 §4.1): procedures may NOT import `@duedatehq/db` or subpaths.
// They receive a scoped repo via `context.vars.scoped`, injected by tenant middleware.
export const os = implement(appContract)

function notImplemented(): never {
  throw new ORPCError('ORPC_NOT_IMPLEMENTED', {
    message: 'This procedure contract is frozen; implementation lands in the next slice.',
  })
}

export const router = os.router({
  clients: {
    create: os.clients.create.handler(notImplemented),
    createBatch: os.clients.createBatch.handler(notImplemented),
    get: os.clients.get.handler(notImplemented),
    listByFirm: os.clients.listByFirm.handler(notImplemented),
  },
  obligations: {
    createBatch: os.obligations.createBatch.handler(notImplemented),
    updateDueDate: os.obligations.updateDueDate.handler(notImplemented),
    listByClient: os.obligations.listByClient.handler(notImplemented),
  },
  dashboard: {},
  workboard: {},
  pulse: {},
  migration: {
    createBatch: os.migration.createBatch.handler(notImplemented),
    uploadRaw: os.migration.uploadRaw.handler(notImplemented),
    runMapper: os.migration.runMapper.handler(notImplemented),
    confirmMapping: os.migration.confirmMapping.handler(notImplemented),
    runNormalizer: os.migration.runNormalizer.handler(notImplemented),
    confirmNormalization: os.migration.confirmNormalization.handler(notImplemented),
    applyDefaultMatrix: os.migration.applyDefaultMatrix.handler(notImplemented),
    dryRun: os.migration.dryRun.handler(notImplemented),
    apply: os.migration.apply.handler(notImplemented),
    revert: os.migration.revert.handler(notImplemented),
    singleUndo: os.migration.singleUndo.handler(notImplemented),
    getBatch: os.migration.getBatch.handler(notImplemented),
  },
})
