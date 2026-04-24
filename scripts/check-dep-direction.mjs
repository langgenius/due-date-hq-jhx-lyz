#!/usr/bin/env node
// Enforce the dependency-direction DAG (docs/dev-file/08 §6).
//
//   apps/*                → packages/{contracts, auth, ui, i18n, core}
//   apps/server (adds)    → packages/{db, ai}
//   packages/ai           → packages/core (only; DB/KV/Vectorize/Langfuse via ports)
//   packages/db           → packages/core (only)
//   packages/core         → ∅
//   packages/contracts    → zod + @orpc/contract only
//
// Runs in pre-push (lefthook) and CI. Exits non-zero on any violation.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname

const ALLOWED = {
  'packages/core': new Set([]),
  'packages/i18n': new Set([]),
  'packages/ui': new Set([]),
  'packages/contracts': new Set(['zod', '@orpc/contract']),
  'packages/db': new Set(['@duedatehq/core']),
  'packages/ai': new Set(['@duedatehq/core']),
  'packages/auth': new Set(['@duedatehq/core']),
  // apps are free to depend on any internal package.
  'apps/app': null,
  'apps/server': null,
}

const INTERNAL = /^@duedatehq\//

const violations = []

function readPkg(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  } catch {
    return null
  }
}

function collectDeps(pkg) {
  return {
    ...pkg.dependencies,
    ...pkg.peerDependencies,
  }
}

function checkPkg(relPath) {
  const dir = join(ROOT, relPath)
  const pkg = readPkg(dir)
  if (!pkg) return
  const rule = ALLOWED[relPath]
  if (rule == null) return

  const deps = collectDeps(pkg)
  for (const name of Object.keys(deps)) {
    if (INTERNAL.test(name)) {
      if (!rule.has(name) && name !== `@duedatehq/typescript-config`) {
        violations.push(`${relPath} must NOT depend on ${name}`)
      }
      continue
    }
    if (rule.size && !rule.has(name) && relPath === 'packages/contracts') {
      violations.push(`${relPath} may only use {${[...rule].join(', ')}} — found ${name}`)
    }
  }
}

function listWorkspaces() {
  const out = []
  for (const ns of ['apps', 'packages']) {
    const nsDir = join(ROOT, ns)
    if (!statSync(nsDir, { throwIfNoEntry: false })) continue
    for (const name of readdirSync(nsDir)) {
      const full = join(nsDir, name)
      if (!statSync(full).isDirectory()) continue
      out.push(`${ns}/${name}`)
    }
  }
  return out
}

for (const ws of listWorkspaces()) {
  checkPkg(ws)
}

if (violations.length) {
  console.error('\n✗ Dependency-direction violations:\n')
  for (const v of violations) console.error('  • ' + v)
  console.error('\nSee docs/dev-file/08 §6 for the allowed DAG.\n')
  process.exit(1)
}

console.log('✓ Dependency direction OK')
