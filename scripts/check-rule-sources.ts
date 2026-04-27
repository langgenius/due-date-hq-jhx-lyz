#!/usr/bin/env node
/// <reference types="node" />
import { execFile } from 'node:child_process'
import { RULE_SOURCES, type RuleSource } from '../packages/core/src/rules/index.ts'

type CheckedMethod = 'HEAD' | 'GET'

type RuleSourceHealthResult =
  | {
      sourceId: string
      status: 'ok'
      httpStatus: number
      checkedUrl: string
      checkedMethod: CheckedMethod
    }
  | {
      sourceId: string
      status: 'failed'
      httpStatus: number | null
      checkedUrl: string
      checkedMethod: CheckedMethod
      reason: string
    }
  | {
      sourceId: string
      status: 'skipped'
      httpStatus: null
      checkedUrl: string
      checkedMethod: null
      reason: string
    }

const SOURCE_FETCH_HEADERS = {
  accept: 'text/html,application/pdf,application/json;q=0.9,*/*;q=0.8',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
} as const

function runCurl(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('curl', args, { encoding: 'utf8' }, (error: Error | null, stdout: string) => {
      if (error) {
        reject(error)
        return
      }

      resolve(stdout)
    })
  })
}

async function curlStatus(url: string, method: CheckedMethod): Promise<number> {
  const args = [
    '-L',
    '--silent',
    '--show-error',
    '--max-time',
    '20',
    '--output',
    '/dev/null',
    '--write-out',
    '%{http_code}',
    '-A',
    SOURCE_FETCH_HEADERS['user-agent'],
    '-H',
    `Accept: ${SOURCE_FETCH_HEADERS.accept}`,
  ]

  if (method === 'HEAD') args.push('-I')
  args.push(url)

  return Number((await runCurl(args)).trim())
}

async function checkRuleSource(source: RuleSource): Promise<RuleSourceHealthResult> {
  if (source.acquisitionMethod === 'manual_review') {
    return {
      sourceId: source.id,
      status: 'skipped',
      httpStatus: null,
      checkedUrl: source.url,
      checkedMethod: null,
      reason: 'manual_review source is not expected to be machine-fetched.',
    }
  }

  try {
    const headStatus = await curlStatus(source.url, 'HEAD')
    if (headStatus >= 200 && headStatus < 400) {
      return {
        sourceId: source.id,
        status: 'ok',
        httpStatus: headStatus,
        checkedUrl: source.url,
        checkedMethod: 'HEAD',
      }
    }

    const getStatus = await curlStatus(source.url, 'GET')
    if (getStatus >= 200 && getStatus < 400) {
      return {
        sourceId: source.id,
        status: 'ok',
        httpStatus: getStatus,
        checkedUrl: source.url,
        checkedMethod: 'GET',
      }
    }

    return {
      sourceId: source.id,
      status: 'failed',
      httpStatus: getStatus,
      checkedUrl: source.url,
      checkedMethod: 'GET',
      reason: `HTTP ${getStatus}`,
    }
  } catch (error) {
    return {
      sourceId: source.id,
      status: 'failed',
      httpStatus: null,
      checkedUrl: source.url,
      checkedMethod: 'GET',
      reason: error instanceof Error ? error.message : 'Unknown curl error',
    }
  }
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function checkWithRetry(source: RuleSource): Promise<RuleSourceHealthResult> {
  const first = await checkRuleSource(source)
  if (first.status !== 'failed' || first.httpStatus !== null) return first

  await wait(500)
  return checkRuleSource(source)
}

const results = await Promise.all(RULE_SOURCES.map(checkWithRetry))

for (const result of results) {
  const status =
    result.status === 'ok'
      ? `${result.status} ${result.httpStatus} ${result.checkedMethod}`
      : result.status === 'skipped'
        ? `${result.status} ${result.reason}`
        : `${result.status} ${result.httpStatus ?? 'no-status'} ${result.reason}`

  console.log(`${result.sourceId}\t${status}\t${result.checkedUrl}`)
}

const failed = results.filter((result) => result.status === 'failed')

if (failed.length > 0) {
  process.exitCode = 1
}
