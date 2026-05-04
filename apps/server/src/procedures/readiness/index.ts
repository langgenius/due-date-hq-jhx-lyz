import { ORPCError } from '@orpc/server'
import { createAI } from '@duedatehq/ai'
import type { ReadinessChecklistItem, ReadinessGenerateChecklistOutput } from '@duedatehq/contracts'
import * as z from 'zod'
import { requireTenant } from '../_context'
import { OBLIGATION_STATUS_WRITE_ROLES, requireCurrentFirmRole } from '../_permissions'
import { requirePracticeAiWorkflow } from '../_plan-gates'
import { os } from '../_root'
import { signReadinessPortalToken, sha256Hex } from '../../lib/readiness-token'
import { toReadinessRequestPublic } from './_public'

const READINESS_PORTAL_TTL_MS = 14 * 24 * 60 * 60 * 1000

const AiReadinessChecklistOutputSchema = z.object({
  items: z.array(
    z.object({
      label: z.string().trim().min(1).max(120),
      description: z.string().trim().max(500).nullable().optional(),
      reason: z.string().trim().max(500).nullable().optional(),
      sourceHint: z.string().trim().max(240).nullable().optional(),
    }),
  ),
})

function fallbackChecklist(taxType: string): ReadinessChecklistItem[] {
  return [
    {
      id: 'source-documents',
      label: 'Source documents',
      description: `Upload or confirm the source documents needed for ${taxType}.`,
      reason: 'Preparer needs current records before filing work starts.',
      sourceHint: 'Client records',
    },
    {
      id: 'ownership-changes',
      label: 'Ownership changes',
      description: 'Confirm whether ownership, address, or entity details changed this year.',
      reason: 'Entity facts can affect return preparation and deadline handling.',
      sourceHint: 'Client confirmation',
    },
    {
      id: 'payment-plan',
      label: 'Payment plan',
      description: 'Confirm who will approve payment and when funds will be available.',
      reason: 'Extensions do not extend payment obligations.',
      sourceHint: 'Extension policy',
    },
  ]
}

function normalizeChecklist(
  items: ReadonlyArray<{
    id?: string
    label: string
    description?: string | null | undefined
    reason?: string | null | undefined
    sourceHint?: string | null | undefined
  }>,
) {
  return items.slice(0, 4).map(
    (item, index): ReadinessChecklistItem => ({
      id:
        'id' in item && item.id
          ? item.id
          : item.label
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '') || `item-${index + 1}`,
      label: item.label,
      description: item.description ?? null,
      reason: item.reason ?? null,
      sourceHint: item.sourceHint ?? null,
    }),
  )
}

function portalUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, '')}/readiness/${encodeURIComponent(token)}`
}

async function portalUrlForRequest(input: {
  appUrl: string
  secret: string
  requestId: string
  expiresAt: Date
  status: string
}): Promise<string | null> {
  if (input.status === 'revoked' || input.status === 'expired') return null
  if (input.expiresAt.getTime() <= Date.now()) return null
  const token = await signReadinessPortalToken({
    secret: input.secret,
    requestId: input.requestId,
    expiresAtMs: input.expiresAt.getTime(),
  })
  return portalUrl(input.appUrl, token)
}

async function publicRequest(input: {
  appUrl: string
  secret: string
  row: Parameters<typeof toReadinessRequestPublic>[0]
}) {
  return toReadinessRequestPublic(
    input.row,
    await portalUrlForRequest({
      appUrl: input.appUrl,
      secret: input.secret,
      requestId: input.row.id,
      expiresAt: input.row.expiresAt,
      status: input.row.status,
    }),
  )
}

const generateChecklist = os.readiness.generateChecklist.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped, userId, tenant } = requireTenant(context)
  requirePracticeAiWorkflow(tenant.plan)
  const obligation = await scoped.obligations.findById(input.obligationId)
  if (!obligation) {
    throw new ORPCError('NOT_FOUND', {
      message: `Obligation ${input.obligationId} not found in current firm.`,
    })
  }
  const client = await scoped.clients.findById(obligation.clientId)
  if (!client) {
    throw new ORPCError('NOT_FOUND', { message: 'Client not found for obligation.' })
  }

  const ai = createAI(context.env)
  const promptInput = {
    taxType: obligation.taxType,
    entityType: client.entityType,
    state: obligation.jurisdiction ?? client.state,
    currentDueDate: obligation.currentDueDate.toISOString().slice(0, 10),
  }
  const aiResult = await ai.runPrompt(
    'readiness-checklist@v1',
    promptInput,
    AiReadinessChecklistOutputSchema,
    { plan: tenant.plan, firmId: tenant.firmId, taskKind: 'readiness' },
  )
  const checklist = normalizeChecklist(
    aiResult.result ? aiResult.result.items : fallbackChecklist(obligation.taxType),
  )
  const recorded = await scoped.ai.recordRun({
    userId,
    kind: 'readiness_checklist',
    inputContextRef: obligation.id,
    trace: aiResult.trace,
    outputText: JSON.stringify(aiResult.result ?? { items: checklist }),
    citations: { obligationId: obligation.id },
    errorMsg: aiResult.refusal?.message ?? null,
  })
  const evidence = await scoped.evidence.write({
    obligationInstanceId: obligation.id,
    sourceType: 'readiness_checklist_ai',
    sourceId: recorded.aiOutputId,
    rawValue: JSON.stringify(promptInput),
    normalizedValue: JSON.stringify(checklist),
    confidence: aiResult.confidence,
    model: aiResult.model,
    appliedBy: userId,
  })
  return {
    checklist,
    degraded: aiResult.refusal !== null,
    aiOutputId: recorded.aiOutputId,
    evidenceId: evidence.id,
  } satisfies ReadinessGenerateChecklistOutput
})

const sendRequest = os.readiness.sendRequest.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped, userId } = requireTenant(context)
  const obligation = await scoped.obligations.findById(input.obligationId)
  if (!obligation) {
    throw new ORPCError('NOT_FOUND', {
      message: `Obligation ${input.obligationId} not found in current firm.`,
    })
  }
  const client = await scoped.clients.findById(obligation.clientId)
  if (!client) throw new ORPCError('NOT_FOUND', { message: 'Client not found.' })

  const requestId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + READINESS_PORTAL_TTL_MS)
  const token = await signReadinessPortalToken({
    secret: context.env.AUTH_SECRET,
    requestId,
    expiresAtMs: expiresAt.getTime(),
  })
  const url = portalUrl(context.env.APP_URL, token)
  const request = await scoped.readiness.createRequest({
    id: requestId,
    obligationInstanceId: obligation.id,
    clientId: obligation.clientId,
    createdByUserId: userId,
    recipientEmail: client.email,
    tokenHash: await sha256Hex(token),
    checklistJson: input.checklist,
    expiresAt,
    sentAt: client.email ? new Date() : null,
  })
  const { id: auditId } = await scoped.audit.write({
    actorId: userId,
    entityType: 'obligation_instance',
    entityId: obligation.id,
    action: 'readiness.request.sent',
    after: {
      requestId,
      checklistCount: input.checklist.length,
      recipientEmail: client.email ? 'present' : 'missing',
    },
  })

  let emailQueued = false
  if (client.email && scoped.notifications) {
    const queued = await scoped.notifications.enqueueEmail({
      externalId: `readiness:${requestId}`,
      type: 'readiness_request',
      payloadJson: {
        recipients: [client.email],
        subject: `Readiness check for ${obligation.taxType}`,
        text: [
          `Please complete the readiness check for ${client.name} - ${obligation.taxType}.`,
          '',
          url,
        ].join('\n'),
      },
    })
    emailQueued = queued.created
    await context.env.EMAIL_QUEUE.send({ type: 'email.flush' }).catch(() => undefined)
  }

  return {
    request: toReadinessRequestPublic(request, url),
    auditId,
    emailQueued,
  }
})

const revokeRequest = os.readiness.revokeRequest.handler(async ({ input, context }) => {
  await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped, userId } = requireTenant(context)
  const before = await scoped.readiness.getRequest(input.requestId)
  if (!before) throw new ORPCError('NOT_FOUND', { message: 'Readiness request not found.' })
  await scoped.readiness.revokeRequest(input.requestId)
  const after = await scoped.readiness.getRequest(input.requestId)
  if (!after) throw new Error('Revoked request could not be re-read.')
  const { id: auditId } = await scoped.audit.write({
    actorId: userId,
    entityType: 'obligation_instance',
    entityId: after.obligationInstanceId,
    action: 'readiness.request.revoked',
    before: { requestId: before.id, status: before.status },
    after: { requestId: after.id, status: after.status },
  })
  return {
    request: await publicRequest({
      appUrl: context.env.APP_URL,
      secret: context.env.AUTH_SECRET,
      row: after,
    }),
    auditId,
  }
})

const listByObligation = os.readiness.listByObligation.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  const rows = await scoped.readiness.listByObligation(input.obligationId)
  return {
    requests: await Promise.all(
      rows.map((row) =>
        publicRequest({
          appUrl: context.env.APP_URL,
          secret: context.env.AUTH_SECRET,
          row,
        }),
      ),
    ),
  }
})

export const readinessHandlers = {
  generateChecklist,
  sendRequest,
  revokeRequest,
  listByObligation,
}

export { portalUrlForRequest }
