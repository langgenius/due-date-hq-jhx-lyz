// @duedatehq/contracts — single source of truth shared by apps/web and apps/server.
// HARD CONSTRAINTS (docs/dev-file/08 §4.3):
//   - Only `zod` and `@orpc/contract` imports are allowed.
//   - Schemas must be usable as both input and output validators (no field drift).
//   - Mutations to contract files require a `[contract]` PR label.

import { oc } from '@orpc/contract'
import { clientsContract } from './clients'
import { obligationsContract } from './obligations'
import { dashboardContract } from './dashboard'
import { workboardContract } from './workboard'
import { pulseContract } from './pulse'
import { migrationContract } from './migration'

export const appContract = oc.router({
  clients: clientsContract,
  obligations: obligationsContract,
  dashboard: dashboardContract,
  workboard: workboardContract,
  pulse: pulseContract,
  migration: migrationContract,
})

export type AppContract = typeof appContract
