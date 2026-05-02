import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CopyIcon,
  Loader2Icon,
  MonitorIcon,
  ShieldCheckIcon,
  ShieldIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import { Input } from '@duedatehq/ui/components/ui/input'
import { Label } from '@duedatehq/ui/components/ui/label'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import { formatDateTimeWithTimezone } from '@/lib/utils'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

type PendingSetup = {
  totpURI: string
  backupCodes: string[]
}

export function AccountSecurityRoute() {
  const { t } = useLingui()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const statusQuery = useQuery(orpc.security.status.queryOptions({ input: undefined }))
  const [pendingSetup, setPendingSetup] = useState<PendingSetup | null>(null)
  const [code, setCode] = useState('')
  const securityKey = orpc.security.key()

  const enableMutation = useMutation(
    orpc.security.enableTwoFactor.mutationOptions({
      onSuccess: (result) => {
        setPendingSetup(result)
        setCode('')
        toast.success(t`Authenticator setup started`)
      },
      onError: (err) => {
        toast.error(t`Could not start authenticator setup`, {
          description: rpcErrorMessage(err) ?? err.message,
        })
      },
    }),
  )

  const verifyMutation = useMutation(
    orpc.security.verifyTwoFactor.mutationOptions({
      onSuccess: () => {
        setPendingSetup(null)
        setCode('')
        void queryClient.invalidateQueries({ queryKey: securityKey })
        toast.success(t`Two-factor authentication enabled`)
      },
      onError: (err) => {
        toast.error(t`Could not verify the code`, {
          description: rpcErrorMessage(err) ?? err.message,
        })
      },
    }),
  )

  const disableMutation = useMutation(
    orpc.security.disableTwoFactor.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: securityKey })
        toast.success(t`Two-factor authentication disabled`)
      },
      onError: (err) => {
        toast.error(t`Could not disable two-factor authentication`, {
          description: rpcErrorMessage(err) ?? err.message,
        })
      },
    }),
  )

  const revokeSessionMutation = useMutation(
    orpc.security.revokeSession.mutationOptions({
      onSuccess: (_result, variables) => {
        const revokedCurrent = statusQuery.data?.sessions.some(
          (session) => session.id === variables.sessionId && session.isCurrent,
        )
        void queryClient.invalidateQueries({ queryKey: securityKey })
        toast.success(t`Session revoked`)
        if (revokedCurrent) void navigate('/login', { replace: true })
      },
      onError: (err) => {
        toast.error(t`Could not revoke session`, {
          description: rpcErrorMessage(err) ?? err.message,
        })
      },
    }),
  )

  const revokeOtherSessionsMutation = useMutation(
    orpc.security.revokeOtherSessions.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: securityKey })
        toast.success(t`Other sessions revoked`)
      },
      onError: (err) => {
        toast.error(t`Could not revoke other sessions`, {
          description: rpcErrorMessage(err) ?? err.message,
        })
      },
    }),
  )

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = code.trim()
    if (trimmed.length < 6) return
    verifyMutation.mutate({ code: trimmed })
  }

  function copyBackupCodes() {
    if (!pendingSetup) return
    void navigator.clipboard.writeText(pendingSetup.backupCodes.join('\n'))
    toast.success(t`Backup codes copied`)
  }

  if (statusQuery.isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-[920px] gap-4 px-4 py-6 md:px-6">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (statusQuery.isError) {
    return (
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4 px-4 py-6 md:px-6">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Security settings could not load</Trans>
          </AlertTitle>
          <AlertDescription>{statusQuery.error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const status = statusQuery.data
  if (!status) return null

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4 px-4 py-6 md:px-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            <Trans>Account</Trans>
          </span>
          <h1 className="mt-1 text-2xl font-semibold text-text-primary">
            <Trans>Security</Trans>
          </h1>
        </div>
        <Badge variant={status.twoFactorEnabled ? 'success' : 'outline'}>
          {status.twoFactorEnabled ? <Trans>MFA enabled</Trans> : <Trans>MFA not enabled</Trans>}
        </Badge>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4" aria-hidden />
            <Trans>Authenticator app</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Owners need MFA before sensitive production actions.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {status.twoFactorEnabled ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-default p-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2Icon className="size-4 text-status-done" aria-hidden />
                <Trans>Authenticator is active on this account.</Trans>
              </div>
              <Button
                variant="outline"
                onClick={() => disableMutation.mutate(undefined)}
                disabled={disableMutation.isPending}
              >
                <Trans>Disable MFA</Trans>
              </Button>
            </div>
          ) : (
            <Button
              className="w-fit"
              onClick={() => enableMutation.mutate(undefined)}
              disabled={enableMutation.isPending}
            >
              {enableMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : (
                <ShieldIcon className="size-4" aria-hidden />
              )}
              <Trans>Set up authenticator</Trans>
            </Button>
          )}

          {pendingSetup ? (
            <form
              onSubmit={handleVerify}
              className="grid gap-4 rounded-md border border-border-default p-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="totp-uri">
                  <Trans>Setup URI</Trans>
                </Label>
                <Input id="totp-uri" readOnly value={pendingSetup.totpURI} className="font-mono" />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>
                    <Trans>Recovery codes</Trans>
                  </Label>
                  <Button type="button" variant="ghost" size="sm" onClick={copyBackupCodes}>
                    <CopyIcon className="size-4" aria-hidden />
                    <Trans>Copy</Trans>
                  </Button>
                </div>
                <div className="grid gap-1 rounded-md bg-bg-panel p-3 font-mono text-xs text-text-secondary sm:grid-cols-2">
                  {pendingSetup.backupCodes.map((backupCode) => (
                    <span key={backupCode}>{backupCode}</span>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 sm:max-w-[220px]">
                <Label htmlFor="totp-code">
                  <Trans>Verification code</Trans>
                </Label>
                <Input
                  id="totp-code"
                  value={code}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  onChange={(event) => setCode(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-fit" disabled={verifyMutation.isPending}>
                {verifyMutation.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : null}
                <Trans>Verify and enable</Trans>
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorIcon className="size-4" aria-hidden />
            <Trans>Active sessions</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Review signed-in browsers and revoke stale access.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => revokeOtherSessionsMutation.mutate(undefined)}
              disabled={revokeOtherSessionsMutation.isPending || status.sessions.length <= 1}
            >
              <Trans>Sign out other sessions</Trans>
            </Button>
          </div>
          <div className="grid gap-2">
            {status.sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-default p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {session.userAgent || <Trans>Unknown browser</Trans>}
                    </p>
                    {session.isCurrent ? (
                      <Badge variant="outline">
                        <Trans>Current</Trans>
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 font-mono text-xs text-text-muted">
                    {session.ipAddress || '-'} · {formatDateTimeWithTimezone(session.createdAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={revokeSessionMutation.isPending}
                  onClick={() => revokeSessionMutation.mutate({ sessionId: session.id })}
                >
                  <Trans>Revoke</Trans>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
