// Narrow surface over import.meta.env so business code never reads raw strings.
interface PublicEnv {
  POSTHOG_KEY: string | undefined
  VAPID_PUBLIC_KEY: string | undefined
  SENTRY_DSN: string | undefined
}

export const env: PublicEnv = {
  POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY,
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
}
