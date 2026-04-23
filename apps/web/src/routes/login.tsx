import { useState, useTransition } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  CalendarClockIcon,
  GaugeIcon,
  Loader2Icon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { signInWithGoogle, useSession } from '@/lib/auth'
import { cn } from '@/lib/utils'

const highlights = [
  {
    icon: GaugeIcon,
    title: 'Penalty-weighted triage',
    detail: 'Dollar-first queues surface the obligations that matter before the clock runs out.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Glass-box evidence',
    detail: 'Every AI recommendation ships with source, quote, and verification timestamp.',
  },
  {
    icon: CalendarClockIcon,
    title: 'Seven-day rhythm',
    detail: 'Operating cadence tuned for CPA teams during peak filing windows.',
  },
]

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={cn('size-4', className)}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.64 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.9s2.63-5.9 5.85-5.9c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.72 4.1 14.56 3 12 3 6.98 3 3 6.98 3 12s3.98 9 9 9c5.2 0 8.64-3.65 8.64-8.79 0-.59-.07-1.04-.29-1.11Z"
      fill="#4285F4"
    />
    <path
      d="M3 12c0-1.07.19-2.09.5-3.05l3.05 2.36C6.41 11.74 6.3 12.36 6.3 13s.11 1.26.25 1.85L3.5 17.2C3.19 16.24 3 15.22 3 14.14Z"
      fill="#34A853"
      opacity="0"
    />
  </svg>
)

function isUserCanceled(message: string): boolean {
  return /cancel|popup|closed/i.test(message)
}

export function LoginRoute() {
  const { data, isPending } = useSession()
  const [search] = useSearchParams()
  const redirectTo = search.get('redirectTo') || '/'

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  if (!isPending && data) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleGoogleSignIn() {
    setIsSubmitting(true)
    try {
      // better-auth performs the browser redirect itself; this promise typically does not resolve.
      await signInWithGoogle(redirectTo)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.'
      if (!isUserCanceled(message)) {
        toast.error('Unable to start Google sign-in', { description: message })
      }
      startTransition(() => setIsSubmitting(false))
    }
  }

  const disabled = isSubmitting || isPending

  return (
    <div className="relative isolate min-h-screen bg-bg-canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_0%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_60%),radial-gradient(40%_40%_at_100%_100%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_60%)]"
      />
      <div className="mx-auto grid min-h-screen w-full max-w-[1200px] grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between border-r border-border-default bg-bg-panel p-8 lg:flex lg:p-12">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <SparklesIcon className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold text-text-primary">DueDateHQ</span>
              <span className="text-xs text-muted-foreground">CPA deadline console</span>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <span className="w-fit rounded-full border border-border-default bg-background px-2.5 py-1 font-mono text-xs tracking-wide text-text-secondary">
                Phase 0 · Demo workspace
              </span>
              <h1 className="text-2xl leading-tight font-semibold text-text-primary md:text-[28px]">
                Verified risk, one deadline at a time.
              </h1>
              <p className="max-w-md text-sm text-text-secondary">
                Sign in to review penalty exposure, evidence checks, and the seven-day queue for
                your firm&apos;s filing pipeline.
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {highlights.map((item) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.title}
                    className="flex items-start gap-3 rounded-md border border-border-default bg-background p-3"
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-accent-tint text-accent-text">
                      <Icon className="size-4" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-text-primary">{item.title}</span>
                      <span className="text-sm text-text-secondary">{item.detail}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">© {new Date().getFullYear()} DueDateHQ</span>
            <span>SOC 2 ready · SSO available</span>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="flex w-full max-w-[420px] flex-col gap-6">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
                <SparklesIcon className="size-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold">DueDateHQ</span>
                <span className="text-xs text-muted-foreground">CPA deadline console</span>
              </div>
            </div>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl">Sign in</CardTitle>
                <CardDescription>
                  Use your Google workspace account to access the risk queue and evidence tools.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 w-full justify-center gap-2 text-sm"
                  onClick={handleGoogleSignIn}
                  disabled={disabled}
                  aria-busy={disabled}
                >
                  {disabled ? (
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>{disabled ? 'Redirecting to Google…' : 'Continue with Google'}</span>
                </Button>

                <div className="relative py-1">
                  <Separator />
                  <span className="absolute inset-0 -top-1 mx-auto w-fit bg-card px-2 text-xs text-muted-foreground">
                    Secure sign-in
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-text-secondary">
                  You&apos;ll be redirected to Google and returned to your workspace. Sessions last
                  seven days and respect the firm&apos;s SSO policy.
                </p>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 border-t border-border-default pt-4 text-xs text-muted-foreground">
                <span>
                  By signing in you agree to the{' '}
                  <a className="underline underline-offset-4 hover:text-text-primary" href="/terms">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    className="underline underline-offset-4 hover:text-text-primary"
                    href="/privacy"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
                <span>
                  Trouble signing in? Contact{' '}
                  <a
                    className="underline underline-offset-4 hover:text-text-primary"
                    href="mailto:support@duedatehq.com"
                  >
                    support@duedatehq.com
                  </a>
                  .
                </span>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
