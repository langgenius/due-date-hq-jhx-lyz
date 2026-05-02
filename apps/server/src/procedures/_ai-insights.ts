import {
  AiInsightCitationSchema,
  AiInsightSectionSchema,
  type AiInsightPublic,
  type AiInsightSection,
} from '@duedatehq/contracts'
import type { AiInsightKind, AiInsightRow } from '@duedatehq/ports/ai-insights'

const InsightOutputSchema = AiInsightSectionSchema.array()
const InsightCitationsSchema = AiInsightCitationSchema.array()

export function dateInTimezone(timezone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
}

function parseSections(row: AiInsightRow | null): AiInsightSection[] | null {
  if (!row?.output || typeof row.output !== 'object') return null
  const sections = (row.output as { sections?: unknown }).sections
  const parsed = InsightOutputSchema.safeParse(sections)
  return parsed.success ? parsed.data : null
}

function parseCitations(row: AiInsightRow | null): AiInsightPublic['citations'] | null {
  const parsed = InsightCitationsSchema.safeParse(row?.citations)
  return parsed.success ? parsed.data : null
}

export function toAiInsightPublic(
  row: AiInsightRow | null,
  fallback: {
    kind: AiInsightKind
    subjectId: string
    sections: AiInsightSection[]
  },
): AiInsightPublic {
  return {
    kind: row?.kind ?? fallback.kind,
    subjectId: row?.subjectId ?? fallback.subjectId,
    status: row?.status ?? 'pending',
    generatedAt: row?.generatedAt ? row.generatedAt.toISOString() : null,
    expiresAt: row?.expiresAt ? row.expiresAt.toISOString() : null,
    sections: parseSections(row) ?? fallback.sections,
    citations: parseCitations(row) ?? [],
    aiOutputId: row?.aiOutputId ?? null,
    errorCode: row?.errorCode ?? null,
  }
}
