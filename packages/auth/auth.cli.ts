import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createAuthPlugins } from './src/index'

export const auth = betterAuth({
  baseURL: 'http://localhost:8787',
  // Better Auth CLI only introspects the config/plugins for Drizzle schema generation.
  // eslint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  database: drizzleAdapter({} as never, {
    provider: 'sqlite',
  }),
  plugins: [...createAuthPlugins()],
  rateLimit: {
    enabled: true,
    storage: 'database',
  },
})
