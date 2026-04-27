import type { DueDateLogic } from '../rules'

export interface ExpandDueDateInput {
  taxYearStart?: string
  taxYearEnd?: string
  holidays?: readonly string[]
}

export interface ExpandedDueDate {
  period: string
  dueDate: string | null
  sourceDefined: boolean
  requiresReview: boolean
  reason: string | null
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) throw new Error(`Invalid ISO date: ${value}`)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function dateFromParts(year: number, zeroBasedMonth: number, day: number): Date {
  return new Date(Date.UTC(year, zeroBasedMonth, day))
}

function applyNextBusinessDay(date: Date, holidays: readonly string[] = []): Date {
  const holidaySet = new Set(holidays)
  const out = new Date(date.getTime())

  while (out.getUTCDay() === 0 || out.getUTCDay() === 6 || holidaySet.has(formatIsoDate(out))) {
    out.setUTCDate(out.getUTCDate() + 1)
  }

  return out
}

function applyRollover(date: Date, logic: DueDateLogic, holidays: readonly string[] = []): Date {
  if (logic.holidayRollover === 'next_business_day') {
    return applyNextBusinessDay(date, holidays)
  }

  return date
}

export function expandDueDateLogic(
  logic: DueDateLogic,
  input: ExpandDueDateInput = {},
): ExpandedDueDate[] {
  if (logic.kind === 'fixed_date') {
    const date = applyRollover(parseIsoDate(logic.date), logic, input.holidays)
    return [
      {
        period: 'default',
        dueDate: formatIsoDate(date),
        sourceDefined: false,
        requiresReview: false,
        reason: null,
      },
    ]
  }

  if (logic.kind === 'period_table') {
    return logic.periods.map((period) => ({
      period: period.period,
      dueDate: period.dueDate,
      sourceDefined: true,
      requiresReview: false,
      reason: null,
    }))
  }

  if (logic.kind === 'source_defined_calendar') {
    return [
      {
        period: 'source_defined',
        dueDate: null,
        sourceDefined: true,
        requiresReview: true,
        reason: logic.description,
      },
    ]
  }

  if (logic.kind === 'nth_day_after_tax_year_end') {
    if (!input.taxYearEnd) {
      return [
        {
          period: 'tax_year_end_required',
          dueDate: null,
          sourceDefined: false,
          requiresReview: true,
          reason: 'taxYearEnd is required for this due date logic.',
        },
      ]
    }

    const end = parseIsoDate(input.taxYearEnd)
    const date = dateFromParts(
      end.getUTCFullYear(),
      end.getUTCMonth() + logic.monthOffset,
      logic.day,
    )
    const dueDate = applyRollover(date, logic, input.holidays)
    return [
      {
        period: 'tax_year',
        dueDate: formatIsoDate(dueDate),
        sourceDefined: false,
        requiresReview: false,
        reason: null,
      },
    ]
  }

  if (logic.kind === 'nth_day_after_tax_year_begin') {
    if (!input.taxYearStart) {
      return [
        {
          period: 'tax_year_start_required',
          dueDate: null,
          sourceDefined: false,
          requiresReview: true,
          reason: 'taxYearStart is required for this due date logic.',
        },
      ]
    }

    const start = parseIsoDate(input.taxYearStart)
    const date = dateFromParts(
      start.getUTCFullYear(),
      start.getUTCMonth() + logic.monthOffset - 1,
      logic.day,
    )
    const dueDate = applyRollover(date, logic, input.holidays)
    return [
      {
        period: 'tax_year',
        dueDate: formatIsoDate(dueDate),
        sourceDefined: false,
        requiresReview: false,
        reason: null,
      },
    ]
  }

  return logic satisfies never
}
