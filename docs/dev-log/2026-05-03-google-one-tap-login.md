# 2026-05-03 · Google One Tap login

## Summary

- Added Better Auth's `oneTap()` server plugin alongside the existing Google OAuth provider.
- Exposed the public Google Client ID through `/api/auth-capabilities` so the SPA can initialize Google One Tap without a new `VITE_*` env key.
- Wired `/login` to trigger One Tap through TanStack Query after capabilities load; the existing Google OAuth button remains the visible fallback.

## Configuration and schema

- No new secret is required. `GOOGLE_CLIENT_ID` is public and already lives in Worker runtime config; `GOOGLE_CLIENT_SECRET` remains server-only.
- No new auth table or migration is required. Better Auth One Tap writes through the existing `user`, `account`, and `session` tables.
- Google Console must allow the app origin under Authorized JavaScript origins, including the local `APP_URL` used for Vite dev.

## Validation

- Added server coverage for `/api/auth-capabilities` to prove it returns the public client ID and does not return the OAuth secret.
- Added auth package coverage to lock `one-tap` into the Better Auth plugin set.
- Full validation ran with `pnpm ready`.
