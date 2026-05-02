# 2026-05-02 · MFA QR Setup UX

## Summary

- Added SVG QR code rendering for the Better Auth TOTP setup URI on `/account/security`.
- Kept the raw setup URI as a copyable fallback for authenticator apps that cannot scan.
- Split recovery-code copy and setup-URI copy into separate actions, with clipboard failure feedback.
- Added focused component coverage for the QR setup panel and updated auth/security docs.

## Validation

- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check:deps`
- `pnpm check`
- `pnpm --filter @duedatehq/app build`
- `git diff --check`

E2E was intentionally not run for this change.
