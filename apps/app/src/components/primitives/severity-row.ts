// Severity-aware row recipe per DESIGN.md `risk-row-{tone}` tokens.
// Apply the returned className to a `<TableRow>` (or any tr) to render the
// row with a tinted background and a 2px left bar in the matching severity
// color. `neutral` keeps the default surface (no token defined upstream).

export type SeverityTone = 'critical' | 'high' | 'medium' | 'neutral'

const tonedRowClass: Record<Exclude<SeverityTone, 'neutral'>, string> = {
  critical:
    'border-l-2 border-l-severity-critical bg-severity-critical-tint hover:bg-severity-critical-tint',
  high: 'border-l-2 border-l-severity-high bg-severity-high-tint hover:bg-severity-high-tint',
  medium:
    'border-l-2 border-l-severity-medium bg-severity-medium-tint hover:bg-severity-medium-tint',
}

export function severityRowClass(tone: SeverityTone): string {
  return tone === 'neutral' ? '' : tonedRowClass[tone]
}
