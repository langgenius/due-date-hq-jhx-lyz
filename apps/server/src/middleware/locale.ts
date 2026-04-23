import type { MiddlewareHandler } from 'hono'

import { resolveLocale, runWithLocale } from '../i18n/resolve'

// Resolve the caller's preferred locale once per request and expose it via
// AsyncLocalStorage. Handlers and decoupled callbacks (e.g. better-auth email
// senders) read the value with `getRequestLocale()` without needing headers
// plumbed through every function signature.
export const localeMiddleware: MiddlewareHandler = async (c, next) => {
  const locale = resolveLocale(c.req.raw.headers)
  await runWithLocale(locale, async () => {
    await next()
  })
}
