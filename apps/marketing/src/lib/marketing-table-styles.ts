import type { MarketingBadgeTone, MarketingStatusDotTone } from '../i18n/types'

export const marketingBadgeBase =
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-badge text-xs font-medium whitespace-nowrap transition-colors'

export const marketingBadgeTone: Record<MarketingBadgeTone, string> = {
  destructive: 'bg-components-badge-bg-red-soft text-text-destructive',
  warning: 'bg-components-badge-bg-warning-soft text-text-warning',
  info: 'bg-components-badge-bg-blue-soft text-text-accent',
  success: 'bg-components-badge-bg-green-soft text-text-success',
  secondary: 'bg-components-badge-bg-gray-soft text-text-secondary',
  outline: 'border-divider-regular text-text-secondary',
}

export const marketingStatusDot: Record<MarketingStatusDotTone, string> = {
  success: 'bg-components-badge-status-light-success-bg shadow-status-indicator-green',
  warning: 'bg-components-badge-status-light-warning-bg shadow-status-indicator-warning',
  error: 'bg-components-badge-status-light-error-bg shadow-status-indicator-red',
  normal: 'bg-components-badge-status-light-normal-bg shadow-status-indicator-blue',
  disabled: 'bg-components-badge-status-light-disabled-bg shadow-status-indicator-gray',
}

export const marketingSeverityRow: Record<'critical' | 'high' | 'medium', string> = {
  critical: 'bg-components-badge-bg-red-soft hover:bg-components-badge-bg-red-soft',
  high: 'bg-components-badge-bg-warning-soft hover:bg-components-badge-bg-warning-soft',
  medium: 'bg-components-badge-bg-gray-soft hover:bg-components-badge-bg-gray-soft',
}

export const marketingSeverityBadgeTone: Record<
  'critical' | 'high' | 'medium',
  MarketingBadgeTone
> = {
  critical: 'destructive',
  high: 'warning',
  medium: 'secondary',
}

export const marketingSeverityDot: Record<'critical' | 'high' | 'medium', MarketingStatusDotTone> =
  {
    critical: 'error',
    high: 'warning',
    medium: 'disabled',
  }

export const marketingTable = {
  container: 'relative w-full overflow-x-auto',
  table: 'w-full caption-bottom text-xs text-text-primary',
  header: '[&_tr]:border-b [&_tr]:border-divider-regular',
  body: '[&_tr:last-child]:border-0',
  row: 'border-b border-divider-subtle transition-colors hover:bg-state-base-hover',
  head: 'h-9 px-3 text-left align-middle text-xs font-medium tracking-wider whitespace-nowrap text-text-tertiary uppercase',
  cell: 'p-3 align-middle whitespace-nowrap',
  compactCell: 'px-3 py-2 align-middle whitespace-nowrap',
}

export const marketingTableHeaderControl =
  '-mx-2 inline-flex h-7 max-w-40 items-center gap-1 rounded-md px-2 text-xs font-medium tracking-wider whitespace-nowrap text-text-tertiary uppercase transition-colors hover:bg-state-base-hover hover:text-text-primary'

export const marketingTableHeaderGroup = 'flex min-w-0 items-center gap-1'

export const marketingTableSortButton =
  'inline-flex size-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-state-base-hover hover:text-text-primary'

export const marketingGhostButtonSm =
  'group/button inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-clip-padding px-3.5 text-xs font-medium whitespace-nowrap text-components-button-ghost-text transition-colors hover:bg-components-button-ghost-bg-hover'
