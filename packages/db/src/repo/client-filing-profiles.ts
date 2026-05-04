import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import type { Db } from '../client'
import { client, clientFilingProfile, type ClientFilingProfileSource } from '../schema/clients'

const PROFILE_BATCH_SIZE = Math.floor(100 / 9)
const CLIENT_ASSERT_BATCH_SIZE = 90

export interface ClientFilingProfileInput {
  id?: string
  clientId: string
  state: string
  counties?: string[]
  taxTypes?: string[]
  isPrimary?: boolean
  source?: ClientFilingProfileSource
  migrationBatchId?: string | null
}

export interface ClientFilingProfileReplaceInput {
  state: string
  counties?: string[]
  taxTypes?: string[]
  isPrimary?: boolean
  source?: ClientFilingProfileSource
  migrationBatchId?: string | null
}

type ProfileRow = typeof clientFilingProfile.$inferSelect

interface NormalizedProfile {
  state: string
  counties: string[]
  taxTypes: string[]
  isPrimary: boolean
  source: ClientFilingProfileSource
  migrationBatchId: string | null
}

function normalizeStringArray(values: readonly string[] | undefined): string[] {
  return Array.from(
    new Set((values ?? []).map((value) => value.trim()).filter((value) => value.length > 0)),
  )
}

function normalizeState(value: string): string | null {
  const state = value.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(state) ? state : null
}

function normalizeProfiles(
  profiles: readonly ClientFilingProfileReplaceInput[],
): NormalizedProfile[] {
  const byState = new Map<string, NormalizedProfile>()
  for (const profile of profiles) {
    const state = normalizeState(profile.state)
    if (!state) continue
    const current = byState.get(state)
    if (!current) {
      byState.set(state, {
        ...profile,
        state,
        counties: normalizeStringArray(profile.counties),
        taxTypes: normalizeStringArray(profile.taxTypes),
        isPrimary: profile.isPrimary ?? false,
        source: profile.source ?? 'manual',
        migrationBatchId: profile.migrationBatchId ?? null,
      })
      continue
    }
    current.isPrimary = current.isPrimary || Boolean(profile.isPrimary)
    current.counties = normalizeStringArray([
      ...(current.counties ?? []),
      ...(profile.counties ?? []),
    ])
    current.taxTypes = normalizeStringArray([
      ...(current.taxTypes ?? []),
      ...(profile.taxTypes ?? []),
    ])
    current.source = current.source ?? profile.source ?? 'manual'
    current.migrationBatchId = current.migrationBatchId ?? profile.migrationBatchId ?? null
    byState.set(state, current)
  }

  const out = [...byState.values()]
  const primaryIndex = out.findIndex((profile) => profile.isPrimary)
  const fallbackPrimary = primaryIndex >= 0 ? primaryIndex : 0
  return out.map((profile, index) =>
    Object.assign(profile, { isPrimary: index === fallbackPrimary }),
  )
}

function toPublicRow(row: ProfileRow) {
  return {
    id: row.id,
    firmId: row.firmId,
    clientId: row.clientId,
    state: row.state,
    counties: Array.isArray(row.countiesJson) ? row.countiesJson : [],
    taxTypes: Array.isArray(row.taxTypesJson) ? row.taxTypesJson : [],
    isPrimary: row.isPrimary,
    source: row.source,
    migrationBatchId: row.migrationBatchId,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function makeClientFilingProfilesRepo(db: Db, firmId: string) {
  async function assertClientsInFirm(clientIds: readonly string[]): Promise<void> {
    const uniqueIds = Array.from(new Set(clientIds))
    if (uniqueIds.length === 0) return
    const reads = []
    for (let i = 0; i < uniqueIds.length; i += CLIENT_ASSERT_BATCH_SIZE) {
      const chunk = uniqueIds.slice(i, i + CLIENT_ASSERT_BATCH_SIZE)
      reads.push(
        db
          .select({ id: client.id })
          .from(client)
          .where(
            and(eq(client.firmId, firmId), inArray(client.id, chunk), isNull(client.deletedAt)),
          ),
      )
    }
    const found = new Set((await Promise.all(reads)).flat().map((row) => row.id))
    const missing = uniqueIds.filter((id) => !found.has(id))
    if (missing.length > 0) {
      throw new Error(
        `Cannot create filing profiles for clients outside the current firm: ${missing.join(', ')}`,
      )
    }
  }

  return {
    firmId,

    async createBatch(inputs: ClientFilingProfileInput[]) {
      if (inputs.length === 0) return { ids: [] }
      await assertClientsInFirm(inputs.map((input) => input.clientId))
      const rows = inputs.flatMap((input) => {
        const state = normalizeState(input.state)
        if (!state) return []
        return [
          {
            id: input.id ?? crypto.randomUUID(),
            firmId,
            clientId: input.clientId,
            state,
            countiesJson: normalizeStringArray(input.counties),
            taxTypesJson: normalizeStringArray(input.taxTypes),
            isPrimary: input.isPrimary ?? false,
            source: input.source ?? 'manual',
            migrationBatchId: input.migrationBatchId ?? null,
          },
        ]
      })
      const writes = []
      for (let i = 0; i < rows.length; i += PROFILE_BATCH_SIZE) {
        writes.push(db.insert(clientFilingProfile).values(rows.slice(i, i + PROFILE_BATCH_SIZE)))
      }
      await Promise.all(writes)
      return { ids: rows.map((row) => row.id) }
    },

    async listByClient(clientId: string, opts: { includeArchived?: boolean } = {}) {
      const filters = [
        eq(clientFilingProfile.firmId, firmId),
        eq(clientFilingProfile.clientId, clientId),
      ]
      if (!opts.includeArchived) filters.push(isNull(clientFilingProfile.archivedAt))
      const rows = await db
        .select()
        .from(clientFilingProfile)
        .where(and(...filters))
        .orderBy(desc(clientFilingProfile.isPrimary), asc(clientFilingProfile.state))
      return rows.map(toPublicRow)
    },

    async listByClients(clientIds: string[], opts: { includeArchived?: boolean } = {}) {
      const uniqueIds = [...new Set(clientIds)]
      const out = new Map<string, ReturnType<typeof toPublicRow>[]>()
      for (const id of uniqueIds) out.set(id, [])
      if (uniqueIds.length === 0) return out

      const reads = []
      for (let i = 0; i < uniqueIds.length; i += CLIENT_ASSERT_BATCH_SIZE) {
        const chunk = uniqueIds.slice(i, i + CLIENT_ASSERT_BATCH_SIZE)
        const filters = [
          eq(clientFilingProfile.firmId, firmId),
          inArray(clientFilingProfile.clientId, chunk),
        ]
        if (!opts.includeArchived) filters.push(isNull(clientFilingProfile.archivedAt))
        reads.push(
          db
            .select()
            .from(clientFilingProfile)
            .where(and(...filters))
            .orderBy(
              asc(clientFilingProfile.clientId),
              desc(clientFilingProfile.isPrimary),
              asc(clientFilingProfile.state),
            ),
        )
      }

      for (const row of (await Promise.all(reads)).flat().map(toPublicRow)) {
        const list = out.get(row.clientId) ?? []
        list.push(row)
        out.set(row.clientId, list)
      }
      return out
    },

    async replaceForClient(clientId: string, profiles: ClientFilingProfileReplaceInput[]) {
      await assertClientsInFirm([clientId])
      const nextProfiles = normalizeProfiles(profiles)
      const now = new Date()
      await db
        .update(clientFilingProfile)
        .set({ archivedAt: now })
        .where(
          and(
            eq(clientFilingProfile.firmId, firmId),
            eq(clientFilingProfile.clientId, clientId),
            isNull(clientFilingProfile.archivedAt),
          ),
        )

      if (nextProfiles.length > 0) {
        const rows = nextProfiles.map((profile) => ({
          id: crypto.randomUUID(),
          firmId,
          clientId,
          state: profile.state,
          countiesJson: normalizeStringArray(profile.counties),
          taxTypesJson: normalizeStringArray(profile.taxTypes),
          isPrimary: profile.isPrimary ?? false,
          source: profile.source ?? 'manual',
          migrationBatchId: profile.migrationBatchId ?? null,
        }))
        const writes = []
        for (let i = 0; i < rows.length; i += PROFILE_BATCH_SIZE) {
          writes.push(db.insert(clientFilingProfile).values(rows.slice(i, i + PROFILE_BATCH_SIZE)))
        }
        await Promise.all(writes)
      }

      const primary = nextProfiles.find((profile) => profile.isPrimary) ?? null
      await db
        .update(client)
        .set({
          state: primary?.state ?? null,
          county: primary?.counties?.[0] ?? null,
        })
        .where(and(eq(client.firmId, firmId), eq(client.id, clientId), isNull(client.deletedAt)))

      const rows = await db
        .select()
        .from(clientFilingProfile)
        .where(
          and(
            eq(clientFilingProfile.firmId, firmId),
            eq(clientFilingProfile.clientId, clientId),
            isNull(clientFilingProfile.archivedAt),
          ),
        )
        .orderBy(desc(clientFilingProfile.isPrimary), asc(clientFilingProfile.state))
      return rows.map(toPublicRow)
    },

    async deleteByBatch(batchId: string): Promise<number> {
      const rows = await db
        .select({ id: clientFilingProfile.id })
        .from(clientFilingProfile)
        .where(
          and(
            eq(clientFilingProfile.firmId, firmId),
            eq(clientFilingProfile.migrationBatchId, batchId),
          ),
        )
      if (rows.length === 0) return 0
      await db
        .delete(clientFilingProfile)
        .where(
          and(
            eq(clientFilingProfile.firmId, firmId),
            eq(clientFilingProfile.migrationBatchId, batchId),
          ),
        )
      return rows.length
    },
  }
}

export type ClientFilingProfilesRepo = ReturnType<typeof makeClientFilingProfilesRepo>
