import { describe, expect, it } from 'vitest'

import { INITIAL_STATE, wizardReducer } from './state'

describe('migration wizard state', () => {
  it('clears upload metadata when the intake switches back to paste', () => {
    const uploaded = wizardReducer(INITIAL_STATE, {
      type: 'INTAKE_TEXT',
      text: 'Client\nAcme',
      fileName: 'clients.csv',
      fileKind: 'csv',
      rawFileBase64: null,
      contentType: 'text/csv',
      sizeBytes: 42,
    })

    const pasted = wizardReducer(uploaded, {
      type: 'INTAKE_TEXT',
      text: 'Client\nBright Books',
      fileName: null,
      fileKind: 'paste',
      rawFileBase64: null,
      contentType: null,
      sizeBytes: 0,
    })

    expect(pasted.intake.fileName).toBeNull()
    expect(pasted.intake.fileKind).toBe('paste')
    expect(pasted.intake.rawFileBase64).toBeNull()
    expect(pasted.intake.contentType).toBeNull()
    expect(pasted.intake.sizeBytes).toBe(0)
  })
})
