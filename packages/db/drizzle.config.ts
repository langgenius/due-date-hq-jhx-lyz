import { defineConfig } from 'drizzle-kit'

// D1 dialect. Migrations land in ./migrations and are applied via:
//   pnpm db:migrate:local
//   pnpm db:migrate:remote
export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './src/schema/*.ts',
  out: './migrations',
  verbose: true,
  strict: true,
})
