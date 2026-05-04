import { and, desc, eq, inArray } from 'drizzle-orm'
import { deriveObligationReadiness } from '@duedatehq/core/obligation-workflow'
import type {
  ObligationReadiness,
  ObligationStatus,
  ReadinessResponseStatus,
} from '@duedatehq/core/obligation-workflow'
import type { Db } from '../client'
import { clientReadinessRequest, clientReadinessResponse } from '../schema/readiness'

const READINESS_LOOKUP_BATCH_SIZE = 90

export function deriveReadinessForStatus(status: ObligationStatus): ObligationReadiness {
  return deriveObligationReadiness({ status })
}

export async function loadDerivedReadinessByObligation(
  db: Db,
  firmId: string,
  statusesByObligationId: Map<string, ObligationStatus>,
): Promise<Map<string, ObligationReadiness>> {
  const result = new Map<string, ObligationReadiness>()
  const obligationIds = [...statusesByObligationId.keys()]

  for (const [id, status] of statusesByObligationId) {
    result.set(id, deriveReadinessForStatus(status))
  }
  if (obligationIds.length === 0) return result

  const requestByObligationId = new Map<
    string,
    {
      id: string
      obligationInstanceId: string
      status: 'sent' | 'opened' | 'responded' | 'revoked' | 'expired'
      updatedAt: Date
      createdAt: Date
    }
  >()

  const requestReads = []
  for (let i = 0; i < obligationIds.length; i += READINESS_LOOKUP_BATCH_SIZE) {
    const chunk = obligationIds.slice(i, i + READINESS_LOOKUP_BATCH_SIZE)
    requestReads.push(
      db
        .select({
          id: clientReadinessRequest.id,
          obligationInstanceId: clientReadinessRequest.obligationInstanceId,
          status: clientReadinessRequest.status,
          updatedAt: clientReadinessRequest.updatedAt,
          createdAt: clientReadinessRequest.createdAt,
        })
        .from(clientReadinessRequest)
        .where(
          and(
            eq(clientReadinessRequest.firmId, firmId),
            inArray(clientReadinessRequest.obligationInstanceId, chunk),
          ),
        )
        .orderBy(desc(clientReadinessRequest.updatedAt), desc(clientReadinessRequest.createdAt)),
    )
  }

  for (const request of (await Promise.all(requestReads)).flat()) {
    if (!requestByObligationId.has(request.obligationInstanceId)) {
      requestByObligationId.set(request.obligationInstanceId, request)
    }
  }

  const requestIds = [...requestByObligationId.values()].map((request) => request.id)
  const responseStatusesByRequestId = new Map<string, ReadinessResponseStatus[]>()
  const responseReads = []
  for (let i = 0; i < requestIds.length; i += READINESS_LOOKUP_BATCH_SIZE) {
    const chunk = requestIds.slice(i, i + READINESS_LOOKUP_BATCH_SIZE)
    responseReads.push(
      db
        .select({
          requestId: clientReadinessResponse.requestId,
          status: clientReadinessResponse.status,
        })
        .from(clientReadinessResponse)
        .where(
          and(
            eq(clientReadinessResponse.firmId, firmId),
            inArray(clientReadinessResponse.requestId, chunk),
          ),
        ),
    )
  }

  for (const response of (await Promise.all(responseReads)).flat()) {
    const bucket = responseStatusesByRequestId.get(response.requestId) ?? []
    bucket.push(response.status)
    responseStatusesByRequestId.set(response.requestId, bucket)
  }

  for (const [obligationId, request] of requestByObligationId) {
    const status = statusesByObligationId.get(obligationId)
    if (!status) continue
    result.set(
      obligationId,
      deriveObligationReadiness({
        status,
        requestStatus: request.status,
        responseStatuses: responseStatusesByRequestId.get(request.id) ?? [],
      }),
    )
  }

  return result
}
