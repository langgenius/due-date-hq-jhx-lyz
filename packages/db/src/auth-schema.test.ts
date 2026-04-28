import { describe, expect, it } from 'vitest'
import { getTableConfig } from 'drizzle-orm/sqlite-core'
import { invitation, member } from './schema/auth'

describe('auth schema extensions', () => {
  it('keeps member unique membership and status extensions', () => {
    const cfg = getTableConfig(member)
    expect(cfg.indexes.some((idx) => idx.config.name === 'member_organization_user_unique')).toBe(
      true,
    )
    expect(cfg.columns.some((col) => col.name === 'status')).toBe(true)
  })

  it('indexes invitation lookup for the members gateway', () => {
    const cfg = getTableConfig(invitation)
    expect(
      cfg.indexes.some((idx) => idx.config.name === 'invitation_organization_email_status_idx'),
    ).toBe(true)
  })
})
