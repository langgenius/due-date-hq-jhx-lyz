import { Wizard } from '@/features/migration/Wizard'

/**
 * /migration/new — Migration Copilot Wizard entry.
 *
 * Authority: docs/product-design/migration-copilot/01-mvp-and-journeys.md §5.
 * Wrapped by the protected layout in router.tsx so we already have a session
 * + active firm by the time the Wizard renders.
 */
export function MigrationNewRoute() {
  return <Wizard />
}
