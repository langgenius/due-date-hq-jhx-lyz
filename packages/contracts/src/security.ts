import { oc } from '@orpc/contract'
import * as z from 'zod'

export const SecuritySessionSchema = z.object({
  id: z.string().min(1),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  isCurrent: z.boolean(),
})

export const SecurityStatusSchema = z.object({
  twoFactorEnabled: z.boolean(),
  sessions: z.array(SecuritySessionSchema),
})

export const EnableTwoFactorOutputSchema = z.object({
  totpURI: z.string().min(1),
  backupCodes: z.array(z.string().min(1)),
})

export const VerifyTwoFactorInputSchema = z.object({
  code: z.string().trim().min(6).max(12),
})

export const SecurityMutationOutputSchema = z.object({
  status: z.boolean(),
})

export const RevokeSessionInputSchema = z.object({
  sessionId: z.string().min(1),
})

export const securityContract = oc.router({
  status: oc.input(z.undefined()).output(SecurityStatusSchema),
  enableTwoFactor: oc.input(z.undefined()).output(EnableTwoFactorOutputSchema),
  verifyTwoFactor: oc.input(VerifyTwoFactorInputSchema).output(SecurityMutationOutputSchema),
  disableTwoFactor: oc.input(z.undefined()).output(SecurityMutationOutputSchema),
  revokeSession: oc.input(RevokeSessionInputSchema).output(SecurityMutationOutputSchema),
  revokeOtherSessions: oc.input(z.undefined()).output(SecurityMutationOutputSchema),
})

export type EnableTwoFactorOutput = z.infer<typeof EnableTwoFactorOutputSchema>
export type SecurityContract = typeof securityContract
export type SecurityMutationOutput = z.infer<typeof SecurityMutationOutputSchema>
export type SecuritySession = z.infer<typeof SecuritySessionSchema>
export type SecurityStatus = z.infer<typeof SecurityStatusSchema>
export type RevokeSessionInput = z.infer<typeof RevokeSessionInputSchema>
export type VerifyTwoFactorInput = z.infer<typeof VerifyTwoFactorInputSchema>
