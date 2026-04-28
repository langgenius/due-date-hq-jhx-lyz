import { describe, expect, it } from 'vitest'
import { makeMigrationRepo } from './migration'

describe('makeMigrationRepo', () => {
  it('splits normalization inserts within the D1 bound variable limit', async () => {
    const insertBatchSizes: number[] = []
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [{ id: 'batch-1' }],
          }),
        }),
      }),
      insert: () => ({
        values: (values: unknown[]) => {
          insertBatchSizes.push(values.length)
          return Promise.resolve()
        },
      }),
    }

    // @ts-expect-error fake db implements only the select/insert chains used by this method.
    const repo = makeMigrationRepo(db, 'firm-1')
    const count = await repo.createNormalizations(
      'batch-1',
      Array.from({ length: 11 }, (_, index) => ({
        field: 'entity_type',
        rawValue: `raw-${index}`,
        normalizedValue: 'llc',
        confidence: 0.85,
        model: null,
        promptVersion: 'dictionary@v1',
        reasoning: 'Local dictionary fallback.',
        userOverridden: false,
      })),
    )

    expect(count).toBe(11)
    expect(insertBatchSizes).toEqual([10, 1])
  })
})
