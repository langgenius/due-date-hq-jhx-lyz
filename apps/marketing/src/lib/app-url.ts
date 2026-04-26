// Resolve the apps/app entry URL for marketing CTAs.
// Preference order:
//   1. `PUBLIC_APP_URL` env (Cloudflare Pages var, wrangler.toml in prod)
//   2. apps/app vite dev server (http://localhost:5173) when running `astro dev`
//   3. production https://app.duedatehq.com as a safe last-resort fallback

const PROD_APP_URL = 'https://app.duedatehq.com'
const DEV_APP_URL = 'http://localhost:5173'

function resolveBase(): string {
  if (import.meta.env.PUBLIC_APP_URL) return import.meta.env.PUBLIC_APP_URL
  return import.meta.env.DEV ? DEV_APP_URL : PROD_APP_URL
}

export function getCtaHref(locale?: string): string {
  const base = resolveBase()
  return locale ? `${base}/?lng=${locale}` : base
}
