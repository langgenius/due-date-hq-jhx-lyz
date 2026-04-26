// Severity-aware row recipe. Apply the returned className to a `<TableRow>`
// (or any tr) to render the row with a soft Dify-style tint and a 2px left bar
// in the matching severity tone. `neutral` keeps the default surface.

export type SeverityTone = 'critical' | 'high' | 'medium' | 'neutral'

const tonedRowClass: Record<Exclude<SeverityTone, 'neutral'>, string> = {
  critical:
    'border-l-2 border-l-text-destructive bg-components-badge-bg-red-soft hover:bg-components-badge-bg-red-soft',
  high: 'border-l-2 border-l-text-warning bg-components-badge-bg-warning-soft hover:bg-components-badge-bg-warning-soft',
  medium:
    'border-l-2 border-l-text-tertiary bg-components-badge-bg-gray-soft hover:bg-components-badge-bg-gray-soft',
}

export function severityRowClass(tone: SeverityTone): string {
  return tone === 'neutral' ? '' : tonedRowClass[tone]
}
