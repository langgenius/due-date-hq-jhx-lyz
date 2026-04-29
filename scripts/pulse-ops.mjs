#!/usr/bin/env node

const [command, ...args] = process.argv.slice(2)

const baseUrl = process.env.PULSE_OPS_BASE_URL
const token = process.env.PULSE_OPS_TOKEN

function usage(exitCode = 1) {
  console.log(`Usage:
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs pending
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs show <pulseId>
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs approve <pulseId> <reviewedBy>
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs reject <pulseId> <reviewedBy>
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs quarantine <pulseId> [reason]
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs retry-snapshot <snapshotId>`)
  process.exit(exitCode)
}

if (!command || command === '--help' || command === '-h') usage(command ? 0 : 1)
if (!baseUrl || !token) {
  console.error('PULSE_OPS_BASE_URL and PULSE_OPS_TOKEN are required.')
  usage(1)
}

function endpoint(path) {
  return new URL(`/api/ops/pulse${path}`, baseUrl).toString()
}

async function request(path, init = {}) {
  const response = await fetch(endpoint(path), {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  })
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!response.ok) {
    console.error(JSON.stringify(body, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify(body, null, 2))
}

if (command === 'pending') {
  await request('/pending')
} else if (command === 'show') {
  const [pulseId] = args
  if (!pulseId) usage()
  await request(`/${encodeURIComponent(pulseId)}`)
} else if (command === 'approve' || command === 'reject') {
  const [pulseId, reviewedBy] = args
  if (!pulseId || !reviewedBy) usage()
  await request(`/${encodeURIComponent(pulseId)}/${command}`, {
    method: 'POST',
    body: JSON.stringify({ reviewedBy }),
  })
} else if (command === 'quarantine') {
  const [pulseId, ...reasonParts] = args
  if (!pulseId) usage()
  await request(`/${encodeURIComponent(pulseId)}/quarantine`, {
    method: 'POST',
    body: JSON.stringify({ reason: reasonParts.join(' ') || undefined }),
  })
} else if (command === 'retry-snapshot') {
  const [snapshotId] = args
  if (!snapshotId) usage()
  await request(`/snapshots/${encodeURIComponent(snapshotId)}/retry`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
} else {
  usage()
}
