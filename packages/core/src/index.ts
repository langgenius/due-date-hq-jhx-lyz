// @duedatehq/core — pure domain layer.
// HARD CONSTRAINT (docs/Dev File/08 §4.5, §6):
//   - No runtime/infrastructure dependencies (no fetch, no Worker env, no DB, no drizzle, no hono).
//   - All exports must be pure functions.
//   - 100% unit-test coverage target (docs/Dev File/07 §5.2).
// Prefer importing from sub-entries (e.g. `@duedatehq/core/penalty`) to preserve tree-shaking.

// intentional: no barrel re-exports (avoid tree-shake loss).
export type NoBarrelExports = never
