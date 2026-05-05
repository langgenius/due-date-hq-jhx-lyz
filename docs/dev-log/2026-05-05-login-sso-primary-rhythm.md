---
title: '2026-05-05 · Login SSO primary rhythm'
date: 2026-05-05
author: 'Codex'
---

# Login SSO primary rhythm

## Summary

- Reordered `/login` so SSO is the primary path: Google OAuth appears first, optional Microsoft
  OAuth stays grouped with SSO, and Email OTP moves below a split `or` divider as the work-email
  fallback.
- Replaced the separator with a true three-part split divider (`line / or / line`) instead of a
  text-over-line separator, which looked visually muddy on the entry canvas.
- Restored the 400 px login measure and tightened only vertical rhythm: heading reserve removed,
  button/input heights returned to the UI primitive defaults, and section gaps now follow the
  compact 4 px scale.

## Documentation

- Updated `DESIGN.md` to define SSO as the login primary path and Email OTP as the compact fallback.
- Updated frontend architecture, PRD baseline, app module notes, and the user manual so product
  docs no longer describe Email OTP as the default entry.

## Validation

- `pnpm --filter @duedatehq/app exec vp check src/routes/login.tsx src/features/auth/email-otp-sign-in-form.tsx`
- `pnpm --filter @duedatehq/app test src/routes/login.test.tsx src/routes/accept-invite.test.tsx`
- `pnpm --filter @duedatehq/app i18n:compile`
- Local visual check at `http://127.0.0.1:5173/login` with a 390 x 844 viewport.
