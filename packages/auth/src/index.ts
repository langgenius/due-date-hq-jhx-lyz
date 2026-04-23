// @duedatehq/auth — server-side better-auth factory.
// Wires Organization + AC + magicLink plugins against the Drizzle D1 adapter.
// Actual plugin config lands in Phase 0 (docs/Dev File/06 §2).

export type AuthEnv = {
  AUTH_SECRET: string
  AUTH_URL: string
  EMAIL_FROM: string
}

export type AuthInstance = Record<string, never>

export function createAuth(_deps: { db: unknown; env: AuthEnv }): AuthInstance {
  // betterAuth({ database: drizzleAdapter(deps.db, {...}), plugins: [...] })
  return {}
}
