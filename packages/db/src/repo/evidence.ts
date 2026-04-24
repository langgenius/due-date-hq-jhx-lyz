import { and, desc, eq } from 'drizzle-orm'
import type { Db } from '../client'
import { createEvidenceWriter, type EvidenceInput } from '../evidence-writer'
import { evidenceLink, type EvidenceLink } from '../schema/audit'

export function makeEvidenceRepo(db: Db, firmId: string) {
  const writer = createEvidenceWriter(db)

  return {
    firmId,

    async write(input: Omit<EvidenceInput, 'firmId'>): Promise<{ id: string }> {
      return writer.write({ ...input, firmId })
    },

    async writeBatch(inputs: Array<Omit<EvidenceInput, 'firmId'>>): Promise<{ ids: string[] }> {
      return writer.writeBatch(inputs.map((input) => ({ ...input, firmId })))
    },

    async listByObligation(obligationInstanceId: string): Promise<EvidenceLink[]> {
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
