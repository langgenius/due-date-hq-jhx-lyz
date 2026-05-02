export type SeverityTone = 'critical' | 'high' | 'medium' | 'neutral'

const tonedRowClass: Record<Exclude<SeverityTone, 'neutral'>, string> = {
  critical: 'bg-components-badge-bg-red-soft hover:bg-components-badge-bg-red-soft',
  high: 'bg-components-badge-bg-warning-soft hover:bg-components-badge-bg-warning-soft',
  medium: 'bg-components-badge-bg-gray-soft hover:bg-components-badge-bg-gray-soft',
}

export function severityRowClass(tone: SeverityTone): string {
  return tone === 'neutral' ? '' : tonedRowClass[tone]
}
