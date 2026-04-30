import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { createDb, makePulseOpsRepo } from '@duedatehq/db'
import { livePulseAdapters } from '@duedatehq/ingest/adapters'
import type { ContextVars, Env } from '../env'

type OpsPulseEnv = Pick<Env, 'DB' | 'R2_PULSE' | 'PULSE_QUEUE' | 'PULSE_OPS_TOKEN'>

function requireOpsToken(c: {
  env: OpsPulseEnv
  req: { header(name: string): string | undefined }
}) {
  const configured = c.env.PULSE_OPS_TOKEN
  if (!configured) throw new HTTPException(503, { message: 'Pulse ops token is not configured.' })
  const header = c.req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token || token !== configured) {
    throw new HTTPException(401, { message: 'Invalid Pulse ops token.' })
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function bodyJson(c: {
  req: { json(): Promise<unknown> }
}): Promise<Record<string, unknown>> {
  try {
    const body = await c.req.json()
    return isRecord(body) ? body : {}
  } catch {
    return {}
  }
}

function requireString(body: Record<string, unknown>, key: string): string {
  const value = body[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new HTTPException(400, { message: `${key} is required.` })
  }
  return value
}

function optionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function actorId(body: Record<string, unknown>): string {
  return optionalString(body, 'actorId') ?? requireString(body, 'reviewedBy')
}

function serializePulse(
  row: Awaited<ReturnType<ReturnType<typeof makePulseOpsRepo>['getPulseReview']>>,
) {
  if (!row) return null
  return {
    ...row,
    publishedAt: row.publishedAt.toISOString(),
    originalDueDate: row.originalDueDate.toISOString().slice(0, 10),
    newDueDate: row.newDueDate.toISOString().slice(0, 10),
    effectiveFrom: row.effectiveFrom ? row.effectiveFrom.toISOString().slice(0, 10) : null,
    createdAt: row.createdAt.toISOString(),
  }
}

function serializeSignal(
  row: Awaited<ReturnType<ReturnType<typeof makePulseOpsRepo>['listSourceSignals']>>[number],
) {
  return {
    ...row,
    publishedAt: row.publishedAt.toISOString(),
    fetchedAt: row.fetchedAt.toISOString(),
  }
}

function serializeSourceState(
  row: Awaited<ReturnType<ReturnType<typeof makePulseOpsRepo>['listSourceStates']>>[number],
) {
  const adapter = livePulseAdapters.find((item) => item.id === row.sourceId)
  return {
    ...row,
    label: adapter?.id ?? row.sourceId,
    lastCheckedAt: row.lastCheckedAt?.toISOString() ?? null,
    lastSuccessAt: row.lastSuccessAt?.toISOString() ?? null,
    lastChangeDetectedAt: row.lastChangeDetectedAt?.toISOString() ?? null,
    nextCheckAt: row.nextCheckAt?.toISOString() ?? null,
  }
}

function serializeSnapshot(
  row: Awaited<
    ReturnType<ReturnType<typeof makePulseOpsRepo>['listFailedSourceSnapshots']>
  >[number],
) {
  return {
    ...row,
    publishedAt: row.publishedAt.toISOString(),
    fetchedAt: row.fetchedAt.toISOString(),
  }
}

export const opsPulseRoute = new Hono<{
  Bindings: OpsPulseEnv
  Variables: ContextVars
}>()
  .use('*', async (c, next) => {
    requireOpsToken(c)
    await next()
  })
  .get('/pending', async (c) => {
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const rows = await repo.listPendingPulses({ limit: 50 })
    return c.json({ pulses: rows.map((row) => serializePulse(row)) })
  })
  .get('/signals', async (c) => {
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const status = c.req.query('status')
    const rows = await repo.listSourceSignals({
      limit: 100,
      ...(status === 'open' || status === 'linked' || status === 'dismissed' ? { status } : {}),
    })
    return c.json({ signals: rows.map(serializeSignal) })
  })
  .get('/sources', async (c) => {
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const rows = await repo.listSourceStates()
    return c.json({ sources: rows.map(serializeSourceState) })
  })
  .get('/snapshots/failed', async (c) => {
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const rows = await repo.listFailedSourceSnapshots({ limit: 100 })
    return c.json({ snapshots: rows.map(serializeSnapshot) })
  })
  .post('/signals/link-open', async (c) => {
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const result = await repo.linkOpenSignalsToPulses()
    return c.json({ ok: true, ...result })
  })
  .post('/signals/:signalId/link', async (c) => {
    const body = await bodyJson(c)
    const pulseId = requireString(body, 'pulseId')
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const signal = await repo.linkSourceSignal({
      signalId: c.req.param('signalId'),
      pulseId,
    })
    return c.json({ ok: true, signal: serializeSignal(signal) })
  })
  .post('/signals/:signalId/dismiss', async (c) => {
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const signal = await repo.dismissSourceSignal(c.req.param('signalId'))
    return c.json({ ok: true, signal: serializeSignal(signal) })
  })
  .post('/sources/:sourceId/disable', async (c) => {
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    await repo.setSourceEnabled({ sourceId: c.req.param('sourceId'), enabled: false })
    return c.json({ ok: true })
  })
  .post('/sources/:sourceId/enable', async (c) => {
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    await repo.setSourceEnabled({ sourceId: c.req.param('sourceId'), enabled: true })
    return c.json({ ok: true })
  })
  .post('/sources/:sourceId/revoke', async (c) => {
    const body = await bodyJson(c)
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const result = await repo.revokeSourcePulses({
      sourceId: c.req.param('sourceId'),
      actorId: actorId(body),
      reason: optionalString(body, 'reason') ?? null,
    })
    return c.json({ ok: true, ...result })
  })
  .post('/snapshots/:snapshotId/retry', async (c) => {
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const snapshot = await repo.getSourceSnapshot(c.req.param('snapshotId'))
    if (!snapshot) throw new HTTPException(404, { message: 'Pulse snapshot not found.' })
    await repo.updateSourceSnapshotStatus(snapshot.id, {
      parseStatus: 'pending_extract',
      failureReason: null,
    })
    await c.env.PULSE_QUEUE.send({ type: 'pulse.extract', snapshotId: snapshot.id })
    return c.json({ ok: true, snapshotId: snapshot.id })
  })
  .get('/:pulseId', async (c) => {
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const pulse = await repo.getPulseReview(c.req.param('pulseId'))
    if (!pulse) throw new HTTPException(404, { message: 'Pulse not found.' })
    let rawText: string | null = null
    if (pulse.rawR2Key) {
      const raw = await c.env.R2_PULSE.get(pulse.rawR2Key)
      rawText = raw ? await raw.text() : null
    }
    return c.json({ pulse: serializePulse(pulse), rawText })
  })
  .post('/:pulseId/approve', async (c) => {
    const body = await bodyJson(c)
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    const result = await repo.approvePulse({
      pulseId: c.req.param('pulseId'),
      reviewedBy: actorId(body),
    })
    return c.json({ ok: true, ...result })
  })
  .post('/:pulseId/reject', async (c) => {
    const body = await bodyJson(c)
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    await repo.rejectPulse({
      pulseId: c.req.param('pulseId'),
      reviewedBy: actorId(body),
      reason: optionalString(body, 'reason') ?? null,
    })
    return c.json({ ok: true })
  })
  .post('/:pulseId/quarantine', async (c) => {
    const body = await bodyJson(c)
    const repo = makePulseOpsRepo(createDb(c.env.DB))
    await repo.quarantinePulse({
      pulseId: c.req.param('pulseId'),
      actorId: actorId(body),
      reason: optionalString(body, 'reason') ?? null,
    })
    return c.json({ ok: true })
  })
