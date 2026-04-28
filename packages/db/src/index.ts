import * as authSchema from './schema/auth'
import * as firmSchema from './schema/firm'
import { makeFirmsRepo } from './repo/firms'
import { makeMembersRepo } from './repo/members'

export { createDb } from './client'
export { scoped } from './scoped'
export { authSchema }
// firmSchema is exposed at the main entry (parallel to authSchema) so the
// auth-layer code paths that legitimately need to write firm_profile —
// the organization-create hook and the lazy-create branch in tenantMiddleware
// — can do so without direct schema subpath imports. Procedures still must go
// through `scoped()`; firm_profile is composed into the tenantContext by
// middleware, never read by procedures.
export { firmSchema }
export { makeFirmsRepo }
export { makeMembersRepo }
export type {
  Db,
  ScopedRepo,
  TenantContext,
  FirmProfile,
  NewFirmProfile,
  FirmsRepo,
  FirmMembershipRow,
  InvitationRow,
  MemberRow,
  MembersRepo,
  SeatUsage,
} from './types'
