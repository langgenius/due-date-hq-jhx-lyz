import { createDb, makePulseOpsRepo } from '@duedatehq/db'
import type { Env } from '../../env'

export async function linkPulseSourceSignals(
  env: Pick<Env, 'DB'>,
): Promise<{ linked: number; inspected: number }> {
  const repo = makePulseOpsRepo(createDb(env.DB))
  return repo.linkOpenSignalsToPulses()
}
