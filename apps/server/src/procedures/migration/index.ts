import { ORPCError } from '@orpc/server'
import { createAI } from '@duedatehq/ai'
import { requireTenant, type RpcContext } from '../_context'
import { os } from '../_root'
import { MigrationService } from './_service'

/**
 * migration.* — Demo Sprint subset of the Migration Copilot contract.
 *
 * Current DDL cut: createBatch / uploadRaw / runMapper / confirmMapping /
 * runNormalizer / confirmNormalization / applyDefaultMatrix / dryRun /
 * apply / getBatch / listErrors. Revert and singleUndo remain deferred.
 */

function buildService(ctx: RpcContext): MigrationService {
  const { scoped, userId } = requireTenant(ctx)
  return new MigrationService({
    scoped,
    userId,
    ai: createAI(ctx.env),
  })
}

const createBatch = os.migration.createBatch.handler(async ({ input, context }) => {
  const service = buildService(context)
  const args: Parameters<MigrationService['createBatch']>[0] = {
    source: input.source,
    presetUsed: input.presetUsed ?? null,
  }
  if (input.rowCount !== undefined) args.rowCount = input.rowCount
  return service.createBatch(args)
})

const uploadRaw = os.migration.uploadRaw.handler(async ({ input, context }) => {
  const service = buildService(context)
  if (!input.inline) {
    throw new ORPCError('NOT_IMPLEMENTED', {
      message:
        'Real R2 signed-URL uploads land in Phase 0; Demo Sprint requires the inline payload.',
    })
  }
  const out: Parameters<MigrationService['uploadRaw']>[0] = {
    batchId: input.batchId,
    kind: input.inline.kind,
  }
  if (input.inline.text !== undefined) out.text = input.inline.text
  if (input.inline.base64 !== undefined) out.base64 = input.inline.base64
  return service.uploadRaw(out)
})

const runMapper = os.migration.runMapper.handler(async ({ input, context }) => {
  const service = buildService(context)
  return service.runMapper(input.batchId)
})

const confirmMapping = os.migration.confirmMapping.handler(async ({ input, context }) => {
  const service = buildService(context)
  return service.confirmMapping(input.batchId, input.mappings)
})

const runNormalizer = os.migration.runNormalizer.handler(async ({ input, context }) => {
  const service = buildService(context)
  return service.runNormalizer(input.batchId)
})

const confirmNormalization = os.migration.confirmNormalization.handler(
  async ({ input, context }) => {
    const service = buildService(context)
    return service.confirmNormalization(input.batchId, input.normalizations)
  },
)

const applyDefaultMatrix = os.migration.applyDefaultMatrix.handler(async ({ input, context }) => {
  const service = buildService(context)
  return service.applyDefaultMatrix(input.batchId)
})

const dryRun = os.migration.dryRun.handler(async ({ input, context }) => {
  const service = buildService(context)
  return service.dryRun(input.batchId)
})

const apply = os.migration.apply.handler(async ({ input, context }) => {
  const service = buildService(context)
  return service.apply(input.batchId)
})

const getBatch = os.migration.getBatch.handler(async ({ input, context }) => {
  const service = buildService(context)
  return service.getBatch(input.batchId)
})

const listErrors = os.migration.listErrors.handler(async ({ input, context }) => {
  const service = buildService(context)
  const errors = await service.listErrors(input.batchId, input.stage ?? 'all')
  return { errors }
})

// Day 4 stubs — keep contracts implemented; throw a typed NOT_IMPLEMENTED.
function notImplemented(): never {
  throw new ORPCError('ORPC_NOT_IMPLEMENTED', {
    message: 'This procedure lands in feat/migration/step4-commit (JHX Day 4).',
  })
}

const revert = os.migration.revert.handler(notImplemented)
const singleUndo = os.migration.singleUndo.handler(notImplemented)

export const migrationHandlers = {
  createBatch,
  uploadRaw,
  runMapper,
  confirmMapping,
  runNormalizer,
  confirmNormalization,
  applyDefaultMatrix,
  dryRun,
  apply,
  revert,
  singleUndo,
  getBatch,
  listErrors,
}
