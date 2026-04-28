import { detectSsnColumns } from '@duedatehq/core/pii'

export interface RedactionResult<TInput> {
  input: TInput
  blockedColumns: number[]
}

export function redactMigrationInput<TInput>(input: TInput): RedactionResult<TInput> {
  if (!input || typeof input !== 'object') return { input, blockedColumns: [] }

  const maybeHeader = (input as { header?: unknown }).header
  const maybeRows = (input as { sample_rows?: unknown }).sample_rows
  if (!Array.isArray(maybeRows)) return { input, blockedColumns: [] }

  const sampleRows = maybeRows.map((row) => {
    if (!Array.isArray(row)) return []
    return row.map((value) => (value === null || value === undefined ? '' : String(value)))
  })
  const header = Array.isArray(maybeHeader)
    ? maybeHeader.map((value) => (value === null || value === undefined ? '' : String(value)))
    : Array.from({ length: Math.max(0, ...sampleRows.map((row) => row.length)) }, () => '')
  const blockedColumns = detectSsnColumns(header, sampleRows).blockedColumnIndexes
  if (blockedColumns.length === 0) return { input, blockedColumns }

  const blockedSet = new Set(blockedColumns)
  const patch: { header?: unknown[]; sample_rows: unknown[] } = {
    sample_rows: maybeRows.map((row) =>
      Array.isArray(row) ? row.filter((_, index) => !blockedSet.has(index)) : row,
    ),
  }

  if (Array.isArray(maybeHeader)) {
    patch.header = maybeHeader.filter((_, index) => !blockedSet.has(index))
  }
  const sanitized = Object.assign({}, input, patch)

  return { input: sanitized, blockedColumns }
}
