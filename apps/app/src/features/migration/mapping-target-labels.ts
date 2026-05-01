import { useLingui } from '@lingui/react/macro'

import type { MappingTarget, MigrationError } from '@duedatehq/contracts'

export const SELECTABLE_MAPPING_TARGETS = [
  'client.name',
  'client.ein',
  'client.state',
  'client.county',
  'client.entity_type',
  'client.tax_types',
  'client.email',
  'client.assignee_name',
  'client.estimated_tax_liability',
  'client.equity_owner_count',
  'client.notes',
] satisfies ReadonlyArray<MappingTarget>

export type MappingTargetLabels = Record<MappingTarget, string>

export function useMappingTargetLabels(): MappingTargetLabels {
  const { t } = useLingui()

  return {
    'client.name': t`Client name`,
    'client.ein': t`EIN`,
    'client.state': t`State`,
    'client.county': t`County`,
    'client.entity_type': t`Entity type`,
    'client.tax_types': t`Tax types`,
    'client.email': t`Email`,
    'client.assignee_name': t`Assignee`,
    'client.estimated_tax_liability': t`Estimated tax liability`,
    'client.equity_owner_count': t`Owner count`,
    'client.notes': t`Notes`,
    IGNORE: t`Ignore this column`,
  }
}

export function formatMigrationErrorMessage(
  error: Pick<MigrationError, 'errorCode' | 'errorMessage'>,
  labels: MappingTargetLabels,
) {
  if (error.errorCode === 'EMPTY_NAME') {
    return 'Row is missing a client name value.'
  }

  return replaceInternalTargetNames(error.errorMessage, labels)
}

function replaceInternalTargetNames(message: string, labels: MappingTargetLabels) {
  let next = message
  for (const target of SELECTABLE_MAPPING_TARGETS) {
    next = next.replaceAll(target, labels[target])
  }
  return next
}
