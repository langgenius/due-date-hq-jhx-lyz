import { and, asc, desc, eq, gte, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { Db } from '../client'
import { evidenceLink } from '../schema/audit'
import { client } from '../schema/clients'
import { obligationInstance, type ObligationStatus } from '../schema/obligations'
import { listActiveOverlayDueDates } from './overlay'

/**
 * workboard — read model joining obligation_instance + client.
 *
 * Why this lives in its own repo (and not in obligations):
 *   - The workboard query crosses two tables (obligation + client.name) and
 *     is read-only. obligations.* stays focused on writes + per-client reads.
 *   - Keeps the join SQL out of the obligation write path, so future
 *     overlay logic (Phase 1) can replace this read alone.
 *
 * Cursor format: base64(`${ISO_DATE}|${id}`). Decoded into (currentDueDate,
 * id) for keyset pagination. We only paginate on the primary sort column
 * (currentDueDate); `updated_desc` falls back to offset-less single page in
 * Demo Sprint (limit caps at 100 per request).
 */

export type WorkboardSort = 'due_asc' | 'due_desc' | 'updated_desc'
export type WorkboardReadiness = 'ready' | 'waiting' | 'needs_review'

export interface WorkboardListInput {
  status?: ObligationStatus[]
  search?: string
  clientIds?: string[]
  states?: string[]
  counties?: string[]
  taxTypes?: string[]
  assigneeName?: string
  assigneeNames?: string[]
  owner?: 'unassigned'
  due?: 'overdue'
  dueWithinDays?: number
  exposureStatus?: 'ready' | 'needs_input' | 'unsupported'
  readiness?: WorkboardReadiness[]
  minExposureCents?: number
  maxExposureCents?: number
  minDaysUntilDue?: number
  maxDaysUntilDue?: number
  needsEvidence?: boolean
  asOfDate?: string
  sort?: WorkboardSort
  cursor?: string | null
  limit?: number
}

export interface WorkboardListRow {
  id: string
  firmId: string
  clientId: string
  taxType: string
  taxYear: number | null
  baseDueDate: Date
  currentDueDate: Date
  status: ObligationStatus
  migrationBatchId: string | null
  estimatedTaxDueCents: number | null
  estimatedExposureCents: number | null
  exposureStatus: 'ready' | 'needs_input' | 'unsupported'
  penaltyBreakdownJson: unknown
  penaltyFormulaVersion: string | null
  exposureCalculatedAt: Date | null
  createdAt: Date
  updatedAt: Date
  clientName: string
  clientState: string | null
  clientCounty: string | null
  assigneeName: string | null
  readiness: WorkboardReadiness
  daysUntilDue: number
  evidenceCount: number
}

export interface WorkboardListResult {
  rows: WorkboardListRow[]
  nextCursor: string | null
}

export interface WorkboardFacetOption {
  value: string
  label: string
  count: number
}

export interface WorkboardClientFacetOption extends WorkboardFacetOption {
  state: string | null
  county: string | null
}

export interface WorkboardCountyFacetOption extends WorkboardFacetOption {
  state: string | null
}

export interface WorkboardFacetsOutput {
  clients: WorkboardClientFacetOption[]
  states: WorkboardFacetOption[]
  counties: WorkboardCountyFacetOption[]
  taxTypes: WorkboardFacetOption[]
  assigneeNames: WorkboardFacetOption[]
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100
const MAX_READ_ROWS = 1000
const MAX_FACET_OPTIONS = 250
const EVIDENCE_COUNT_BATCH_SIZE = 90
const MAX_SEARCH_LENGTH = 64
const LIKE_WILDCARD_RE = /[\\%_]/g
const UNSAFE_SEARCH_CHARS_RE = /[^\p{L}\p{N}\s&'.-]+/gu
const DAY_MS = 24 * 60 * 60 * 1000
const STATE_CODE_RE = /^[A-Z]{2}$/

export function normalizeWorkboardSearch(search: string | undefined): string | null {
  const normalized = (search ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(UNSAFE_SEARCH_CHARS_RE, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_SEARCH_LENGTH)
    .trim()

  return normalized.length > 0 ? normalized : null
}

function escapeLikePattern(value: string): string {
  return value.replace(LIKE_WILDCARD_RE, '\\$&')
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10)
}

function getAsOfDate(input: Pick<WorkboardListInput, 'asOfDate'>): Date {
  return parseDateOnly(input.asOfDate ?? todayDateOnly())
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

function encodeCursor(row: { currentDueDate: Date; id: string }): string {
  const iso = row.currentDueDate.toISOString()
  return Buffer.from(`${iso}|${row.id}`, 'utf8').toString('base64url')
}

function decodeCursor(cursor: string): { currentDueDate: Date; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8')
    const [iso, id] = raw.split('|')
    if (!iso || !id) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return { currentDueDate: d, id }
  } catch {
    return null
  }
}

function isWithinDueFilter(
  row: { currentDueDate: Date },
  input: Pick<WorkboardListInput, 'due' | 'dueWithinDays' | 'asOfDate'>,
): boolean {
  const asOfDate = getAsOfDate(input)
  if (input.due === 'overdue' && row.currentDueDate.getTime() >= asOfDate.getTime()) return false
  if (input.dueWithinDays !== undefined) {
    const due = row.currentDueDate.getTime()
    if (due < asOfDate.getTime() || due > addDays(asOfDate, input.dueWithinDays).getTime()) {
      return false
    }
  }
  return true
}

function daysUntilDue(currentDueDate: Date, asOfDate: Date): number {
  return Math.floor((currentDueDate.getTime() - asOfDate.getTime()) / DAY_MS)
}

function deriveReadiness(row: {
  status: ObligationStatus
  exposureStatus: 'ready' | 'needs_input' | 'unsupported'
}): WorkboardReadiness {
  if (row.status === 'waiting_on_client') return 'waiting'
  if (row.status === 'review' || row.exposureStatus !== 'ready') return 'needs_review'
  return 'ready'
}

function isWithinDaysRange(
  row: Pick<WorkboardListRow, 'daysUntilDue'>,
  input: Pick<WorkboardListInput, 'minDaysUntilDue' | 'maxDaysUntilDue'>,
): boolean {
  if (input.minDaysUntilDue !== undefined && row.daysUntilDue < input.minDaysUntilDue) return false
  if (input.maxDaysUntilDue !== undefined && row.daysUntilDue > input.maxDaysUntilDue) return false
  return true
}

function uniqueNonEmpty(values: (string | null | undefined)[] | undefined): string[] {
  return [
    ...new Set(
      (values ?? [])
        .map((value) => value?.trim())
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  ]
}

function normalizeStateCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase()
  return normalized && STATE_CODE_RE.test(normalized) ? normalized : null
}

function normalizeNullableText(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function compareFacetLabels(
  a: { label: string; value: string },
  b: { label: string; value: string },
) {
  const labelDelta = a.label.localeCompare(b.label)
  if (labelDelta !== 0) return labelDelta
  return a.value.localeCompare(b.value)
}

function compareRows(a: WorkboardListRow, b: WorkboardListRow, sort: WorkboardSort): number {
  if (sort === 'updated_desc') {
    const updatedDelta = b.updatedAt.getTime() - a.updatedAt.getTime()
    if (updatedDelta !== 0) return updatedDelta
    return b.id.localeCompare(a.id)
  }
  const direction = sort === 'due_desc' ? -1 : 1
  const dateDelta = a.currentDueDate.getTime() - b.currentDueDate.getTime()
  if (dateDelta !== 0) return dateDelta * direction
  return a.id.localeCompare(b.id) * direction
}

function isAfterCursor(
  row: WorkboardListRow,
  sort: WorkboardSort,
  cursor: { currentDueDate: Date; id: string },
): boolean {
  if (sort === 'updated_desc') return true
  const dateDelta = row.currentDueDate.getTime() - cursor.currentDueDate.getTime()
  if (sort === 'due_desc') return dateDelta < 0 || (dateDelta === 0 && row.id < cursor.id)
  return dateDelta > 0 || (dateDelta === 0 && row.id > cursor.id)
}

export function makeWorkboardRepo(db: Db, firmId: string) {
  async function listEvidenceCounts(obligationIds: string[]): Promise<Map<string, number>> {
    if (obligationIds.length === 0) return new Map()
    const reads = []
    for (let i = 0; i < obligationIds.length; i += EVIDENCE_COUNT_BATCH_SIZE) {
      const chunk = obligationIds.slice(i, i + EVIDENCE_COUNT_BATCH_SIZE)
      reads.push(
        db
          .select({
            obligationInstanceId: evidenceLink.obligationInstanceId,
          })
          .from(evidenceLink)
          .where(
            and(eq(evidenceLink.firmId, firmId), inArray(evidenceLink.obligationInstanceId, chunk)),
          ),
      )
    }
    const rows = (await Promise.all(reads)).flat()

    const counts = new Map<string, number>()
    for (const row of rows) {
      if (!row.obligationInstanceId) continue
      counts.set(row.obligationInstanceId, (counts.get(row.obligationInstanceId) ?? 0) + 1)
    }
    return counts
  }

  return {
    firmId,

    async list(input: WorkboardListInput = {}): Promise<WorkboardListResult> {
      const sort: WorkboardSort = input.sort ?? 'due_asc'
      const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)
      const asOfDate = getAsOfDate(input)

      const filters: SQL[] = [eq(obligationInstance.firmId, firmId)]

      if (input.status && input.status.length > 0) {
        filters.push(inArray(obligationInstance.status, input.status))
      }

      const clientIds = uniqueNonEmpty(input.clientIds)
      if (clientIds.length > 0) {
        filters.push(inArray(obligationInstance.clientId, clientIds))
      }

      const states = uniqueNonEmpty(input.states)
        .map((value) => normalizeStateCode(value))
        .filter((value): value is string => value !== null)
      if (states.length > 0) {
        filters.push(inArray(client.state, states))
      }

      const counties = uniqueNonEmpty(input.counties)
      if (counties.length > 0) {
        filters.push(inArray(client.county, counties))
      }

      const taxTypes = uniqueNonEmpty(input.taxTypes)
      if (taxTypes.length > 0) {
        filters.push(inArray(obligationInstance.taxType, taxTypes))
      }

      const assigneeNames = uniqueNonEmpty([input.assigneeName, ...(input.assigneeNames ?? [])])
      if (assigneeNames.length > 0) {
        filters.push(inArray(client.assigneeName, assigneeNames))
      }

      if (input.owner === 'unassigned') {
        filters.push(or(isNull(client.assigneeName), eq(client.assigneeName, ''))!)
      }

      if (input.exposureStatus) {
        filters.push(eq(obligationInstance.exposureStatus, input.exposureStatus))
      }

      if (input.minExposureCents !== undefined) {
        filters.push(gte(obligationInstance.estimatedExposureCents, input.minExposureCents))
      }

      if (input.maxExposureCents !== undefined) {
        filters.push(lte(obligationInstance.estimatedExposureCents, input.maxExposureCents))
      }

      const search = normalizeWorkboardSearch(input.search)
      if (search) {
        const needle = `%${escapeLikePattern(search)}%`
        filters.push(sql`${client.name} like ${needle} escape '\\'`)
      }

      const orderBy =
        sort === 'due_desc'
          ? [desc(obligationInstance.currentDueDate), desc(obligationInstance.id)]
          : sort === 'updated_desc'
            ? [desc(obligationInstance.updatedAt), desc(obligationInstance.id)]
            : [asc(obligationInstance.currentDueDate), asc(obligationInstance.id)]

      const rawRows = await db
        .select({
          id: obligationInstance.id,
          firmId: obligationInstance.firmId,
          clientId: obligationInstance.clientId,
          taxType: obligationInstance.taxType,
          taxYear: obligationInstance.taxYear,
          baseDueDate: obligationInstance.baseDueDate,
          currentDueDate: obligationInstance.currentDueDate,
          status: obligationInstance.status,
          migrationBatchId: obligationInstance.migrationBatchId,
          estimatedTaxDueCents: obligationInstance.estimatedTaxDueCents,
          estimatedExposureCents: obligationInstance.estimatedExposureCents,
          exposureStatus: obligationInstance.exposureStatus,
          penaltyBreakdownJson: obligationInstance.penaltyBreakdownJson,
          penaltyFormulaVersion: obligationInstance.penaltyFormulaVersion,
          exposureCalculatedAt: obligationInstance.exposureCalculatedAt,
          createdAt: obligationInstance.createdAt,
          updatedAt: obligationInstance.updatedAt,
          clientName: client.name,
          clientState: client.state,
          clientCounty: client.county,
          assigneeName: client.assigneeName,
        })
        .from(obligationInstance)
        .innerJoin(client, eq(obligationInstance.clientId, client.id))
        .where(and(...filters))
        .orderBy(...orderBy)
        .limit(MAX_READ_ROWS)

      const overlayDueDates = await listActiveOverlayDueDates(
        db,
        firmId,
        rawRows.map((row) => row.id),
      )
      const evidenceCounts = await listEvidenceCounts(rawRows.map((row) => row.id))
      const decodedCursor =
        sort !== 'updated_desc' && input.cursor ? decodeCursor(input.cursor) : null
      const rows = rawRows
        .map((row): WorkboardListRow => {
          const currentDueDate = overlayDueDates.get(row.id) ?? row.currentDueDate
          return Object.assign({}, row, {
            currentDueDate,
            evidenceCount: evidenceCounts.get(row.id) ?? 0,
            clientState: normalizeStateCode(row.clientState),
            clientCounty: normalizeNullableText(row.clientCounty),
            readiness: deriveReadiness(row),
            daysUntilDue: daysUntilDue(currentDueDate, asOfDate),
          })
        })
        .filter((row) => isWithinDueFilter(row, input))
        .filter((row) => isWithinDaysRange(row, input))
        .filter((row) =>
          input.readiness && input.readiness.length > 0
            ? input.readiness.includes(row.readiness)
            : true,
        )
        .filter((row) => (input.needsEvidence ? row.evidenceCount === 0 : true))
        .toSorted((a, b) => compareRows(a, b, sort))
        .filter((row) => (decodedCursor ? isAfterCursor(row, sort, decodedCursor) : true))

      const hasMore = rows.length > limit
      const pageRows = hasMore ? rows.slice(0, limit) : rows
      const lastRow = pageRows[pageRows.length - 1]
      const nextCursor =
        hasMore && lastRow && sort !== 'updated_desc'
          ? encodeCursor({ currentDueDate: lastRow.currentDueDate, id: lastRow.id })
          : null

      return {
        rows: pageRows,
        nextCursor,
      }
    },

    async facets(): Promise<WorkboardFacetsOutput> {
      const rawRows = await db
        .select({
          clientId: obligationInstance.clientId,
          clientName: client.name,
          clientState: client.state,
          clientCounty: client.county,
          taxType: obligationInstance.taxType,
          assigneeName: client.assigneeName,
        })
        .from(obligationInstance)
        .innerJoin(client, eq(obligationInstance.clientId, client.id))
        .where(eq(obligationInstance.firmId, firmId))
        .orderBy(asc(client.name), asc(obligationInstance.taxType))
        .limit(MAX_READ_ROWS)

      const clients = new Map<string, WorkboardClientFacetOption>()
      const states = new Map<string, WorkboardFacetOption>()
      const counties = new Map<string, WorkboardCountyFacetOption>()
      const taxTypes = new Map<string, WorkboardFacetOption>()
      const assigneeNames = new Map<string, WorkboardFacetOption>()

      for (const row of rawRows) {
        const clientState = normalizeStateCode(row.clientState)
        const clientCounty = normalizeNullableText(row.clientCounty)
        const assigneeName = normalizeNullableText(row.assigneeName)

        const clientFacet = clients.get(row.clientId)
        if (clientFacet) {
          clientFacet.count += 1
        } else {
          clients.set(row.clientId, {
            value: row.clientId,
            label: row.clientName,
            count: 1,
            state: clientState,
            county: clientCounty,
          })
        }

        if (clientState) {
          const stateFacet = states.get(clientState)
          if (stateFacet) {
            stateFacet.count += 1
          } else {
            states.set(clientState, { value: clientState, label: clientState, count: 1 })
          }
        }

        if (clientCounty) {
          const countyKey = `${clientState ?? ''}|${clientCounty}`
          const countyFacet = counties.get(countyKey)
          if (countyFacet) {
            countyFacet.count += 1
          } else {
            counties.set(countyKey, {
              value: clientCounty,
              label: clientState ? `${clientCounty}, ${clientState}` : clientCounty,
              count: 1,
              state: clientState,
            })
          }
        }

        const taxTypeFacet = taxTypes.get(row.taxType)
        if (taxTypeFacet) {
          taxTypeFacet.count += 1
        } else {
          taxTypes.set(row.taxType, { value: row.taxType, label: row.taxType, count: 1 })
        }

        if (assigneeName) {
          const assigneeFacet = assigneeNames.get(assigneeName)
          if (assigneeFacet) {
            assigneeFacet.count += 1
          } else {
            assigneeNames.set(assigneeName, {
              value: assigneeName,
              label: assigneeName,
              count: 1,
            })
          }
        }
      }

      return {
        clients: [...clients.values()].toSorted(compareFacetLabels).slice(0, MAX_FACET_OPTIONS),
        states: [...states.values()].toSorted(compareFacetLabels).slice(0, MAX_FACET_OPTIONS),
        counties: [...counties.values()].toSorted(compareFacetLabels).slice(0, MAX_FACET_OPTIONS),
        taxTypes: [...taxTypes.values()].toSorted(compareFacetLabels).slice(0, MAX_FACET_OPTIONS),
        assigneeNames: [...assigneeNames.values()]
          .toSorted(compareFacetLabels)
          .slice(0, MAX_FACET_OPTIONS),
      }
    },
  }
}

export type WorkboardRepo = ReturnType<typeof makeWorkboardRepo>
