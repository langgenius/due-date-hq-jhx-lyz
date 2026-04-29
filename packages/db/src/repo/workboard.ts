import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, lte, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { Db } from '../client'
import { client } from '../schema/clients'
import { obligationInstance, type ObligationStatus } from '../schema/obligations'

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
  createdAt: Date
  updatedAt: Date
  clientName: string
  assigneeName: string | null
}

export interface WorkboardListResult {
  rows: WorkboardListRow[]
  nextCursor: string | null
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100
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

export function makeWorkboardRepo(db: Db, firmId: string) {
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

      const asOfDate = parseDateOnly(input.asOfDate ?? todayDateOnly())
      if (input.due === 'overdue') {
        filters.push(lt(obligationInstance.currentDueDate, asOfDate))
      }
      if (input.dueWithinDays !== undefined) {
        filters.push(
          and(
            gte(obligationInstance.currentDueDate, asOfDate),
            lte(obligationInstance.currentDueDate, addDays(asOfDate, input.dueWithinDays)),
          )!,
        )
      }

      const search = normalizeWorkboardSearch(input.search)
      if (search) {
        const needle = `%${escapeLikePattern(search)}%`
        filters.push(sql`${client.name} like ${needle} escape '\\'`)
      }

      // Cursor only applies to due-date sorts; updated_desc returns a single
      // page in Demo Sprint. Keyset condition: (due, id) > (cursor.due, cursor.id)
      // for ascending, or < for descending.
      if (sort !== 'updated_desc' && input.cursor) {
        const decoded = decodeCursor(input.cursor)
        if (decoded) {
          const cmp = sort === 'due_asc' ? gt : lt
          filters.push(
            or(
              cmp(obligationInstance.currentDueDate, decoded.currentDueDate),
              and(
                eq(obligationInstance.currentDueDate, decoded.currentDueDate),
                cmp(obligationInstance.id, decoded.id),
              ),
            )!,
          )
        }
      }

      const orderBy =
        sort === 'due_desc'
          ? [desc(obligationInstance.currentDueDate), desc(obligationInstance.id)]
          : sort === 'updated_desc'
            ? [desc(obligationInstance.updatedAt), desc(obligationInstance.id)]
            : [asc(obligationInstance.currentDueDate), asc(obligationInstance.id)]

      // limit + 1 sentinel to detect another page without a count query.
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
          createdAt: obligationInstance.createdAt,
          updatedAt: obligationInstance.updatedAt,
          clientName: client.name,
          assigneeName: client.assigneeName,
        })
        .from(obligationInstance)
        .innerJoin(client, eq(obligationInstance.clientId, client.id))
        .where(and(...filters))
        .orderBy(...orderBy)
        .limit(limit + 1)

      const hasMore = rawRows.length > limit
      const pageRows = hasMore ? rawRows.slice(0, limit) : rawRows
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
