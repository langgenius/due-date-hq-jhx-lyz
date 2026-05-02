import { ORPCError } from '@orpc/server'
import { zipSync } from 'fflate'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import type { WorkboardRow } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import { OBLIGATION_STATUS_WRITE_ROLES, requireCurrentFirmRole } from '../_permissions'
import { os } from '../_root'

/**
 * workboard.* — read-only firm-wide obligation queue.
 *
 * Mutations (status / due date) live in `obligationsContract` so each
 * entity has exactly one canonical write surface.
 */

interface RawRow {
  id: string
  firmId: string
  clientId: string
  taxType: string
  taxYear: number | null
  baseDueDate: Date
  currentDueDate: Date
  status: WorkboardRow['status']
  migrationBatchId: string | null
  estimatedTaxDueCents: number | null
  estimatedExposureCents: number | null
  exposureStatus: WorkboardRow['exposureStatus']
  penaltyBreakdownJson: unknown
  penaltyFormulaVersion: string | null
  exposureCalculatedAt: Date | null
  createdAt: Date
  updatedAt: Date
  clientName: string
  clientState: string | null
  clientCounty: string | null
  assigneeName: string | null
  readiness: WorkboardRow['readiness']
  daysUntilDue: number
  evidenceCount: number
}

interface SavedViewRow {
  id: string
  firmId: string
  createdByUserId: string
  name: string
  queryJson: unknown
  columnVisibilityJson: unknown
  density: 'comfortable' | 'compact'
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

const STATE_CODE_RE = /^[A-Z]{2}$/

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeStateCode(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase()
  return normalized && STATE_CODE_RE.test(normalized) ? normalized : null
}

function normalizeNullableText(value: string | null): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function toRow(row: RawRow, opts: { hideDollars?: boolean } = {}): WorkboardRow {
  return {
    id: row.id,
    firmId: row.firmId,
    clientId: row.clientId,
    taxType: row.taxType,
    taxYear: row.taxYear,
    baseDueDate: toIsoDate(row.baseDueDate),
    currentDueDate: toIsoDate(row.currentDueDate),
    status: row.status,
    migrationBatchId: row.migrationBatchId,
    estimatedTaxDueCents: opts.hideDollars ? null : row.estimatedTaxDueCents,
    estimatedExposureCents: opts.hideDollars ? null : row.estimatedExposureCents,
    exposureStatus: row.exposureStatus,
    penaltyBreakdown: parsePenaltyBreakdown(row.penaltyBreakdownJson),
    penaltyFormulaVersion: row.penaltyFormulaVersion,
    exposureCalculatedAt: row.exposureCalculatedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    clientName: row.clientName,
    clientState: normalizeStateCode(row.clientState),
    clientCounty: normalizeNullableText(row.clientCounty),
    assigneeName: row.assigneeName?.trim() || null,
    readiness: row.readiness,
    daysUntilDue: row.daysUntilDue,
    evidenceCount: row.evidenceCount,
  }
}

function toSavedView(row: SavedViewRow) {
  return {
    id: row.id,
    firmId: row.firmId,
    createdByUserId: row.createdByUserId,
    name: row.name,
    query: isRecord(row.queryJson) ? row.queryJson : {},
    columnVisibility: normalizeColumnVisibility(row.columnVisibilityJson),
    density: row.density,
    isPinned: row.isPinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function parsePenaltyBreakdown(value: unknown): WorkboardRow['penaltyBreakdown'] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    const key = item.key
    const label = item.label
    const amountCents = item.amountCents
    const formula = item.formula
    if (
      typeof key !== 'string' ||
      typeof label !== 'string' ||
      typeof amountCents !== 'number' ||
      typeof formula !== 'string'
    ) {
      return []
    }
    return [
      {
        key,
        label,
        amountCents,
        formula,
      },
    ]
  })
}

function normalizeColumnVisibility(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, next]) =>
      typeof next === 'boolean' ? [[key, next]] : [],
    ),
  )
}

function dateInTimezone(timezone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
}

function csvCell(value: unknown): string {
  let raw = ''
  if (typeof value === 'string') raw = value
  else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    raw = value.toString()
  } else if (value instanceof Date) raw = value.toISOString()
  else if (typeof value === 'object' && value !== null) raw = JSON.stringify(value)
  return `"${raw.replaceAll('"', '""')}"`
}

function rowsToCsv(rows: WorkboardRow[]): string {
  const body = rows.map((row) => [
    row.clientName,
    row.assigneeName ?? '',
    row.clientState ?? '',
    row.clientCounty ?? '',
    row.taxType,
    row.currentDueDate,
    row.daysUntilDue,
    row.estimatedExposureCents === null ? '' : row.estimatedExposureCents,
    row.exposureStatus,
    row.status,
    row.readiness,
    row.evidenceCount,
  ])
  return [
    [
      'Client',
      'Owner',
      'State',
      'County',
      'Tax type',
      'Current due',
      'Days until due',
      'Exposure cents',
      'Exposure status',
      'Status',
      'Readiness',
      'Evidence count',
    ],
    ...body,
  ]
    .map((row) => row.map(csvCell).join(','))
    .join('\n')
}

function base64Bytes(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

function base64Text(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64')
}

async function buildClientPdf(clientName: string, rows: WorkboardRow[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([612, 792])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  page.drawText('DueDateHQ Workboard Export', { x: 72, y: 720, font: bold, size: 16 })
  page.drawText(clientName, { x: 72, y: 692, font: bold, size: 12 })
  const lines = rows.slice(0, 24).map((row) => {
    const exposure =
      row.estimatedExposureCents === null
        ? row.exposureStatus
        : `$${row.estimatedExposureCents / 100}`
    return `${row.taxType} | due ${row.currentDueDate} | ${row.status} | ${exposure}`
  })
  lines.forEach((line, index) => {
    page.drawText(line.slice(0, 92), { x: 72, y: 660 - index * 20, font, size: 10 })
  })
  return pdf.save()
}

const list = os.workboard.list.handler(async ({ input, context }) => {
  const { scoped, tenant, userId } = requireTenant(context)
  const actor = await context.vars.members?.findMembership(tenant.firmId, userId)
  const hideDollars = actor?.role === 'coordinator' && !tenant.coordinatorCanSeeDollars

  const repoInput: NonNullable<Parameters<typeof scoped.workboard.list>[0]> = {}
  if (input.status !== undefined) repoInput.status = input.status
  if (input.search !== undefined) repoInput.search = input.search
  if (input.clientIds !== undefined) repoInput.clientIds = input.clientIds
  if (input.states !== undefined) repoInput.states = input.states
  if (input.counties !== undefined) repoInput.counties = input.counties
  if (input.taxTypes !== undefined) repoInput.taxTypes = input.taxTypes
  if (input.assigneeName !== undefined) repoInput.assigneeName = input.assigneeName
  if (input.assigneeNames !== undefined) repoInput.assigneeNames = input.assigneeNames
  if (input.owner !== undefined) repoInput.owner = input.owner
  if (input.due !== undefined) repoInput.due = input.due
  if (input.dueWithinDays !== undefined) repoInput.dueWithinDays = input.dueWithinDays
  if (input.exposureStatus !== undefined) repoInput.exposureStatus = input.exposureStatus
  if (input.readiness !== undefined) repoInput.readiness = input.readiness
  if (!hideDollars && input.minExposureCents !== undefined) {
    repoInput.minExposureCents = input.minExposureCents
  }
  if (!hideDollars && input.maxExposureCents !== undefined) {
    repoInput.maxExposureCents = input.maxExposureCents
  }
  if (input.minDaysUntilDue !== undefined) repoInput.minDaysUntilDue = input.minDaysUntilDue
  if (input.maxDaysUntilDue !== undefined) repoInput.maxDaysUntilDue = input.maxDaysUntilDue
  if (input.needsEvidence !== undefined) repoInput.needsEvidence = input.needsEvidence
  if (input.asOfDate !== undefined) repoInput.asOfDate = input.asOfDate
  if (input.sort !== undefined) repoInput.sort = input.sort
  if (input.cursor !== undefined) repoInput.cursor = input.cursor
  if (input.limit !== undefined) repoInput.limit = input.limit

  const result = await scoped.workboard.list(repoInput)

  return {
    rows: result.rows.map((row) => toRow(row, { hideDollars })),
    nextCursor: result.nextCursor,
  }
})

const facets = os.workboard.facets.handler(async ({ context }) => {
  const { scoped } = requireTenant(context)
  return scoped.workboard.facets()
})

const listSavedViews = os.workboard.listSavedViews.handler(async ({ context }) => {
  const { scoped } = requireTenant(context)
  return (await scoped.workboard.listSavedViews()).map(toSavedView)
})

const createSavedView = os.workboard.createSavedView.handler(async ({ input, context }) => {
  const { tenant, userId } = await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped } = requireTenant(context)
  const row = await scoped.workboard.createSavedView({
    name: input.name,
    createdByUserId: userId,
    queryJson: input.query,
    columnVisibilityJson: input.columnVisibility ?? {},
    density: input.density ?? 'comfortable',
    isPinned: input.isPinned ?? false,
  })
  await scoped.audit.write({
    actorId: userId,
    entityType: 'workboard_saved_view',
    entityId: row.id,
    action: 'workboard.saved_view.created',
    after: { name: row.name, firmId: tenant.firmId },
  })
  return toSavedView(row)
})

const updateSavedView = os.workboard.updateSavedView.handler(async ({ input, context }) => {
  const { userId } = await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped } = requireTenant(context)
  const row = await scoped.workboard.updateSavedView({
    id: input.id,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.query !== undefined ? { queryJson: input.query } : {}),
    ...(input.columnVisibility !== undefined
      ? { columnVisibilityJson: input.columnVisibility }
      : {}),
    ...(input.density !== undefined ? { density: input.density } : {}),
    ...(input.isPinned !== undefined ? { isPinned: input.isPinned } : {}),
  })
  await scoped.audit.write({
    actorId: userId,
    entityType: 'workboard_saved_view',
    entityId: row.id,
    action: 'workboard.saved_view.updated',
    after: { name: row.name, isPinned: row.isPinned },
  })
  return toSavedView(row)
})

const deleteSavedView = os.workboard.deleteSavedView.handler(async ({ input, context }) => {
  const { userId } = await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped } = requireTenant(context)
  await scoped.workboard.deleteSavedView(input.id)
  await scoped.audit.write({
    actorId: userId,
    entityType: 'workboard_saved_view',
    entityId: input.id,
    action: 'workboard.saved_view.deleted',
  })
  return { id: input.id }
})

const exportSelected = os.workboard.exportSelected.handler(async ({ input, context }) => {
  const { tenant, userId } = await requireCurrentFirmRole(context, OBLIGATION_STATUS_WRITE_ROLES)
  const { scoped } = requireTenant(context)
  const actor = await context.vars.members?.findMembership(tenant.firmId, userId)
  const hideDollars = actor?.role === 'coordinator' && !tenant.coordinatorCanSeeDollars
  const selectedIds = [...new Set(input.ids)]
  const rawRows = await scoped.workboard.listByIds(selectedIds, {
    asOfDate: dateInTimezone(tenant.timezone),
  })
  if (rawRows.length !== selectedIds.length) {
    throw new ORPCError('NOT_FOUND', {
      message: 'One or more selected obligations were not found in the current firm.',
    })
  }
  const rows = rawRows.map((row) => toRow(row, { hideDollars }))
  const { id: auditId } = await scoped.audit.write({
    actorId: userId,
    entityType: 'workboard_export',
    entityId: selectedIds[0] ?? 'empty',
    action: 'workboard.exported',
    after: {
      format: input.format,
      rowCount: rows.length,
      clientCount: new Set(rows.map((row) => row.clientId)).size,
    },
  })

  if (input.format === 'csv') {
    return {
      fileName: `workboard-${dateInTimezone(tenant.timezone)}.csv`,
      contentType: 'text/csv',
      contentBase64: base64Text(rowsToCsv(rows)),
      auditId,
    }
  }

  const rowsByClient = new Map<string, { clientName: string; rows: WorkboardRow[] }>()
  for (const row of rows) {
    const bucket = rowsByClient.get(row.clientId) ?? { clientName: row.clientName, rows: [] }
    bucket.rows.push(row)
    rowsByClient.set(row.clientId, bucket)
  }
  const files = Object.fromEntries(
    await Promise.all(
      Array.from(rowsByClient, async ([clientId, { clientName, rows: clientRows }]) => {
        const safeName = clientName.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '') || 'client'
        return [
          `${safeName}-${clientId.slice(0, 8)}.pdf`,
          await buildClientPdf(clientName, clientRows),
        ] as const
      }),
    ),
  )
  const zip = zipSync(files, { level: 6 })
  return {
    fileName: `workboard-pdfs-${dateInTimezone(tenant.timezone)}.zip`,
    contentType: 'application/zip',
    contentBase64: base64Bytes(zip),
    auditId,
  }
})

export const workboardHandlers = {
  list,
  facets,
  listSavedViews,
  createSavedView,
  updateSavedView,
  deleteSavedView,
  exportSelected,
}
