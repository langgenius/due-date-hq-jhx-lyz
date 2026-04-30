import { and, asc, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
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

export interface WorkboardListInput {
  status?: ObligationStatus[]
  search?: string
  assigneeName?: string
  owner?: 'unassigned'
  due?: 'overdue'
  dueWithinDays?: number
  exposureStatus?: 'ready' | 'needs_input' | 'unsupported'
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
  assigneeName: string | null
  evidenceCount: number
}

export interface WorkboardListResult {
  rows: WorkboardListRow[]
  nextCursor: string | null
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100
const MAX_READ_ROWS = 1000
const EVIDENCE_COUNT_BATCH_SIZE = 90
const MAX_SEARCH_LENGTH = 64
const LIKE_WILDCARD_RE = /[\\%_]/g
const UNSAFE_SEARCH_CHARS_RE = /[^\p{L}\p{N}\s&'.-]+/gu
const DAY_MS = 24 * 60 * 60 * 1000

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
  const asOfDate = parseDateOnly(input.asOfDate ?? todayDateOnly())
  if (input.due === 'overdue' && row.currentDueDate.getTime() >= asOfDate.getTime()) return false
  if (input.dueWithinDays !== undefined) {
    const due = row.currentDueDate.getTime()
    if (due < asOfDate.getTime() || due > addDays(asOfDate, input.dueWithinDays).getTime()) {
      return false
    }
  }
  return true
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

      const filters: SQL[] = [eq(obligationInstance.firmId, firmId)]

      if (input.status && input.status.length > 0) {
        filters.push(inArray(obligationInstance.status, input.status))
      }

      if (input.assigneeName) {
        filters.push(eq(client.assigneeName, input.assigneeName))
      }

      if (input.owner === 'unassigned') {
        filters.push(or(isNull(client.assigneeName), eq(client.assigneeName, ''))!)
      }

      if (input.exposureStatus) {
        filters.push(eq(obligationInstance.exposureStatus, input.exposureStatus))
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
        .map(
          (row): WorkboardListRow =>
            Object.assign({}, row, {
              currentDueDate: overlayDueDates.get(row.id) ?? row.currentDueDate,
              evidenceCount: evidenceCounts.get(row.id) ?? 0,
            }),
        )
        .filter((row) => isWithinDueFilter(row, input))
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
  }
}

export type WorkboardRepo = ReturnType<typeof makeWorkboardRepo>
