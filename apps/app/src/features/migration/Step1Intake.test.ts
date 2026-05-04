import { describe, expect, it } from 'vitest'

import {
  normalizeIntegrationJsonText,
  normalizePastedRowsText,
  parseIntegrationRows,
} from './Step1Intake'

describe('provider integration intake parsing', () => {
  it('parses standard provider arrays', () => {
    const rows = parseIntegrationRows('[{"id":"acct_1","name":"Acme"}]', 'taxdome')

    expect(rows).toHaveLength(1)
    expect(rows[0]?.externalId).toBe('acct_1')
    expect(rows[0]?.externalEntityType).toBe('account')
  })

  it('accepts copied JSON objects without wrapping brackets', () => {
    const rows = parseIntegrationRows(
      '{"id":"work_1","name":"Alpha"}\n{"id":"work_2","name":"Beta"}',
      'karbon',
    )

    expect(rows.map((row) => row.externalId)).toEqual(['work_1', 'work_2'])
    expect(rows.every((row) => row.externalEntityType === 'work_item')).toBe(true)
  })

  it('accepts common API wrapper keys', () => {
    const rows = parseIntegrationRows('{"data":[{"id":101},{"id":102}]}', 'proconnect')

    expect(rows.map((row) => row.externalId)).toEqual(['101', '102'])
  })

  it('normalizes paste-friendly JSONL and markdown fenced JSON into arrays', () => {
    expect(normalizeIntegrationJsonText('```json\n{"id":"a"}\n{"id":"b"}\n```')).toBe(
      '[\n  {\n    "id": "a"\n  },\n  {\n    "id": "b"\n  }\n]',
    )
  })

  it('repairs trailing commas before parsing', () => {
    const rows = parseIntegrationRows('[{"id":"acct_1",},]', 'taxdome')

    expect(rows[0]?.externalId).toBe('acct_1')
  })
})

describe('client rows paste normalization', () => {
  it('turns copied JSON records into tabular rows', () => {
    expect(
      normalizePastedRowsText(
        '[{"Client name":"Acme LLC","State":"CA"},{"Client name":"Bright Books","State":"TX"}]',
      ),
    ).toBe('Client name\tState\nAcme LLC\tCA\nBright Books\tTX')
  })

  it('accepts JSONL client rows', () => {
    expect(
      normalizePastedRowsText('{"name":"Acme","entity":"LLC"}\n{"name":"Beta","state":"NY"}'),
    ).toBe('name\tentity\tstate\nAcme\tLLC\t\nBeta\t\tNY')
  })

  it('unwraps common row containers', () => {
    expect(normalizePastedRowsText('{"rows":[{"name":"Acme","state":"CA"}]}')).toBe(
      'name\tstate\nAcme\tCA',
    )
  })

  it('normalizes fenced CSV into TSV text', () => {
    expect(normalizePastedRowsText('```csv\nname,state\nAcme,CA\n```')).toBe(
      'name\tstate\nAcme\tCA',
    )
  })
})
