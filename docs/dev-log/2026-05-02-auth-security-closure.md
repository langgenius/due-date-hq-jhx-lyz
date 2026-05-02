# 2026-05-02 · Auth Security Closure

## Summary

- Added optional Microsoft Entra ID OAuth alongside the existing Google OAuth path.
- Added Better Auth `twoFactor` wiring, D1 `two_factor` schema, and migration `0021_elite_daredevil`.
- Added QR code rendering for authenticator setup, with setup URI fallback and recovery-code copy UX.
- Added `/accept-invite`, `/two-factor`, and `/account/security` routes so invitation acceptance, MFA setup, login challenge, and session revocation are user-facing.
- Added `security.*` oRPC procedures that wrap Better Auth session/MFA APIs without exposing raw session tokens to the SPA.
- Added production Owner MFA enforcement for owner-only sensitive procedures via `MFA_REQUIRED`.
- Extended auth audit actions for login success, MFA lifecycle, and session revocation.

## Validation

- `pnpm --filter @duedatehq/contracts test`
- `pnpm --filter @duedatehq/auth test`
- `pnpm --filter @duedatehq/server test`
- `pnpm --filter @duedatehq/app test`
- `pnpm --filter @duedatehq/app build`
- `pnpm --filter @duedatehq/app i18n:extract`
- `pnpm --filter @duedatehq/app i18n:compile`
- `pnpm check:deps`
- `pnpm check`
- `pnpm test`
- `E2E_REUSE_EXISTING_SERVER=1 pnpm test:e2e e2e/tests/auth-gate.spec.ts`
- `git diff --check`
