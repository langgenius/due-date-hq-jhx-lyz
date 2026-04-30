export interface DueDateOverlayApplication {
  readonly obligationId: string
  readonly overrideDueDate: Date
  readonly appliedAt: Date
}

export function applyDueDateOverlay(
  baseDueDate: Date,
  overlays: readonly DueDateOverlayApplication[],
): Date {
  const latest = overlays
    .filter((overlay) => !Number.isNaN(overlay.overrideDueDate.getTime()))
    .toSorted((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())[0]

  return latest?.overrideDueDate ?? baseDueDate
}

export function deriveOverlayDueDateMap(
  overlays: readonly DueDateOverlayApplication[],
): Map<string, Date> {
  const result = new Map<string, Date>()
  const sorted = overlays
    .filter((overlay) => !Number.isNaN(overlay.overrideDueDate.getTime()))
    .toSorted((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())

  for (const overlay of sorted) {
    if (!result.has(overlay.obligationId)) result.set(overlay.obligationId, overlay.overrideDueDate)
  }

  return result
}
