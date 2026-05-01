/* eslint-disable typescript-eslint/no-unsafe-type-assertion --
 * Focused Hono route doubles only implement the DB/R2/Queue methods this route touches.
 */
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContextVars, Env } from '../env'
import { opsPulseRoute } from './ops-pulse'

type TestEnv = Pick<Env, 'DB' | 'R2_PULSE' | 'PULSE_QUEUE' | 'PULSE_OPS_TOKEN'>

const { dbMocks, repoMocks } = vi.hoisted(() => {
  const repo = {
    listPendingPulses: vi.fn(),
    getSourceSnapshot: vi.fn(),
    updateSourceSnapshotStatus: vi.fn(),
    getPulseReview: vi.fn(),
    approvePulse: vi.fn(),
    rejectPulse: vi.fn(),
    quarantinePulse: vi.fn(),
    listSourceSignals: vi.fn(),
    linkOpenSignalsToPulses: vi.fn(),
    linkSourceSignal: vi.fn(),
    dismissSourceSignal: vi.fn(),
    setSourceEnabled: vi.fn(),
    revokeSourcePulses: vi.fn(),
  }
  return {
    repoMocks: repo,
    dbMocks: {
      createDb: vi.fn(() => ({})),
      makePulseOpsRepo: vi.fn(() => repo),
    },
  }
})

vi.mock('@duedatehq/db', () => ({
  createDb: dbMocks.createDb,
  makePulseOpsRepo: dbMocks.makePulseOpsRepo,
}))

const testD1 = {} as D1Database

function createTestApp() {
  const app = new Hono<{ Bindings: TestEnv; Variables: ContextVars }>()
  app.route('/api/ops/pulse', opsPulseRoute)
  return app
}

function env(overrides: Partial<TestEnv> = {}): TestEnv {
  return {
    DB: testD1,
    PULSE_OPS_TOKEN: 'ops-token',
    R2_PULSE: {
      async get() {
        return null
      },
    } as unknown as R2Bucket,
    PULSE_QUEUE: {
      send: vi.fn(),
    } as unknown as Queue,
    ...overrides,
  }
}

function authed(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers)
  headers.set('authorization', 'Bearer ops-token')
  return {
    ...init,
    headers,
  }
}

const PENDING_ROW = {
  pulseId: 'pulse-1',
  source: 'irs.disaster',
  sourceUrl: 'https://www.irs.gov/newsroom/tax-relief',
  summary: 'Summary',
  sourceExcerpt: 'Quote',
  jurisdiction: 'CA',
  counties: ['Los Angeles'],
  forms: ['federal_1065'],
  entityTypes: ['llc'],
  publishedAt: new Date('2026-04-15T00:00:00.000Z'),
  originalDueDate: new Date('2026-03-15T00:00:00.000Z'),
  newDueDate: new Date('2026-10-15T00:00:00.000Z'),
  effectiveFrom: null,
  createdAt: new Date('2026-04-15T01:00:00.000Z'),
  status: 'pending_review',
  confidence: 0.91,
  rawR2Key: null,
}

describe('opsPulseRoute', () => {
  beforeEach(() => {
    Object.values(dbMocks).forEach((mock) => mock.mockClear())
    Object.values(repoMocks).forEach((mock) => mock.mockReset())
  })

  it('rejects requests when the ops token is missing or invalid', async () => {
    const app = createTestApp()

    const missing = await app.request(
      '/api/ops/pulse/pending',
      {},
      env({ PULSE_OPS_TOKEN: undefined }),
    )
    const invalid = await app.request(
      '/api/ops/pulse/pending',
      { headers: { authorization: 'Bearer wrong-token' } },
      env(),
    )

    expect(missing.status).toBe(503)
    expect(invalid.status).toBe(401)
    expect(dbMocks.createDb).not.toHaveBeenCalled()
  })

  it('lists pending pulses for ops review', async () => {
    repoMocks.listPendingPulses.mockResolvedValueOnce([PENDING_ROW])

    const response = await createTestApp().request('/api/ops/pulse/pending', authed(), env())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      pulses: [
        {
          pulseId: 'pulse-1',
          publishedAt: '2026-04-15T00:00:00.000Z',
          originalDueDate: '2026-03-15',
          newDueDate: '2026-10-15',
        },
      ],
    })
  })

  it('retries snapshot extraction through the Pulse queue', async () => {
    const queueSend = vi.fn()
    repoMocks.getSourceSnapshot.mockResolvedValueOnce({ id: 'snapshot-1' })

    const response = await createTestApp().request(
      '/api/ops/pulse/snapshots/snapshot-1/retry',
      authed({ method: 'POST' }),
      env({ PULSE_QUEUE: { send: queueSend } as unknown as Queue }),
    )

    expect(response.status).toBe(200)
    expect(repoMocks.updateSourceSnapshotStatus).toHaveBeenCalledWith('snapshot-1', {
      parseStatus: 'pending_extract',
      failureReason: null,
    })
    expect(queueSend).toHaveBeenCalledWith({ type: 'pulse.extract', snapshotId: 'snapshot-1' })
  })

  it('forwards approve, reject, and quarantine actions to the ops repo', async () => {
    repoMocks.approvePulse.mockResolvedValueOnce({ affectedFirmCount: 2 })

    const approve = await createTestApp().request(
      '/api/ops/pulse/pulse-1/approve',
      authed({
        method: 'POST',
        body: JSON.stringify({ reviewedBy: 'ops-user' }),
      }),
      env(),
    )
    const reject = await createTestApp().request(
      '/api/ops/pulse/pulse-1/reject',
      authed({
        method: 'POST',
        body: JSON.stringify({ reviewedBy: 'ops-user', reason: 'Bad extract' }),
      }),
      env(),
    )
    const quarantine = await createTestApp().request(
      '/api/ops/pulse/pulse-1/quarantine',
      authed({
        method: 'POST',
        body: JSON.stringify({ reviewedBy: 'ops-user', reason: 'Source excerpt mismatch' }),
      }),
      env(),
    )

    expect(approve.status).toBe(200)
    expect(reject.status).toBe(200)
    expect(quarantine.status).toBe(200)
    expect(repoMocks.approvePulse).toHaveBeenCalledWith({
      pulseId: 'pulse-1',
      reviewedBy: 'ops-user',
    })
    expect(repoMocks.rejectPulse).toHaveBeenCalledWith({
      pulseId: 'pulse-1',
      reviewedBy: 'ops-user',
      reason: 'Bad extract',
    })
    expect(repoMocks.quarantinePulse).toHaveBeenCalledWith({
      pulseId: 'pulse-1',
      actorId: 'ops-user',
      reason: 'Source excerpt mismatch',
    })
  })

  it('requires a reason for reject and quarantine decisions', async () => {
    const app = createTestApp()

    const reject = await app.request(
      '/api/ops/pulse/pulse-1/reject',
      authed({
        method: 'POST',
        body: JSON.stringify({ reviewedBy: 'ops-user', reason: '   ' }),
      }),
      env(),
    )
    const quarantine = await app.request(
      '/api/ops/pulse/pulse-1/quarantine',
      authed({
        method: 'POST',
        body: JSON.stringify({ reviewedBy: 'ops-user' }),
      }),
      env(),
    )

    expect(reject.status).toBe(400)
    expect(quarantine.status).toBe(400)
    expect(repoMocks.rejectPulse).not.toHaveBeenCalled()
    expect(repoMocks.quarantinePulse).not.toHaveBeenCalled()
  })

  it('manages source signals and source health from ops routes', async () => {
    const signal = {
      id: 'signal-1',
      sourceId: 'fema.declarations',
      externalId: 'fema-1',
      title: 'FEMA declaration',
      officialSourceUrl: 'https://www.fema.gov',
      publishedAt: new Date('2026-04-30T00:00:00.000Z'),
      fetchedAt: new Date('2026-04-30T00:05:00.000Z'),
      contentHash: 'hash',
      rawR2Key: 'pulse/fema.txt',
      tier: 'T2',
      jurisdiction: 'CA',
      signalType: 'anticipated_pulse',
      status: 'open',
      linkedPulseId: null,
    }
    repoMocks.listSourceSignals.mockResolvedValueOnce([signal])
    repoMocks.linkOpenSignalsToPulses.mockResolvedValueOnce({ linked: 1, inspected: 1 })
    repoMocks.linkSourceSignal.mockResolvedValueOnce({
      ...signal,
      status: 'linked',
      linkedPulseId: 'pulse-1',
    })
    repoMocks.dismissSourceSignal.mockResolvedValueOnce({ ...signal, status: 'dismissed' })
    repoMocks.revokeSourcePulses.mockResolvedValueOnce({ revokedCount: 2 })

    const app = createTestApp()
    const list = await app.request('/api/ops/pulse/signals?status=open', authed(), env())
    const autoLink = await app.request(
      '/api/ops/pulse/signals/link-open',
      authed({ method: 'POST' }),
      env(),
    )
    const manualLink = await app.request(
      '/api/ops/pulse/signals/signal-1/link',
      authed({ method: 'POST', body: JSON.stringify({ pulseId: 'pulse-1' }) }),
      env(),
    )
    const dismiss = await app.request(
      '/api/ops/pulse/signals/signal-1/dismiss',
      authed({ method: 'POST' }),
      env(),
    )
    const disable = await app.request(
      '/api/ops/pulse/sources/fema.declarations/disable',
      authed({ method: 'POST' }),
      env(),
    )
    const revoke = await app.request(
      '/api/ops/pulse/sources/fema.declarations/revoke',
      authed({ method: 'POST', body: JSON.stringify({ actorId: 'ops-user', reason: 'Takedown' }) }),
      env(),
    )

    expect(list.status).toBe(200)
    expect(autoLink.status).toBe(200)
    expect(manualLink.status).toBe(200)
    expect(dismiss.status).toBe(200)
    expect(disable.status).toBe(200)
    expect(revoke.status).toBe(200)
    expect(repoMocks.setSourceEnabled).toHaveBeenCalledWith({
      sourceId: 'fema.declarations',
      enabled: false,
    })
    expect(repoMocks.revokeSourcePulses).toHaveBeenCalledWith({
      sourceId: 'fema.declarations',
      actorId: 'ops-user',
      reason: 'Takedown',
    })
  })
})
