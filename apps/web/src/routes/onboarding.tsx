import { useMemo, useState, useTransition, type FormEvent } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Trans, useLingui } from '@lingui/react/macro'
import { Loader2Icon, SparklesIcon } from 'lucide-react'

import { derivePracticeName, slugifyPracticeName } from '@duedatehq/core/practice-name'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient, type AuthUser } from '@/lib/auth'

const MIN_NAME_LENGTH = 2
const MAX_RETRIES_ON_SLUG_COLLISION = 1

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
  return /unique|already exists|slug/i.test(message)
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

      await navigate(redirectTo, { replace: true })
    })
  }

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center bg-bg-canvas p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_60%)]"
      />
      <div className="flex w-full max-w-[480px] flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <SparklesIcon className="size-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-text-primary">DueDateHQ</span>
            <span className="text-xs text-muted-foreground">
              <Trans>CPA deadline console</Trans>
            </span>
          </div>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              <Trans>Confirm your practice profile</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>
                We pre-filled a name from your Google profile. You can change it now or anytime in
                Firm settings.
              </Trans>
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} noValidate>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="practice-name">
                    <Trans>Practice name</Trans>
                  </FieldLabel>
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
                    aria-describedby={error ? 'practice-name-error' : undefined}
                  />
                  {error ? (
                    <FieldDescription
                      id="practice-name-error"
                      className="text-destructive"
                      role="alert"
                    >
                      {error}
                    </FieldDescription>
                  ) : (
                    <FieldDescription>
                      <Trans>This is what your team and clients will see.</Trans>
                    </FieldDescription>
                  )}
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2 border-t border-border-default pt-4">
              <Button type="submit" size="lg" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    <span>
                      <Trans>Setting up your practice…</Trans>
                    </span>
                  </>
                ) : (
                  <span>
                    <Trans>Continue</Trans>
                  </span>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                <Trans>You can rename or invite teammates later.</Trans>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
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
