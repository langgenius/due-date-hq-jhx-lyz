import { useMemo } from 'react'
import { useLingui } from '@lingui/react/macro'

import type { AuditEntityTypeLabels } from './audit-log-model'

export function useAuditEntityTypeLabels(): AuditEntityTypeLabels {
  const { t } = useLingui()

  return useMemo(
    () => ({
      auth: t`Authentication`,
      auditEvidencePackage: t`Audit export package`,
      client: t`Client`,
      clientBatch: t`Client import batch`,
      firm: t`Firm`,
      member: t`Team member`,
      memberInvitation: t`Member invitation`,
      migrationBatch: t`Import batch`,
      obligationBatch: t`Deadline batch`,
      obligationInstance: t`Deadline`,
      pulseApplication: t`Pulse application`,
      pulseAlert: t`Pulse alert`,
      rule: t`Rule`,
      ruleSource: t`Rule source`,
      workboardExport: t`Workboard export`,
      workboardSavedView: t`Saved workboard view`,
    }),
    [t],
  )
}
