import * as z from 'zod'

export const MigrationAuditActions = [
  'migration.imported',
  'migration.reverted',
  'migration.single_undo',
  'migration.mapper.confirmed',
  'migration.normalizer.confirmed',
  'migration.matrix.applied',
] as const

export const MigrationAuditActionSchema = z.enum(MigrationAuditActions)
export type MigrationAuditAction = z.infer<typeof MigrationAuditActionSchema>
