import { oc } from '@orpc/contract'

// Procedures land in Phase 0; see docs/Dev File/02 §2 + docs/PRD §5.6.
export const clientsContract = oc.router({})
export type ClientsContract = typeof clientsContract
