// Public surface of @duedatehq/db.
// NOTE: Procedures may NOT import from `@duedatehq/db/schema` directly; oxlint blocks it.
// They must go through `scoped(db, firmId)`.

export { createDb } from './client'
export { scoped } from './scoped'
export type { Db, ScopedRepo } from './types'
