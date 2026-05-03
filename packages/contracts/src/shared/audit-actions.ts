import * as z from 'zod'

export const MigrationAuditActions = [
  'migration.batch.created',
  'migration.raw_uploaded',
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
  'pulse.dismiss',
  'pulse.quarantine',
  'pulse.source_revoked',
  'pulse.snooze',
  'pulse.apply',
  'pulse.revert',
  'pulse.reactivate',
  'pulse.review_requested',
] as const

export const PenaltyAuditActions = ['penalty.override'] as const
export const AuthAuditActions = [
  'auth.denied',
  'auth.login.success',
  'auth.login.failed',
  'auth.mfa.setup.started',
  'auth.mfa.enabled',
  'auth.mfa.disabled',
  'auth.session.revoked',
] as const
export const ExportAuditActions = [
  'export.audit_package.requested',
  'export.audit_package.ready',
  'export.audit_package.failed',
  'export.audit_package.downloaded',
] as const

export const AuditActions = [
  ...MigrationAuditActions,
  ...PulseAuditActions,
  ...PenaltyAuditActions,
  ...AuthAuditActions,
  ...ExportAuditActions,
] as const

export const MigrationAuditActionSchema = z.enum(MigrationAuditActions)
export type MigrationAuditAction = z.infer<typeof MigrationAuditActionSchema>

export const PulseAuditActionSchema = z.enum(PulseAuditActions)
export type PulseAuditAction = z.infer<typeof PulseAuditActionSchema>

export const PenaltyAuditActionSchema = z.enum(PenaltyAuditActions)
export type PenaltyAuditAction = z.infer<typeof PenaltyAuditActionSchema>

export const AuthAuditActionSchema = z.enum(AuthAuditActions)
export type AuthAuditAction = z.infer<typeof AuthAuditActionSchema>

export const ExportAuditActionSchema = z.enum(ExportAuditActions)
export type ExportAuditAction = z.infer<typeof ExportAuditActionSchema>

export const AuditActionSchema = z.enum(AuditActions)
export type AuditAction = z.infer<typeof AuditActionSchema>
