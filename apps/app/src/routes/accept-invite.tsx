import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { AlertCircleIcon, Loader2Icon, MailIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import { authClient, signInWithGoogle, signInWithMicrosoft } from '@/lib/auth'

type InvitationPreview = {
  id: string
  email: string
  role: string
  organizationName: string
  inviterEmail: string
}

type AuthCapabilities = {
  providers: {
    google: boolean
    microsoft: boolean
  }
}

async function authCapabilities(): Promise<AuthCapabilities> {
  const response = await fetch('/api/auth-capabilities', { credentials: 'include' })
  if (!response.ok) return { providers: { google: true, microsoft: false } }
  return response.json()
}

async function fetchInvitation(id: string): Promise<InvitationPreview> {
  const response = await fetch(
    `/api/auth/organization/get-invitation?id=${encodeURIComponent(id)}`,
    {
      credentials: 'include',
    },
  )
  if (!response.ok) throw new Error('Invitation could not load.')
  return response.json()
}

async function acceptInvitation(id: string): Promise<void> {
  const response = await fetch('/api/auth/organization/accept-invitation', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ invitationId: id }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || body?.error || 'Invitation could not be accepted.')
  }
}

export function AcceptInviteRoute() {
  const { t } = useLingui()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const id = search.get('id') || ''
  const session = authClient.useSession()
  const signedIn = Boolean(session.data)
  const [submitting, setSubmitting] = useState<'accept' | 'google' | 'microsoft' | null>(null)
  const inviteQuery = useQuery({
    queryKey: ['invitation', id],
    queryFn: () => fetchInvitation(id),
    enabled: id.length > 0 && signedIn,
    retry: false,
  })
  const capabilitiesQuery = useQuery({
    queryKey: ['auth-capabilities'],
    queryFn: authCapabilities,
    staleTime: 60_000,
  })

  const currentPath = `/accept-invite?id=${encodeURIComponent(id)}`
  const microsoftEnabled = capabilitiesQuery.data?.providers.microsoft ?? false

  async function handleAccept() {
    setSubmitting('accept')
    try {
      await acceptInvitation(id)
      toast.success(t`Invitation accepted`)
      await navigate('/', { replace: true })
    } catch (err) {
      toast.error(t`Could not accept invitation`, {
        description: err instanceof Error ? err.message : t`Please try again.`,
      })
      setSubmitting(null)
    }
  }

  async function handleProvider(provider: 'google' | 'microsoft') {
    setSubmitting(provider)
    try {
      if (provider === 'google') {
        await signInWithGoogle(currentPath)
      } else {
        await signInWithMicrosoft(currentPath)
      }
    } catch (err) {
      toast.error(t`Could not start sign-in`, {
        description: err instanceof Error ? err.message : t`Please try again.`,
      })
      setSubmitting(null)
    }
  }

  if (!id) {
    return (
      <div className="flex w-full max-w-[420px] flex-col">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Invite link is missing</Trans>
          </AlertTitle>
          <AlertDescription>
            <Trans>Ask the practice owner to send a new invitation.</Trans>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-[420px] flex-col">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailIcon className="size-4" aria-hidden />
            <Trans>Practice invitation</Trans>
          </CardTitle>
          <CardDescription>
            {!signedIn ? (
              <Trans>Sign in to accept this invitation.</Trans>
            ) : inviteQuery.isLoading ? (
              <Skeleton className="h-5 w-56" />
            ) : inviteQuery.data ? (
              <Trans>
                {inviteQuery.data.inviterEmail} invited you to {inviteQuery.data.organizationName}.
              </Trans>
            ) : (
              <Trans>Sign in to accept this invitation.</Trans>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {signedIn && inviteQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>
                <Trans>Invitation could not load</Trans>
              </AlertTitle>
              <AlertDescription>{inviteQuery.error.message}</AlertDescription>
            </Alert>
          ) : null}

          {!signedIn ? (
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => void handleProvider('google')}
                disabled={submitting !== null}
              >
                {submitting === 'google' ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : null}
                <Trans>Continue with Google</Trans>
              </Button>
              {microsoftEnabled ? (
                <Button
                  variant="outline"
                  onClick={() => void handleProvider('microsoft')}
                  disabled={submitting !== null}
                >
                  {submitting === 'microsoft' ? (
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  <Trans>Continue with Microsoft</Trans>
                </Button>
              ) : null}
            </div>
          ) : (
            <Button
              onClick={handleAccept}
              disabled={submitting !== null || inviteQuery.isLoading || inviteQuery.isError}
            >
              {submitting === 'accept' ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : null}
              <Trans>Accept invitation</Trans>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
