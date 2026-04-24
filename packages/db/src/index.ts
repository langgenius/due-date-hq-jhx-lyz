import * as authSchema from './schema/auth'
import * as firmSchema from './schema/firm'

export { createDb } from './client'
export { scoped } from './scoped'
export { authSchema }
// firmSchema is exposed at the main entry (parallel to authSchema) so the
// auth-layer code paths that legitimately need to write firm_profile —
// the organization-create hook and the lazy-create branch in tenantMiddleware
// — can do so without triggering the @duedatehq/db/schema/* import
// restriction. Procedures still must go through `scoped()`; firm_profile is
// composed into the tenantContext by middleware, never read by procedures.
export { firmSchema }
export type { Db, ScopedRepo, TenantContext, FirmProfile, NewFirmProfile } from './types'
