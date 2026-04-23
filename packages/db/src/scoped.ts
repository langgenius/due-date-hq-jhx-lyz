import type { Db } from './client'
import type { ScopedRepo } from './types'

/**
 * Scoped repository factory — THE ONLY entry point procedures may use to reach D1.
 *
 * HARD CONSTRAINTS (docs/Dev File/06 §4 · docs/Dev File/02 §7):
 *   - Every repo method internally enforces `WHERE firm_id = :firmId`.
 *   - `firmId` is injected by middleware (from the better-auth session's `activeOrganizationId`);
 *     procedures must never take `firmId` from user input.
 *   - oxlint blocks `@duedatehq/db/schema/*` imports outside packages/db and jobs/webhooks.
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

export function scoped(_db: Db, firmId: string): ScopedRepo {
  return {
    firmId,
    clients: unimplementedRepo('clients'),
    obligations: unimplementedRepo('obligations'),
    pulse: unimplementedRepo('pulse'),
    migration: unimplementedRepo('migration'),
    evidence: unimplementedRepo('evidence'),
    audit: unimplementedRepo('audit'),
  }
}
