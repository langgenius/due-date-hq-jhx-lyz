# 2026-05-04 · Email OTP login

## Summary

- Added Better Auth's `emailOTP()` plugin alongside Google One Tap, Google OAuth, and optional Microsoft OAuth.
- Exposed `providers.emailOtp` through `/api/auth-capabilities` so the SPA can render the email-code flow without a browser-facing env var.
- Wired `/login` and `/accept-invite` to support work-email sign-in codes. New verified emails can self-register and then continue through the existing onboarding gate.

## Notes

- Only `type='sign-in'` OTP is supported. Email verification, password reset, and email-change OTP flows remain out of scope.
- No migration is required. The flow reuses Better Auth's existing `verification`, `user`, `session`, and `rate_limit` tables.
- Auth emails stay server-rendered through the existing locale-aware Resend sender; OTP sends do not use idempotency keys because the code rotates.

## Validation

- Added auth package coverage for the Email OTP plugin options and rate-limit rules.
- Added server coverage for the updated auth capabilities response and localized OTP email messages.
- Added SPA route coverage for `/login` and `/accept-invite` email-code flows.
