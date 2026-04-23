import type { Role } from './permissions'

export interface AuthSession {
  userId: string
  activeOrganizationId: string | null
}

export interface AuthMember {
  userId: string
  organizationId: string
  role: Role
  status: 'active' | 'suspended'
}
