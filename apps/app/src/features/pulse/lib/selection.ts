import type { PulseAffectedClient } from '@duedatehq/contracts'

// Pure selection helpers. Kept side-effect-free so they can be unit tested
// without mounting the drawer or seeding a router.

export function isSelectable(row: PulseAffectedClient): boolean {
  // Only `eligible` rows can be applied. `needs_review` requires CPA confirmation
  // that we don't expose in v1; `already_applied` and `reverted` are read-only.
  return row.matchStatus === 'eligible'
}

export function defaultSelection(rows: readonly PulseAffectedClient[]): Set<string> {
  return new Set(rows.filter(isSelectable).map((row) => row.obligationId))
}

export function toggleSelection(selection: ReadonlySet<string>, obligationId: string): Set<string> {
  const next = new Set(selection)
  if (next.has(obligationId)) next.delete(obligationId)
  else next.add(obligationId)
  return next
}

export function setAllSelection(
  rows: readonly PulseAffectedClient[],
  checked: boolean,
): Set<string> {
  if (!checked) return new Set()
  return defaultSelection(rows)
}

export interface SelectionStats {
  selectableCount: number
  selectedCount: number
  needsReviewCount: number
  alreadyAppliedCount: number
  revertedCount: number
}

export function computeSelectionStats(
  rows: readonly PulseAffectedClient[],
  selection: ReadonlySet<string>,
): SelectionStats {
  let selectableCount = 0
  let needsReviewCount = 0
  let alreadyAppliedCount = 0
  let revertedCount = 0
  for (const row of rows) {
    if (row.matchStatus === 'eligible') selectableCount += 1
    else if (row.matchStatus === 'needs_review') needsReviewCount += 1
    else if (row.matchStatus === 'already_applied') alreadyAppliedCount += 1
    else if (row.matchStatus === 'reverted') revertedCount += 1
  }
  let selectedCount = 0
  for (const id of selection) {
    if (rows.find((row) => row.obligationId === id && row.matchStatus === 'eligible')) {
      selectedCount += 1
    }
  }
  return {
    selectableCount,
    selectedCount,
    needsReviewCount,
    alreadyAppliedCount,
    revertedCount,
  }
}
