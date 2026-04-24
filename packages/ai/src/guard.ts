export class GuardRejection extends Error {
  constructor(
    message: string,
    readonly code: 'EIN_HIT_RATE_LOW' | 'SCHEMA_INVALID',
  ) {
    super(message)
  }
}

const EIN_PATTERN = /^\d{2}-\d{7}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function verifyMapperEinHitRate(input: unknown, output: unknown): void {
  if (!isRecord(input) || !isRecord(output)) return

  const mappings = output.mappings
  if (!Array.isArray(mappings)) return

  const einMapping = mappings.find(
    (mapping): mapping is { source: string } =>
      isRecord(mapping) && mapping.target === 'client.ein' && typeof mapping.source === 'string',
  )
  if (!einMapping) return

  const header = input.header
  const sampleRows = input.sample_rows
  if (!Array.isArray(header) || !Array.isArray(sampleRows)) return

  const columnIndex = header.findIndex((value) => value === einMapping.source)
  if (columnIndex < 0) return

  const values = sampleRows
    .map((row) => (Array.isArray(row) ? row[columnIndex] : undefined))
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  if (values.length === 0) return

  const hitRate = values.filter((value) => EIN_PATTERN.test(value.trim())).length / values.length
  if (hitRate < 0.8) {
    throw new GuardRejection(
      'EIN mapping rejected because regex hit rate is below 80%',
      'EIN_HIT_RATE_LOW',
    )
  }
}
