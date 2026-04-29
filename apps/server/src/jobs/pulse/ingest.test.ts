/* eslint-disable typescript-eslint/no-unsafe-type-assertion --
 * Focused Worker doubles only implement the Pulse ingest repo/R2/Queue surface.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SourceAdapter } from '@duedatehq/ingest/types'
import type { Env } from '../../env'
import { runPulseIngest } from './ingest'

const { dbMocks, repoMocks } = vi.hoisted(() => {
  const repo = {
    ensureSourceState: vi.fn(),
    getSourceState: vi.fn(),
    createSourceSignal: vi.fn(),
    createSourceSnapshot: vi.fn(),
    recordSourceSuccess: vi.fn(),
    recordSourceFailure: vi.fn(),
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

function env(queueSend = vi.fn()): Pick<Env, 'DB' | 'R2_PULSE' | 'PULSE_QUEUE'> {
  return {
    DB: {} as D1Database,
    R2_PULSE: {
      put: vi.fn(async () => undefined),
    } as unknown as R2Bucket,
    PULSE_QUEUE: {
      send: queueSend,
    } as unknown as Queue,
  }
}

function adapter(overrides: Partial<SourceAdapter> = {}): SourceAdapter {
  return {
    id: 'fema.declarations',
    tier: 'T2',
    jurisdiction: 'US',
    cronIntervalMs: 60_000,
    canCreatePulse: false,
    async fetch() {
      return [
        {
          sourceId: 'fema.declarations',
          fetchedAt: new Date('2026-04-30T00:00:00.000Z'),
          contentHash: 'raw-hash',
          r2Key: 'raw.html',
          body: 'raw body',
          contentType: 'text/html',
          etag: 'etag-1',
          lastModified: null,
        },
      ]
    },
    async parse() {
      return [
        {
          sourceId: 'fema.declarations',
          externalId: 'DR-123',
          title: 'FEMA declaration',
          publishedAt: new Date('2026-04-29T00:00:00.000Z'),
          officialSourceUrl: 'https://www.fema.gov/disaster/123',
          rawText: 'FEMA declaration raw text',
        },
      ]
    },
    ...overrides,
  }
}

describe('runPulseIngest', () => {
  beforeEach(() => {
    Object.values(dbMocks).forEach((mock) => mock.mockClear())
    Object.values(repoMocks).forEach((mock) => mock.mockReset())
    repoMocks.ensureSourceState.mockResolvedValue({
      enabled: true,
      nextCheckAt: null,
    })
    repoMocks.getSourceState.mockResolvedValue(null)
    repoMocks.createSourceSignal.mockResolvedValue({ inserted: true, signal: { id: 'signal-1' } })
    repoMocks.createSourceSnapshot.mockResolvedValue({
      inserted: true,
      snapshot: { id: 'snapshot-1' },
    })
  })

  it('keeps T2 adapters as source signals instead of queueing extract', async () => {
    const queueSend = vi.fn()

    const result = await runPulseIngest(env(queueSend), [adapter()])

    expect(result).toMatchObject({ signals: 1, queued: 0, failures: 0 })
    expect(repoMocks.createSourceSignal).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 'fema.declarations',
        signalType: 'anticipated_pulse',
      }),
    )
    expect(repoMocks.createSourceSnapshot).not.toHaveBeenCalled()
    expect(queueSend).not.toHaveBeenCalled()
  })

  it('classifies changed snapshots with no parsed items as selector drift', async () => {
    const result = await runPulseIngest(env(), [
      adapter({
        canCreatePulse: true,
        async parse() {
          return []
        },
      }),
    ])

    expect(result).toMatchObject({ failures: 1, queued: 0, signals: 0 })
    expect(repoMocks.recordSourceFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 'fema.declarations',
        error: expect.stringContaining('selector_drift'),
      }),
    )
  })
})
