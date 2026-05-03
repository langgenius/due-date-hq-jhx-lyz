import { oc } from '@orpc/contract'
import * as z from 'zod'
import { TenantIdSchema, EntityIdSchema } from './shared/ids'

export const CalendarSubscriptionScopeSchema = z.enum(['my', 'firm'])
export type CalendarSubscriptionScope = z.infer<typeof CalendarSubscriptionScopeSchema>

export const CalendarPrivacyModeSchema = z.enum(['redacted', 'full'])
export type CalendarPrivacyMode = z.infer<typeof CalendarPrivacyModeSchema>

export const CalendarSubscriptionStatusSchema = z.enum(['active', 'disabled'])
export type CalendarSubscriptionStatus = z.infer<typeof CalendarSubscriptionStatusSchema>

export const CalendarSubscriptionPublicSchema = z.object({
  id: EntityIdSchema,
  firmId: TenantIdSchema,
  scope: CalendarSubscriptionScopeSchema,
  subjectUserId: z.string().min(1).nullable(),
  privacyMode: CalendarPrivacyModeSchema,
  status: CalendarSubscriptionStatusSchema,
  feedUrl: z.url().nullable(),
  lastAccessedAt: z.iso.datetime().nullable(),
  revokedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type CalendarSubscriptionPublic = z.infer<typeof CalendarSubscriptionPublicSchema>

export const CalendarUpsertSubscriptionInputSchema = z.object({
  scope: CalendarSubscriptionScopeSchema,
  privacyMode: CalendarPrivacyModeSchema.default('redacted').optional(),
})
export type CalendarUpsertSubscriptionInput = z.infer<typeof CalendarUpsertSubscriptionInputSchema>

export const CalendarSubscriptionByIdInputSchema = z.object({
  id: EntityIdSchema,
})
export type CalendarSubscriptionByIdInput = z.infer<typeof CalendarSubscriptionByIdInputSchema>

export const calendarContract = oc.router({
  listSubscriptions: oc.input(z.undefined()).output(z.array(CalendarSubscriptionPublicSchema)),
  upsertSubscription: oc
    .input(CalendarUpsertSubscriptionInputSchema)
    .output(CalendarSubscriptionPublicSchema),
  regenerateSubscription: oc
    .input(CalendarSubscriptionByIdInputSchema)
    .output(CalendarSubscriptionPublicSchema),
  disableSubscription: oc
    .input(CalendarSubscriptionByIdInputSchema)
    .output(CalendarSubscriptionPublicSchema),
})

export type CalendarContract = typeof calendarContract
