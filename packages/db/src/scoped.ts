import type { Db } from './client'
import { makeAuditRepo } from './repo/audit'
import { makeClientsRepo } from './repo/clients'
import { makeEvidenceRepo } from './repo/evidence'
import { makeMigrationRepo } from './repo/migration'
import { makeObligationsRepo } from './repo/obligations'
import type { ScopedRepo } from './types'

/**
 * Scoped repository factory — THE ONLY entry point procedures may use to reach D1.
 *
 * HARD CONSTRAINTS (docs/dev-file/06 §4 · docs/dev-file/02 §7):
 *   - Every repo method internally enforces `WHERE firm_id = :firmId`.
 *   - `firmId` is injected by middleware (from the better-auth session's `activeOrganizationId`);
 *     procedures must never take `firmId` from user input.
 *   - oxlint blocks direct `@duedatehq/db` imports and subpath imports from procedures.
 *
 * Phase 0 will instantiate concrete repos; Phase 1 adds Overlay-aware reads.
 */

/**
 * Placeholder that throws if any method on an unimplemented repo is called.
 * Concrete repos will be wired up per-domain in Phase 0 (see `./repo/*`).
 */
function unimplementedRepo(name: string): object {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        throw new Error(
          `ScopedRepo.${name}.${String(prop)} not implemented yet. ` +
            `Wire up packages/db/src/repo/${name}.ts before calling this from a procedure.`,
        )
      },
    },
  )
}

export function scoped(db: Db, firmId: string): ScopedRepo {
  return {
    firmId,
    clients: makeClientsRepo(db, firmId),
    obligations: makeObligationsRepo(db, firmId),
    pulse: unimplementedRepo('pulse'),
    migration: makeMigrationRepo(db, firmId),
    evidence: makeEvidenceRepo(db, firmId),
    audit: makeAuditRepo(db, firmId),
  }
}
