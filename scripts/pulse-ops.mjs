#!/usr/bin/env node

const [command, ...args] = process.argv.slice(2)

const baseUrl = process.env.PULSE_OPS_BASE_URL
const token = process.env.PULSE_OPS_TOKEN

function usage(exitCode = 1) {
  console.log(`Usage:
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs pending
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs show <pulseId>
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs approve <pulseId> <actorId>
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs reject <pulseId> <actorId> [reason]
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs quarantine <pulseId> <actorId> [reason]
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs signals [open|linked|dismissed]
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs link-open-signals
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs link-signal <signalId> <pulseId>
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs dismiss-signal <signalId>
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs source-disable <sourceId>
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs source-enable <sourceId>
  PULSE_OPS_BASE_URL=https://app.example.com PULSE_OPS_TOKEN=... node scripts/pulse-ops.mjs source-revoke <sourceId> <actorId> [reason]
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
} else if (command === 'signals') {
  const [status] = args
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  await request(`/signals${query}`)
} else if (command === 'show') {
  const [pulseId] = args
  if (!pulseId) usage()
  await request(`/${encodeURIComponent(pulseId)}`)
} else if (command === 'approve' || command === 'reject') {
  const [pulseId, actorId, ...reasonParts] = args
  if (!pulseId || !actorId) usage()
  await request(`/${encodeURIComponent(pulseId)}/${command}`, {
    method: 'POST',
    body: JSON.stringify({ actorId, reason: reasonParts.join(' ') || undefined }),
  })
} else if (command === 'quarantine') {
  const [pulseId, actorId, ...reasonParts] = args
  if (!pulseId || !actorId) usage()
  await request(`/${encodeURIComponent(pulseId)}/quarantine`, {
    method: 'POST',
    body: JSON.stringify({ actorId, reason: reasonParts.join(' ') || undefined }),
  })
} else if (command === 'link-open-signals') {
  await request('/signals/link-open', {
    method: 'POST',
    body: JSON.stringify({}),
  })
} else if (command === 'link-signal') {
  const [signalId, pulseId] = args
  if (!signalId || !pulseId) usage()
  await request(`/signals/${encodeURIComponent(signalId)}/link`, {
    method: 'POST',
    body: JSON.stringify({ pulseId }),
  })
} else if (command === 'dismiss-signal') {
  const [signalId] = args
  if (!signalId) usage()
  await request(`/signals/${encodeURIComponent(signalId)}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
} else if (command === 'source-disable' || command === 'source-enable') {
  const [sourceId] = args
  if (!sourceId) usage()
  await request(
    `/sources/${encodeURIComponent(sourceId)}/${command === 'source-disable' ? 'disable' : 'enable'}`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  )
} else if (command === 'source-revoke') {
  const [sourceId, actorId, ...reasonParts] = args
  if (!sourceId || !actorId) usage()
  await request(`/sources/${encodeURIComponent(sourceId)}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ actorId, reason: reasonParts.join(' ') || undefined }),
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
