import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const seedDir = dirname(fileURLToPath(import.meta.url))
const sqlPath = resolve(seedDir, '../../../mock/demo.sql')
const serverDir = resolve(seedDir, '../../../apps/server')

if (!existsSync(sqlPath)) {
  console.error(`[seed:demo] Missing mock SQL file: ${sqlPath}`)
  process.exit(1)
}

const result = spawnSync(
  'pnpm',
  [
    '--dir',
    serverDir,
    'exec',
    'wrangler',
    'd1',
    'execute',
    'DB',
    '--local',
    '--config',
    'wrangler.toml',
    '--file',
    sqlPath,
  ],
  { cwd: seedDir, stdio: 'inherit' },
)

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log('[seed:demo] Mock live-demo dataset seeded from mock/demo.sql')
