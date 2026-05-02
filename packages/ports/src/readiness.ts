import type { ObligationReadiness } from './shared'

export interface ReadinessChecklistItemRow {
  id: string
  label: string
  description: string | null
  reason: string | null
  sourceHint: string | null
}

export type ReadinessRequestStatus = 'sent' | 'opened' | 'responded' | 'revoked' | 'expired'
export type ReadinessResponseStatus = 'ready' | 'not_yet' | 'need_help'

export interface ClientReadinessRequestRow {
  id: string
  firmId: string
  obligationInstanceId: string
  clientId: string
  createdByUserId: string
  recipientEmail: string | null
  tokenHash: string
  status: ReadinessRequestStatus
  checklistJson: ReadinessChecklistItemRow[]
  expiresAt: Date
  sentAt: Date | null
  firstOpenedAt: Date | null
  lastRespondedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ClientReadinessResponseRow {
  id: string
  firmId: string
  requestId: string
  obligationInstanceId: string
  itemId: string
  status: ReadinessResponseStatus
  note: string | null
  etaDate: Date | null
  createdAt: Date
}

export interface ClientReadinessRequestWithResponses extends ClientReadinessRequestRow {
  responses: ClientReadinessResponseRow[]
}

export interface ReadinessSubmitResponseInput {
  requestId: string
  obligationInstanceId: string
  responses: Array<{
    itemId: string
    status: ReadinessResponseStatus
    note?: string | null
    etaDate?: Date | null
  }>
  submittedAt: Date
}

export interface ReadinessRepo {
  readonly firmId: string
  listByObligation(obligationInstanceId: string): Promise<ClientReadinessRequestWithResponses[]>
  createRequest(input: {
    id: string
    obligationInstanceId: string
    clientId: string
    createdByUserId: string
    recipientEmail: string | null
    tokenHash: string
    checklistJson: ReadinessChecklistItemRow[]
    expiresAt: Date
    sentAt: Date | null
  }): Promise<ClientReadinessRequestWithResponses>
  getRequest(id: string): Promise<ClientReadinessRequestWithResponses | undefined>
  markOpened(id: string, openedAt: Date): Promise<void>
  revokeRequest(id: string): Promise<void>
  submitResponses(input: ReadinessSubmitResponseInput): Promise<{
    readiness: ObligationReadiness
  }>
}
