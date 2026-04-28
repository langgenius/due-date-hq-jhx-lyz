import { ORPCError } from '@orpc/server'
import { auditHandlers } from './audit'
import { clientsHandlers } from './clients'
import { dashboardHandlers } from './dashboard'
import { evidenceHandlers } from './evidence'
import { firmsHandlers } from './firms'
import { migrationHandlers } from './migration'
import { membersHandlers } from './members'
import { obligationsHandlers } from './obligations'
import { rulesHandlers } from './rules'
import { workboardHandlers } from './workboard'
import { os } from './_root'

/**
 * Root oRPC router.
 *
 * Each domain has its own folder under `procedures/`. Per-domain `*Handlers`
 * objects fan out into the contract router shape here. Domains that haven't
 * landed yet keep `notImplemented` stubs so the contract surface stays
 * complete for typed client codegen.
 *
 * Constraint (docs/dev-file/08 §4.1):
 *   - procedures may NOT import @duedatehq/db / its subpaths.
 *   - they receive the scoped repo via `context.vars.scoped` (tenant
 *     middleware injects it before this handler runs).
 */

function notImplemented(): never {
  throw new ORPCError('ORPC_NOT_IMPLEMENTED', {
    message: 'This procedure contract is frozen; implementation lands in the next slice.',
  })
}

export const router = os.router({
  audit: {
    list: auditHandlers.list,
  },
  firms: {
    listMine: firmsHandlers.listMine,
    getCurrent: firmsHandlers.getCurrent,
    create: firmsHandlers.create,
    switchActive: firmsHandlers.switchActive,
    updateCurrent: firmsHandlers.updateCurrent,
    softDeleteCurrent: firmsHandlers.softDeleteCurrent,
  },
  clients: {
    create: clientsHandlers.create,
    createBatch: clientsHandlers.createBatch,
    get: clientsHandlers.get,
    listByFirm: clientsHandlers.listByFirm,
  },
  obligations: {
    createBatch: obligationsHandlers.createBatch,
    updateDueDate: os.obligations.updateDueDate.handler(notImplemented),
    updateStatus: obligationsHandlers.updateStatus,
    listByClient: obligationsHandlers.listByClient,
  },
  dashboard: {
    load: dashboardHandlers.load,
  },
  evidence: {
    listByObligation: evidenceHandlers.listByObligation,
  },
  workboard: {
    list: workboardHandlers.list,
  },
  pulse: {},
  migration: {
    createBatch: migrationHandlers.createBatch,
    uploadRaw: migrationHandlers.uploadRaw,
    runMapper: migrationHandlers.runMapper,
    confirmMapping: migrationHandlers.confirmMapping,
    runNormalizer: migrationHandlers.runNormalizer,
    confirmNormalization: migrationHandlers.confirmNormalization,
    applyDefaultMatrix: migrationHandlers.applyDefaultMatrix,
    dryRun: migrationHandlers.dryRun,
    apply: migrationHandlers.apply,
    revert: migrationHandlers.revert,
    singleUndo: migrationHandlers.singleUndo,
    getBatch: migrationHandlers.getBatch,
    listErrors: migrationHandlers.listErrors,
  },
  members: {
    listCurrent: membersHandlers.listCurrent,
    invite: membersHandlers.invite,
    cancelInvitation: membersHandlers.cancelInvitation,
    resendInvitation: membersHandlers.resendInvitation,
    updateRole: membersHandlers.updateRole,
    suspend: membersHandlers.suspend,
    reactivate: membersHandlers.reactivate,
    remove: membersHandlers.remove,
  },
  rules: {
    listSources: rulesHandlers.listSources,
    listRules: rulesHandlers.listRules,
    coverage: rulesHandlers.coverage,
    previewObligations: rulesHandlers.previewObligations,
  },
})
