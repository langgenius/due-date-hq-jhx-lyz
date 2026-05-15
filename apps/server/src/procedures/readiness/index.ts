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

function checklistItem(input: ReadinessChecklistItem): ReadinessChecklistItem {
  return input
}

function basePaymentChecklist(taxType: string): ReadinessChecklistItem {
  return {
    id: 'payment-instructions',
    label: 'Payment instructions',
    description: `Confirm who will approve payment and when funds will be available for ${taxType}.`,
    reason: 'Extensions do not extend payment obligations.',
    sourceHint: 'Client approval',
  }
}

function fallbackChecklist(taxType: string): ReadinessChecklistItem[] {
  const normalized = taxType.toLowerCase().replace(/[^a-z0-9]+/g, '_')

  if (
    normalized.includes('1040') ||
    normalized.includes('individual') ||
    normalized.includes('schedule_c')
  ) {
    return [
      checklistItem({
        id: 'w2-1099-income',
        label: 'W-2 and 1099 income',
        description: 'Upload all W-2, 1099-NEC, 1099-MISC, 1099-K, interest, and dividend forms.',
        reason: 'Individual return prep starts with complete income source documents.',
        sourceHint: 'Client tax organizer',
      }),
      checklistItem({
        id: 'schedule-c-records',
        label: 'Schedule C records',
        description:
          'Upload business income, expenses, mileage, home-office, and asset purchase records.',
        reason: 'Single-member LLC and sole proprietor facts determine Schedule C readiness.',
        sourceHint: 'Client books',
      }),
      checklistItem({
        id: 'k1-packages',
        label: 'K-1 packages',
        description: 'Upload all partnership, S corp, trust, and estate K-1s received.',
        reason: 'Missing K-1s can block the downstream 1040 workflow.',
        sourceHint: 'Upstream entity returns',
      }),
      basePaymentChecklist(taxType),
    ]
  }

  if (
    normalized.includes('1065') ||
    normalized.includes('1120_s') ||
    normalized.includes('1120s') ||
    normalized.includes('partnership') ||
    normalized.includes('s_corp')
  ) {
    return [
      checklistItem({
        id: 'trial-balance',
        label: 'Trial balance',
        description: 'Upload the year-end trial balance and general ledger detail.',
        reason: 'Entity return prep needs complete books before partner/shareholder review.',
        sourceHint: 'Accounting system export',
      }),
      checklistItem({
        id: 'bank-reconciliations',
        label: 'Bank reconciliations',
        description: 'Confirm bank and credit card accounts are reconciled through year end.',
        reason: 'Open reconciliation items often block review and K-1 delivery.',
        sourceHint: 'Bookkeeping close',
      }),
      checklistItem({
        id: 'owner-changes',
        label: 'Owner changes',
        description:
          'Confirm partner/shareholder ownership, capital, address, and compensation changes.',
        reason: 'K-1 allocation and entity facts depend on current owner data.',
        sourceHint: 'Owner approval',
      }),
      checklistItem({
        id: 'k1-delivery-approval',
        label: 'K-1 delivery approval',
        description: 'Confirm who approves final K-1 packages and how they should be delivered.',
        reason: 'Downstream individual and trust returns may be blocked until K-1s are issued.',
        sourceHint: 'Partner or shareholder approval',
      }),
      basePaymentChecklist(taxType),
    ]
  }

  if (normalized.includes('1120') || normalized.includes('c_corp')) {
    return [
      checklistItem({
        id: 'trial-balance',
        label: 'Trial balance',
        description:
          'Upload the year-end trial balance, general ledger detail, and adjusting entries.',
        reason: 'Corporate return prep depends on final books and tax adjustment support.',
        sourceHint: 'Accounting system export',
      }),
      checklistItem({
        id: 'balance-sheet-support',
        label: 'Balance sheet support',
        description: 'Upload fixed asset, loan, equity, and retained earnings support.',
        reason: 'Corporate review needs balance sheet support before e-file authorization.',
        sourceHint: 'Bookkeeping close',
      }),
      checklistItem({
        id: '8879-corp-authorization',
        label: '8879-CORP authorization contact',
        description: 'Confirm the signer and delivery method for e-file authorization.',
        reason: 'E-file submission evidence depends on signed authorization.',
        sourceHint: 'Officer approval',
      }),
      basePaymentChecklist(taxType),
    ]
  }

  if (
    normalized.includes('1041') ||
    normalized.includes('trust') ||
    normalized.includes('estate')
  ) {
    return [
      checklistItem({
        id: 'fiduciary-income',
        label: 'Fiduciary income documents',
        description: 'Upload 1099s, brokerage statements, K-1s, and sale transaction support.',
        reason: 'Trust and estate return prep depends on fiduciary income source documents.',
        sourceHint: 'Fiduciary records',
      }),
      checklistItem({
        id: 'beneficiary-information',
        label: 'Beneficiary information',
        description: 'Confirm beneficiary names, addresses, tax IDs, and distribution details.',
        reason: 'Schedule K-1 preparation requires current beneficiary facts.',
        sourceHint: 'Fiduciary approval',
      }),
      basePaymentChecklist(taxType),
    ]
  }

  if (normalized.includes('941') || normalized.includes('940') || normalized.includes('payroll')) {
    return [
      checklistItem({
        id: 'payroll-reports',
        label: 'Payroll reports',
        description:
          'Upload quarter or year-end payroll register, tax liability, and wage reports.',
        reason: 'Payroll returns and deposit schedules must be tracked separately.',
        sourceHint: 'Payroll provider',
      }),
      checklistItem({
        id: 'deposit-confirmations',
        label: 'Deposit confirmations',
        description: 'Upload EFTPS or payroll provider deposit confirmations.',
        reason: 'Deposit evidence is separate from return filing evidence.',
        sourceHint: 'EFTPS or payroll provider',
      }),
      checklistItem({
        id: 'payroll-adjustments',
        label: 'Payroll adjustments',
        description: 'Confirm voids, corrections, fringe benefits, and owner payroll adjustments.',
        reason: 'Adjustments can change return totals or require review notes.',
        sourceHint: 'Payroll close',
      }),
    ]
  }

  if (normalized.includes('1099') || normalized.includes('w_2') || normalized.includes('w2')) {
    return [
      checklistItem({
        id: 'payee-list',
        label: 'Payee list',
        description: 'Upload vendor or employee recipient list with addresses and payment totals.',
        reason: 'Information return workflows require recipient and IRS filing evidence.',
        sourceHint: 'Accounting or payroll export',
      }),
      checklistItem({
        id: 'tin-support',
        label: 'TIN support',
        description: 'Upload W-9s or confirm missing TIN follow-up status.',
        reason: 'TIN gaps can block filing or require exception review.',
        sourceHint: 'W-9 records',
      }),
      checklistItem({
        id: 'recipient-delivery',
        label: 'Recipient delivery',
        description: 'Confirm recipient copy delivery method and date.',
        reason: 'Recipient delivery is a tracked information return workflow step.',
        sourceHint: 'Filing provider evidence',
      }),
    ]
  }

  if (
    normalized.includes('fbar') ||
    normalized.includes('8938') ||
    normalized.includes('5471') ||
    normalized.includes('5472') ||
    normalized.includes('8865') ||
    normalized.includes('8858') ||
    normalized.includes('3520') ||
    normalized.includes('foreign')
  ) {
    return [
      checklistItem({
        id: 'foreign-account-list',
        label: 'Foreign account list',
        description:
          'Upload account names, institutions, countries, account numbers, and maximum values.',
        reason: 'High-risk foreign reporting needs explicit source facts and review sign-off.',
        sourceHint: 'Client foreign account records',
      }),
      checklistItem({
        id: 'foreign-ownership',
        label: 'Foreign ownership facts',
        description: 'Confirm ownership percentages, related parties, and entity activity.',
        reason: 'Foreign information forms are tracked as high-risk obligations.',
        sourceHint: 'Client attestation',
      }),
      checklistItem({
        id: 'partner-risk-review',
        label: 'Partner risk review',
        description: 'Assign partner review for high-risk foreign reporting facts.',
        reason: 'Foreign reporting workflows require human verification before reminders.',
        sourceHint: 'Internal review',
      }),
    ]
  }

  if (normalized.includes('990') || normalized.includes('nonprofit')) {
    return [
      checklistItem({
        id: 'financial-statements',
        label: 'Financial statements',
        description:
          'Upload year-end financial statements, revenue detail, and expense classifications.',
        reason:
          'Exempt organization return type and readiness depend on gross receipts and assets.',
        sourceHint: 'Nonprofit books',
      }),
      checklistItem({
        id: 'governance-changes',
        label: 'Governance changes',
        description:
          'Confirm officers, directors, key employees, grants, and related-party changes.',
        reason: '990-series review needs governance facts before final package delivery.',
        sourceHint: 'Board records',
      }),
      checklistItem({
        id: 'public-disclosure',
        label: 'Public disclosure package',
        description: 'Confirm who receives the final public disclosure copy.',
        reason: 'Delivery evidence is separate from return filing acceptance.',
        sourceHint: 'Client approval',
      }),
    ]
  }

  if (normalized.includes('sales_tax') || normalized.includes('sales')) {
    return [
      checklistItem({
        id: 'sales-tax-reports',
        label: 'Sales tax reports',
        description: 'Upload taxable sales, exempt sales, marketplace, and jurisdiction reports.',
        reason: 'State and local sales tax deadlines should not default to federal timing.',
        sourceHint: 'POS or accounting export',
      }),
      checklistItem({
        id: 'jurisdiction-confirmation',
        label: 'Jurisdiction confirmation',
        description: 'Confirm filing jurisdictions, local returns, and account IDs.',
        reason: 'State and local obligations need explicit jurisdiction facts.',
        sourceHint: 'Practice custom deadline',
      }),
      basePaymentChecklist(taxType),
    ]
  }

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
  return items.slice(0, 8).map(
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
