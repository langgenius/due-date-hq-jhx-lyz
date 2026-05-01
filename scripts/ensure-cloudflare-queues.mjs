#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const [, , configArg, ...flags] = process.argv
const isDryRun = flags.includes('--dry-run')

if (!configArg) {
  console.error('Usage: node scripts/ensure-cloudflare-queues.mjs <wrangler.toml> [--dry-run]')
  process.exit(1)
}

const configPath = path.resolve(process.cwd(), configArg)
const configDir = path.dirname(configPath)
const configFile = path.basename(configPath)
const configText = readFileSync(configPath, 'utf8')
const declaredQueueNames = extractQueueNames(configText)

if (declaredQueueNames.length === 0) {
  console.log(`No Cloudflare Queues declared in ${configArg}.`)
  process.exit(0)
}

if (isDryRun) {
  console.log(`Cloudflare Queues declared in ${configArg}:`)
  for (const queueName of declaredQueueNames) {
    console.log(`- ${queueName}`)
  }
  process.exit(0)
}

for (const queueName of declaredQueueNames) {
  ensureQueue(queueName)
}

/**
 * @param {string} config
 * @returns {string[]}
 */
function extractQueueNames(config) {
  /** @type {Set<string>} */
  const names = new Set()
  let section = ''

  for (const rawLine of config.split(/\r?\n/)) {
    const line = stripInlineComment(rawLine).trim()
    if (!line) {
      continue
    }

    const sectionMatch = line.match(/^\[+\s*([^\]]+?)\s*\]+$/)
    if (sectionMatch) {
      section = sectionMatch[1].trim()
      continue
    }

    if (!section.startsWith('queues.')) {
      continue
    }

    const queueMatch = line.match(/^(queue|dead_letter_queue)\s*=\s*(['"])(.*?)\2\s*$/)
    if (queueMatch) {
      const queueName = queueMatch[3]
      if (queueName) {
        names.add(queueName)
      }
    }
  }

  return [...names]
}

/**
 * @param {string} line
 * @returns {string}
 */
function stripInlineComment(line) {
  let quote = ''
  let escaped = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (character === '\\' && quote === '"') {
      escaped = true
      continue
    }

    if ((character === '"' || character === "'") && !quote) {
      quote = character
      continue
    }

    if (character === quote) {
      quote = ''
      continue
    }

    if (character === '#' && !quote) {
      return line.slice(0, index)
    }
  }

  return line
}

/**
 * @param {string} queueName
 */
function ensureQueue(queueName) {
  const info = runWrangler(['queues', 'info', queueName])
  if (info.status === 0) {
    console.log(`Cloudflare Queue exists: ${queueName}`)
    return
  }

  const output = `${info.stdout}\n${info.stderr}`
  if (!output.includes(`Queue "${queueName}" does not exist`)) {
    printCommandOutput(output)
    throw new Error(`Unable to inspect Cloudflare Queue: ${queueName}`)
  }

  console.log(`Creating Cloudflare Queue: ${queueName}`)
  const created = runWrangler(['queues', 'create', queueName])
  if (created.status !== 0) {
    printCommandOutput(`${created.stdout}\n${created.stderr}`)
    throw new Error(`Unable to create Cloudflare Queue: ${queueName}`)
  }
}

/**
 * @param {string[]} args
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function runWrangler(args) {
  return spawnSync(
    'pnpm',
    ['--dir', configDir, 'exec', 'wrangler', ...args, '--config', configFile],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: process.env.WRANGLER_SEND_METRICS ?? 'false',
      },
    },
  )
}

/**
 * @param {string} output
 */
function printCommandOutput(output) {
  const trimmed = output.trim()
  if (trimmed) {
    console.error(trimmed)
  }
}
