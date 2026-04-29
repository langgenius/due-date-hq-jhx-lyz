import * as z from 'zod'

export const MigrationAuditActions = [
  'migration.batch.created',
  'migration.imported',
  'migration.reverted',
  'migration.single_undo',
  'migration.mapper.confirmed',
  'migration.normalizer.confirmed',
  'migration.matrix.applied',
] as const

export const PulseAuditActions = [
  'pulse.ingest',
  'pulse.extract',
  'pulse.approve',
  'pulse.reject',
  'pulse.snooze',
  'pulse.apply',
  'pulse.revert',
] as const

export const AuditActions = [...MigrationAuditActions, ...PulseAuditActions] as const

export const MigrationAuditActionSchema = z.enum(MigrationAuditActions)
export type MigrationAuditAction = z.infer<typeof MigrationAuditActionSchema>

export const PulseAuditActionSchema = z.enum(PulseAuditActions)
export type PulseAuditAction = z.infer<typeof PulseAuditActionSchema>

export const AuditActionSchema = z.enum(AuditActions)
export type AuditAction = z.infer<typeof AuditActionSchema>
