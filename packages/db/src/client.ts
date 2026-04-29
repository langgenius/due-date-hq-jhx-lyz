import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import * as aiSchema from './schema/ai'
import * as auditSchema from './schema/audit'
import * as authSchema from './schema/auth'
import * as clientsSchema from './schema/clients'
import * as dashboardSchema from './schema/dashboard'
import * as firmSchema from './schema/firm'
import * as migrationSchema from './schema/migration'
import * as notificationsSchema from './schema/notifications'
import * as obligationsSchema from './schema/obligations'
import * as pulseSchema from './schema/pulse'

const schema = {
  ...aiSchema,
  ...auditSchema,
  ...authSchema,
  ...clientsSchema,
  ...dashboardSchema,
  ...firmSchema,
  ...migrationSchema,
  ...notificationsSchema,
  ...obligationsSchema,
  ...pulseSchema,
}

export type Db = DrizzleD1Database<typeof schema>

export function createDb(d1: D1Database): Db {
  return drizzle(d1, { schema })
}
