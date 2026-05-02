import * as z from 'zod'

export const SmartPriorityFactorKeySchema = z.enum([
  'exposure',
  'urgency',
  'importance',
  'history',
  'readiness',
])
export type SmartPriorityFactorKey = z.infer<typeof SmartPriorityFactorKeySchema>

export const SmartPriorityFactorSchema = z.object({
  key: SmartPriorityFactorKeySchema,
  label: z.string().min(1),
  weight: z.number().min(0).max(1),
  rawValue: z.string().min(1),
  normalized: z.number().min(0).max(1),
  contribution: z.number().min(0),
  sourceLabel: z.string().min(1),
})
export type SmartPriorityFactor = z.infer<typeof SmartPriorityFactorSchema>

export const SmartPriorityBreakdownSchema = z.object({
  version: z.literal('smart-priority-v1'),
  score: z.number().min(0),
  rank: z.number().int().positive().nullable(),
  factors: z.array(SmartPriorityFactorSchema),
})
export type SmartPriorityBreakdown = z.infer<typeof SmartPriorityBreakdownSchema>
