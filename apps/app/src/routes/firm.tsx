import { useState, type SyntheticEvent } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { AlertCircleIcon, Building2Icon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import type { FirmPublic } from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@duedatehq/ui/components/ui/alert-dialog'
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
import { FirmTimezoneSelect, resolveUSFirmTimezone } from '@/features/firm/timezone-select'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

export function FirmRoute() {
  const currentQuery = useQuery(orpc.firms.getCurrent.queryOptions({ input: undefined }))

  if (currentQuery.isLoading) {
    return <ProfileSkeleton />
  }

  if (currentQuery.isError) {
    return (
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4 px-4 py-6 md:px-6">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Practice profile could not load</Trans>
          </AlertTitle>
          <AlertDescription>{currentQuery.error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!currentQuery.data) {
    return (
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4 px-4 py-6 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Practice profile</Trans>
            </CardTitle>
            <CardDescription>
              <Trans>No active practice is selected.</Trans>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return <FirmProfileForm key={currentQuery.data.id} firm={currentQuery.data} />
}

function FirmProfileForm({ firm }: { firm: FirmPublic }) {
  const { t } = useLingui()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState(firm.name)
  const originalTimezone = resolveUSFirmTimezone(firm.timezone)
  const [timezone, setTimezone] = useState(originalTimezone)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const updateMutation = useMutation(
    orpc.firms.updateCurrent.mutationOptions({
      onSuccess: (updatedFirm) => {
        setError(null)
        void queryClient.invalidateQueries({ queryKey: orpc.firms.key() })
        toast.success(t`Practice profile saved`, {
          description: updatedFirm.name,
        })
      },
      onError: (err) => {
        const message = rpcErrorMessage(err) ?? t`Please try again.`
        setError(message)
        toast.error(t`Could not update practice.`, {
          description: message,
        })
      },
    }),
  )

  const deleteMutation = useMutation(
    orpc.firms.softDeleteCurrent.mutationOptions({
      onSuccess: (result) => {
        void queryClient.invalidateQueries()
        void navigate(result.nextFirmId ? '/' : '/onboarding', { replace: true })
      },
      onError: (err) => {
        setError(err.message || t`Could not delete practice.`)
      },
    }),
  )

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      const message = t`Please enter at least 2 characters.`
      setError(message)
      toast.error(t`Could not update practice.`, {
        description: message,
      })
      return
    }
    updateMutation.mutate({ name: trimmed, timezone })
  }

  const dirty = name.trim() !== firm.name || timezone !== originalTimezone
  const currentPlan = firm.plan === 'firm' ? t`Firm` : firm.plan === 'pro' ? t`Pro` : t`Solo`
  const currentRole =
    firm.role === 'owner'
      ? t`Owner`
      : firm.role === 'manager'
        ? t`Manager`
        : firm.role === 'preparer'
          ? t`Preparer`
          : t`Coordinator`
  const firmSummary = t`Active practice · ${{ currentPlan }} plan · ${firm.seatLimit} seat limit`
  const firmSummaryLabel = t`Active practice summary`

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4 px-4 py-6 md:px-6">
      <section className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <Trans>Practice</Trans>
        </span>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-primary text-text-inverted">
              <Building2Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold leading-tight text-text-primary">
                <Trans>Practice profile</Trans>
              </h1>
              <p
                role="note"
                aria-label={firmSummaryLabel}
                className="truncate text-sm text-text-secondary"
              >
                {firmSummary}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono tabular-nums text-xs">
            {currentRole}
          </Badge>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans>General</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Practice profile applies only to the active practice.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-1.5">
              <Label htmlFor="firm-name">
                <Trans>Practice name</Trans>
              </Label>
              <Input
                id="firm-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="organization"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="firm-timezone">
                <Trans>Timezone</Trans>
              </Label>
              <FirmTimezoneSelect
                id="firm-timezone"
                value={timezone}
                onValueChange={setTimezone}
                disabled={updateMutation.isPending}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-text-destructive">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={!dirty || updateMutation.isPending}>
                {updateMutation.isPending ? <Trans>Saving…</Trans> : <Trans>Save changes</Trans>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans>Delete practice</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>
              This soft-deletes the active practice. If another practice is available, you will be
              moved there.
            </Trans>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button
            type="button"
            variant="destructive-secondary"
            onClick={() => setConfirmDelete(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2Icon className="size-4" aria-hidden />
            <Trans>Delete practice</Trans>
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans>Delete this practice?</Trans>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans>
                The practice will be removed from your account. Audit history stays retained for
                compliance.
              </Trans>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Trans>Cancel</Trans>
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive-primary"
              onClick={() => deleteMutation.mutate(undefined)}
            >
              <Trans>Delete practice</Trans>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4 px-4 py-6 md:px-6">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-52 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  )
}
