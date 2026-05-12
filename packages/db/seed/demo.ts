import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const seedDir = dirname(fileURLToPath(import.meta.url))
const sqlPath = resolve(seedDir, '../../../mock/demo.sql')
const serverDir = resolve(seedDir, '../../../apps/server')
const maxSqlChunkBytes = 75_000

if (!existsSync(sqlPath)) {
  console.error(`[seed:demo] Missing mock SQL file: ${sqlPath}`)
  process.exit(1)
}

const seedStatements = splitSqlStatements(readFileSync(sqlPath, 'utf8')).filter(
  (statement) => !isTransactionBoundary(statement),
)
const chunks = chunkSqlStatements(seedStatements, maxSqlChunkBytes)
const tempDir = mkdtempSync(join(tmpdir(), 'duedatehq-seed-demo-'))
let failedStatus: number | null = null

try {
  for (const [index, chunk] of chunks.entries()) {
    const chunkPath = join(tempDir, `demo-${index + 1}.sql`)
    writeFileSync(chunkPath, chunk)
    console.log(`[seed:demo] Executing SQL chunk ${index + 1}/${chunks.length}`)

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
        chunkPath,
      ],
      { cwd: seedDir, stdio: 'inherit' },
    )

    if (result.status !== 0) {
      failedStatus = result.status ?? 1
      break
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

if (failedStatus !== null) {
  process.exit(failedStatus)
}

console.log('[seed:demo] Mock live-demo dataset seeded from mock/demo.sql')

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inString = false

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index]
    current += char

    if (char === "'") {
      if (inString && sql[index + 1] === "'") {
        current += sql[index + 1]
        index += 1
      } else {
        inString = !inString
      }
    } else if (char === ';' && !inString) {
      const statement = current.trim()
      if (statement) statements.push(statement)
      current = ''
    }
  }

  const trailing = current.trim()
  if (trailing) statements.push(trailing)

  return statements
}

function isTransactionBoundary(statement: string): boolean {
  const executable = statement
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
    .trim()
    .toUpperCase()

  return executable === 'BEGIN TRANSACTION;' || executable === 'COMMIT;'
}

function chunkSqlStatements(statements: string[], maxBytes: number): string[] {
  const chunks: string[] = []
  let current = ''

  for (const statement of statements) {
    const next = `${statement}\n`
    const nextBytes = Buffer.byteLength(next)

    if (nextBytes > maxBytes) {
      throw new Error(`Seed SQL statement exceeds ${maxBytes} bytes.`)
    }

    if (current && Buffer.byteLength(current) + nextBytes > maxBytes) {
      chunks.push(current)
      current = ''
    }

    current += next
  }

  if (current) chunks.push(current)

  return chunks
}
