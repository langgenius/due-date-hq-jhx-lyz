export interface RedactionResult<TInput> {
  input: TInput
  blockedColumns: number[]
}

const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/

export function redactMigrationInput<TInput>(input: TInput): RedactionResult<TInput> {
  if (!input || typeof input !== 'object') return { input, blockedColumns: [] }

  const maybeRows = (input as { sample_rows?: unknown }).sample_rows
  if (!Array.isArray(maybeRows)) return { input, blockedColumns: [] }

  const blocked = new Set<number>()
  for (const row of maybeRows) {
    if (!Array.isArray(row)) continue
    row.forEach((value, index) => {
      if (typeof value === 'string' && SSN_PATTERN.test(value)) blocked.add(index)
    })
  }

  return { input, blockedColumns: [...blocked] }
}
