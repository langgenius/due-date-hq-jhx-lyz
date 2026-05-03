import { auditHandlers } from './audit'
import { clientsHandlers } from './clients'
import { dashboardHandlers } from './dashboard'
import { evidenceHandlers } from './evidence'
import { firmsHandlers } from './firms'
import { migrationHandlers } from './migration'
import { membersHandlers } from './members'
import { notificationsHandlers } from './notifications'
import { obligationsHandlers } from './obligations'
import { pulseHandlers } from './pulse'
import { readinessHandlers } from './readiness'
import { rulesHandlers } from './rules'
import { securityHandlers } from './security'
import { workboardHandlers } from './workboard'
import { workloadHandlers } from './workload'
import { os } from './_root'

/**
 * Root oRPC router.
 *
 * Each domain has its own folder under `procedures/`. Per-domain `*Handlers`
 * objects fan out into the contract router shape here.
 *
 * Constraint (docs/dev-file/08 §4.1):
 *   - procedures may NOT import @duedatehq/db / its subpaths.
 *   - they receive the scoped repo via `context.vars.scoped` (tenant
 *     middleware injects it before this handler runs).
 */

export const router = os.router({
  audit: {
    list: auditHandlers.list,
    requestEvidencePackage: auditHandlers.requestEvidencePackage,
    getEvidencePackage: auditHandlers.getEvidencePackage,
    listEvidencePackages: auditHandlers.listEvidencePackages,
    createDownloadUrl: auditHandlers.createDownloadUrl,
  },
  firms: {
    listMine: firmsHandlers.listMine,
    getCurrent: firmsHandlers.getCurrent,
    create: firmsHandlers.create,
    switchActive: firmsHandlers.switchActive,
    updateCurrent: firmsHandlers.updateCurrent,
    previewSmartPriorityProfile: firmsHandlers.previewSmartPriorityProfile,
    listSubscriptions: firmsHandlers.listSubscriptions,
    softDeleteCurrent: firmsHandlers.softDeleteCurrent,
  },
  clients: {
    create: clientsHandlers.create,
    createBatch: clientsHandlers.createBatch,
    get: clientsHandlers.get,
    listByFirm: clientsHandlers.listByFirm,
    updateJurisdiction: clientsHandlers.updateJurisdiction,
    updatePenaltyInputs: clientsHandlers.updatePenaltyInputs,
    updateRiskProfile: clientsHandlers.updateRiskProfile,
    getRiskSummary: clientsHandlers.getRiskSummary,
    requestRiskSummaryRefresh: clientsHandlers.requestRiskSummaryRefresh,
    bulkUpdateAssignee: clientsHandlers.bulkUpdateAssignee,
  },
  obligations: {
    createBatch: obligationsHandlers.createBatch,
    updateDueDate: obligationsHandlers.updateDueDate,
    updateStatus: obligationsHandlers.updateStatus,
    bulkUpdateStatus: obligationsHandlers.bulkUpdateStatus,
    updateReadiness: obligationsHandlers.updateReadiness,
    decideExtension: obligationsHandlers.decideExtension,
    bulkUpdateReadiness: obligationsHandlers.bulkUpdateReadiness,
    listByClient: obligationsHandlers.listByClient,
    getDeadlineTip: obligationsHandlers.getDeadlineTip,
    requestDeadlineTipRefresh: obligationsHandlers.requestDeadlineTipRefresh,
  },
  dashboard: {
    load: dashboardHandlers.load,
    requestBriefRefresh: dashboardHandlers.requestBriefRefresh,
  },
  evidence: {
    listByObligation: evidenceHandlers.listByObligation,
  },
  workboard: {
    list: workboardHandlers.list,
    getDetail: workboardHandlers.getDetail,
    facets: workboardHandlers.facets,
    listSavedViews: workboardHandlers.listSavedViews,
    createSavedView: workboardHandlers.createSavedView,
    updateSavedView: workboardHandlers.updateSavedView,
    deleteSavedView: workboardHandlers.deleteSavedView,
    exportSelected: workboardHandlers.exportSelected,
  },
  workload: {
    load: workloadHandlers.load,
  },
  pulse: {
    listAlerts: pulseHandlers.listAlerts,
    listHistory: pulseHandlers.listHistory,
    listSourceHealth: pulseHandlers.listSourceHealth,
    getDetail: pulseHandlers.getDetail,
    apply: pulseHandlers.apply,
    dismiss: pulseHandlers.dismiss,
    snooze: pulseHandlers.snooze,
    revert: pulseHandlers.revert,
    reactivate: pulseHandlers.reactivate,
  },
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
    listBatches: migrationHandlers.listBatches,
    listBatchClients: migrationHandlers.listBatchClients,
  },
  members: {
    listCurrent: membersHandlers.listCurrent,
    listAssignable: membersHandlers.listAssignable,
    invite: membersHandlers.invite,
    cancelInvitation: membersHandlers.cancelInvitation,
    resendInvitation: membersHandlers.resendInvitation,
    updateRole: membersHandlers.updateRole,
    suspend: membersHandlers.suspend,
    reactivate: membersHandlers.reactivate,
    remove: membersHandlers.remove,
  },
  notifications: {
    list: notificationsHandlers.list,
    unreadCount: notificationsHandlers.unreadCount,
    markRead: notificationsHandlers.markRead,
    markAllRead: notificationsHandlers.markAllRead,
    getPreferences: notificationsHandlers.getPreferences,
    updatePreferences: notificationsHandlers.updatePreferences,
  },
  readiness: {
    generateChecklist: readinessHandlers.generateChecklist,
    sendRequest: readinessHandlers.sendRequest,
    revokeRequest: readinessHandlers.revokeRequest,
    listByObligation: readinessHandlers.listByObligation,
  },
  rules: {
    listSources: rulesHandlers.listSources,
    listRules: rulesHandlers.listRules,
    coverage: rulesHandlers.coverage,
    previewObligations: rulesHandlers.previewObligations,
  },
  security: {
    status: securityHandlers.status,
    enableTwoFactor: securityHandlers.enableTwoFactor,
    verifyTwoFactor: securityHandlers.verifyTwoFactor,
    disableTwoFactor: securityHandlers.disableTwoFactor,
    revokeSession: securityHandlers.revokeSession,
    revokeOtherSessions: securityHandlers.revokeOtherSessions,
  },
})
