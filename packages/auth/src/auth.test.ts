import { describe, expect, it } from 'vitest'
import { statement } from './permissions'

describe('@duedatehq/auth', () => {
  it('keeps owner-scope permission resources explicit', () => {
    expect(statement.client).toContain('read')
    expect(statement.audit).toContain('read')
    expect(statement.member).toContain('change_role')
  })
})
