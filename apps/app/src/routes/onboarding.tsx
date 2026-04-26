import { useMemo, useState, useTransition, type FormEvent } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Trans, useLingui } from '@lingui/react/macro'
import { ChevronRightIcon, Loader2Icon } from 'lucide-react'

import { derivePracticeName, slugifyPracticeName } from '@duedatehq/core/practice-name'
import { Button } from '@duedatehq/ui/components/ui/button'
import { Input } from '@duedatehq/ui/components/ui/input'
import { authClient, type AuthUser } from '@/lib/auth'

const MIN_NAME_LENGTH = 2
const MAX_RETRIES_ON_SLUG_COLLISION = 1
// Hoisted out of `isSlugConflict` so we don't re-allocate the regex on every
// failed signup attempt (Vercel `js-hoist-regexp`).
const SLUG_CONFLICT_PATTERN = /unique|already exists|slug/i

type OnboardingLoaderData = { user: AuthUser }

function isInAppPath(value: string | null): value is string {
  return !!value && value.startsWith('/') && !value.startsWith('//')
}

/**
 * Best-effort detection of the org-slug uniqueness violation we deliberately
 * don't pre-check (see slugifyPracticeName comment on collision strategy).
 * Better Auth surfaces the underlying SQLite error message + an HTTP 4xx — we
 * match on common shapes so a single retry can resolve it transparently.
 */
function isSlugConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const status = (error as { status?: number }).status
  if (status === 409 || status === 422) return true
  const message =
    (error as { message?: string }).message ??
    (error as { error?: { message?: string } }).error?.message ??
    ''
  return SLUG_CONFLICT_PATTERN.test(message)
}

export function OnboardingRoute() {
  const { user } = useLoaderData<OnboardingLoaderData>()
  const { t } = useLingui()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [isSubmitting, startSubmit] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const fallback = t`My Practice`
  const defaultName = useMemo(
    () => derivePracticeName({ name: user.name, email: user.email }, fallback),
    [user.name, user.email, fallback],
  )
  const [name, setName] = useState(defaultName)

  const redirectToParam = params.get('redirectTo')
  const redirectTo = isInAppPath(redirectToParam) ? redirectToParam : '/'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    setError(null)

    const trimmed = name.trim()
    if (trimmed.length < MIN_NAME_LENGTH) {
      setError(t`Please enter at least 2 characters.`)
      return
    }

    startSubmit(async () => {
      // Defense-in-depth for returning users: if the server-side
      // databaseHooks.session.create.before hook didn't populate
      // activeOrganizationId (db blip / race / schema-less edge case), the
      // user is still here even though their org already exists.
      // organizationLimit:1 would otherwise reject a fresh create; list
      // existing ones first and setActive the earliest instead.
      const existing = await loadExistingOrganizationId()
      if (existing) {
        const { error: reuseErr } = await authClient.organization.setActive({
          organizationId: existing,
        })
        if (reuseErr) {
          const message = reuseErr.message ?? t`Please try again.`
          setError(message)
          toast.error(t`Could not activate your practice`, { description: message })
          return
        }
        // Returning users with an existing firm skip the import hand-off —
        // they likely already imported once.
        await navigate(redirectTo, { replace: true })
        return
      }

      const result = await createOrgWithRetry(trimmed)
      if (!result.ok) {
        setError(result.message)
        toast.error(t`Could not create your practice`, { description: result.message })
        return
      }

      const { error: setActiveErr } = await authClient.organization.setActive({
        organizationId: result.organizationId,
      })
      if (setActiveErr) {
        const message = setActiveErr.message ?? t`Please try again.`
        setError(message)
        toast.error(t`Could not activate your practice`, { description: message })
        return
      }

      // Brand-new firm: hand the user straight into Migration Copilot so the
      // dashboard doesn't show empty-state placeholders. The flag is consumed
      // and stripped by MigrationWizardProvider after the wizard opens.
      await navigate(redirectTo, { replace: true, state: { autoOpenMigration: true } })
    })
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col">
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-tint px-2.5 py-1 font-mono text-[11px] tracking-[0.16em] text-accent-text">
        <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-accent-default" />
        <Trans>STEP 01 · PRACTICE PROFILE</Trans>
      </span>

      <h1 className="mt-5 text-[28px] font-semibold leading-[1.15] tracking-tight text-text-primary">
        <Trans>Set up your practice.</Trans>
      </h1>

      <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">
        <Trans>
          We pre-filled a name from your Google profile. You can change it now or anytime in Firm
          settings.
        </Trans>
      </p>

      <form onSubmit={handleSubmit} noValidate className="contents">
        <div className="mt-8 flex flex-col gap-1.5">
          <label
            htmlFor="practice-name"
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary"
          >
            <Trans>Practice name</Trans>
          </label>
          <Input
            id="practice-name"
            name="name"
            autoFocus
            autoComplete="organization"
            required
            minLength={MIN_NAME_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t`e.g. Bright CPA Practice`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'practice-name-error' : 'practice-name-helper'}
          />
          {error ? (
            <p
              id="practice-name-error"
              role="alert"
              className="text-[12px] leading-relaxed text-destructive"
            >
              {error}
            </p>
          ) : (
            <p id="practice-name-helper" className="text-[12px] leading-relaxed text-text-muted">
              <Trans>This is what your team and clients will see.</Trans>
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="mt-5 w-full justify-center gap-2"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              <span>
                <Trans>Setting up your practice…</Trans>
              </span>
            </>
          ) : (
            <>
              <span>
                <Trans>Continue</Trans>
              </span>
              <ChevronRightIcon className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </form>

      <p className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] text-text-muted">
        <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-status-done" />
        <Trans>Encrypted · Auto-saves · Renamable later</Trans>
      </p>
    </div>
  )
}

/**
 * Returns the first existing organization id for the current user, or null
 * if they have none. Used by the onboarding submit to prefer setActive over
 * create when the server-side session hook didn't restore activeOrgId for
 * some reason. Errors are swallowed — the caller falls through to the
 * create path, which will then itself surface a toast on failure.
 */
async function loadExistingOrganizationId(): Promise<string | null> {
  const { data } = await authClient.organization.list()
  if (!data || data.length === 0) return null
  const sorted = [...data].toSorted(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  return sorted[0]?.id ?? null
}

type CreateResult = { ok: true; organizationId: string } | { ok: false; message: string }

async function createOrgWithRetry(name: string): Promise<CreateResult> {
  // Sequential retry is intentional: we must observe the first attempt's
  // failure before deciding whether to roll a new slug. Promise.all would
  // fire both attempts concurrently with stale slugs.
  for (let attempt = 0; attempt <= MAX_RETRIES_ON_SLUG_COLLISION; attempt += 1) {
    const slug = slugifyPracticeName(name)
    // eslint-disable-next-line no-await-in-loop -- see comment above
    const { data, error } = await authClient.organization.create({ name, slug })
    if (data?.id) return { ok: true, organizationId: data.id }
    if (error && isSlugConflict(error) && attempt < MAX_RETRIES_ON_SLUG_COLLISION) {
      continue
    }
    return {
      ok: false,
      message: error?.message ?? 'Unable to create the practice. Please try again.',
    }
  }
  return { ok: false, message: 'Unable to create the practice. Please try again.' }
}
