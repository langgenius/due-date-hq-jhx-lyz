import * as z from 'zod'

export const PulseExtractInputSchema = z.object({
  sourceId: z.string().min(1),
  title: z.string().min(1),
  officialSourceUrl: z.string().url(),
  rawText: z.string().min(1),
})
export type PulseExtractInput = z.infer<typeof PulseExtractInputSchema>

export const PulseExtractOutputSchema = z.object({
  summary: z.string().min(1),
  sourceExcerpt: z.string().min(1),
  jurisdiction: z.string().length(2),
  counties: z.array(z.string()),
  forms: z.array(z.string().min(1)),
  entityTypes: z.array(
    z.enum(['llc', 's_corp', 'partnership', 'c_corp', 'sole_prop', 'trust', 'individual', 'other']),
  ),
  originalDueDate: z.iso.date(),
  newDueDate: z.iso.date(),
  effectiveFrom: z.iso.date().nullable(),
  confidence: z.number().min(0).max(1),
})
export type PulseExtractOutput = z.infer<typeof PulseExtractOutputSchema>
