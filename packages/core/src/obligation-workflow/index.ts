export const OBLIGATION_STATUSES = [
  'pending',
  'in_progress',
  'done',
  'extended',
  'paid',
  'waiting_on_client',
  'review',
  'not_applicable',
] as const

export type ObligationStatus = (typeof OBLIGATION_STATUSES)[number]

export const OBLIGATION_READINESSES = ['ready', 'waiting', 'needs_review'] as const
export type ObligationReadiness = (typeof OBLIGATION_READINESSES)[number]

export const OPEN_OBLIGATION_STATUSES = [
  'pending',
  'in_progress',
  'waiting_on_client',
  'review',
] as const satisfies readonly ObligationStatus[]

export const CLOSED_OBLIGATION_STATUSES = [
  'done',
  'extended',
  'paid',
  'not_applicable',
] as const satisfies readonly ObligationStatus[]

export type OpenObligationStatus = (typeof OPEN_OBLIGATION_STATUSES)[number]
export type ClosedObligationStatus = (typeof CLOSED_OBLIGATION_STATUSES)[number]

export type ObligationStatusDisplayKey =
  | 'not_started'
  | 'in_progress'
  | 'filed'
  | 'extended'
  | 'paid'
  | 'waiting_on_client'
  | 'needs_review'
  | 'not_applicable'

export const OBLIGATION_STATUS_DISPLAY_KEYS: Record<ObligationStatus, ObligationStatusDisplayKey> =
  {
    pending: 'not_started',
    in_progress: 'in_progress',
    done: 'filed',
    extended: 'extended',
    paid: 'paid',
    waiting_on_client: 'waiting_on_client',
    review: 'needs_review',
    not_applicable: 'not_applicable',
  }

export function isOpenObligationStatus(status: ObligationStatus): status is OpenObligationStatus {
  return (OPEN_OBLIGATION_STATUSES as readonly ObligationStatus[]).includes(status)
}

export function isClosedObligationStatus(
  status: ObligationStatus,
): status is ClosedObligationStatus {
  return (CLOSED_OBLIGATION_STATUSES as readonly ObligationStatus[]).includes(status)
}

export function defaultReadinessForStatus(
  status: ObligationStatus,
  currentReadiness: ObligationReadiness | null | undefined,
): ObligationReadiness {
  if (status === 'waiting_on_client') return 'waiting'
  if (status === 'review') return 'needs_review'
  if (isClosedObligationStatus(status)) return 'ready'
  return currentReadiness ?? 'ready'
}
