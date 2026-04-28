import { and, desc, eq, inArray } from 'drizzle-orm'
import type { Db } from '../client'
import { createEvidenceWriter, type EvidenceInput } from '../evidence-writer'
import { evidenceLink, type EvidenceLink } from '../schema/audit'
import { obligationInstance } from '../schema/obligations'

const OBLIGATION_ASSERT_BATCH_SIZE = 90

export function makeEvidenceRepo(db: Db, firmId: string) {
  const writer = createEvidenceWriter(db)

  async function assertObligationsInFirm(
    obligationInstanceIds: Array<string | null | undefined>,
  ): Promise<void> {
    const uniqueIds = Array.from(
      new Set(obligationInstanceIds.filter((id): id is string => typeof id === 'string')),
    )
    if (uniqueIds.length === 0) return

    const checks = []
    for (let i = 0; i < uniqueIds.length; i += OBLIGATION_ASSERT_BATCH_SIZE) {
      const chunk = uniqueIds.slice(i, i + OBLIGATION_ASSERT_BATCH_SIZE)
      checks.push(
        db
          .select({ id: obligationInstance.id })
          .from(obligationInstance)
          .where(and(eq(obligationInstance.firmId, firmId), inArray(obligationInstance.id, chunk))),
      )
    }

    const resultSets = await Promise.all(checks)
    const found = new Set<string>()
    for (const rows of resultSets) {
      for (const row of rows) found.add(row.id)
    }

    const missing = uniqueIds.filter((id) => !found.has(id))
    if (missing.length > 0) {
      throw new Error(
        `Cannot access evidence for obligations outside the current firm: ${missing.join(', ')}`,
      )
    }
  }

  return {
    firmId,

    async write(input: Omit<EvidenceInput, 'firmId'>): Promise<{ id: string }> {
      await assertObligationsInFirm([input.obligationInstanceId])
      return writer.write({ ...input, firmId })
    },

    async writeBatch(inputs: Array<Omit<EvidenceInput, 'firmId'>>): Promise<{ ids: string[] }> {
      await assertObligationsInFirm(inputs.map((input) => input.obligationInstanceId))
      return writer.writeBatch(inputs.map((input) => ({ ...input, firmId })))
    },

    async listByObligation(obligationInstanceId: string): Promise<EvidenceLink[]> {
      await assertObligationsInFirm([obligationInstanceId])
      return db
        .select()
        .from(evidenceLink)
        .where(
          and(
            eq(evidenceLink.firmId, firmId),
            eq(evidenceLink.obligationInstanceId, obligationInstanceId),
          ),
        )
        .orderBy(desc(evidenceLink.appliedAt))
    },
  }
}

export type EvidenceRepo = ReturnType<typeof makeEvidenceRepo>
