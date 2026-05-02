import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { ArrowRightIcon, CheckCheckIcon, CheckIcon, InboxIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { NotificationType } from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Button } from '@duedatehq/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@duedatehq/ui/components/ui/card'
import { Switch } from '@duedatehq/ui/components/ui/switch'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function notificationTypeLabel(type: NotificationType): React.ReactNode {
  if (type === 'deadline_reminder') return <Trans>Deadline reminder</Trans>
  if (type === 'overdue') return <Trans>Overdue</Trans>
  if (type === 'client_reminder') return <Trans>Client reminder</Trans>
  if (type === 'pulse_alert') return <Trans>Pulse alert</Trans>
  if (type === 'audit_package_ready') return <Trans>Audit package</Trans>
  return <Trans>System notification</Trans>
}

export function NotificationsPage() {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const notificationsQuery = useQuery(
    orpc.notifications.list.queryOptions({ input: { status: 'all', limit: 50 } }),
  )
  const preferencesQuery = useQuery(
    orpc.notifications.getPreferences.queryOptions({ input: undefined }),
  )
  const markRead = useMutation(
    orpc.notifications.markRead.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.notifications.key() })
      },
      onError: (error) => {
        toast.error(t`Could not mark notification read`, {
          description: rpcErrorMessage(error) ?? t`Please try again.`,
        })
      },
    }),
  )
  const markAllRead = useMutation(
    orpc.notifications.markAllRead.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.notifications.key() })
      },
    }),
  )
  const updatePreferences = useMutation(
    orpc.notifications.updatePreferences.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.notifications.key() })
      },
    }),
  )

  const notifications = notificationsQuery.data?.notifications ?? []
  const preferences = preferencesQuery.data

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-1">
          <span className="text-xs font-medium tracking-wider text-text-tertiary uppercase">
            <Trans>Notifications</Trans>
          </span>
          <h1 className="text-2xl leading-tight font-semibold text-text-primary">
            <Trans>Notification center</Trans>
          </h1>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => markAllRead.mutate(undefined)}
          disabled={markAllRead.isPending || notifications.every((item) => item.readAt)}
        >
          <CheckCheckIcon data-icon="inline-start" />
          <Trans>Mark all read</Trans>
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Inbox</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {notificationsQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>
                  <Trans>Could not load notifications</Trans>
                </AlertTitle>
                <AlertDescription>
                  {rpcErrorMessage(notificationsQuery.error) ?? t`Please try again.`}
                </AlertDescription>
              </Alert>
            ) : null}

            {!notificationsQuery.isLoading && notifications.length === 0 ? (
              <div className="grid place-items-center gap-2 rounded-lg border border-divider-subtle p-8 text-center">
                <InboxIcon className="size-5 text-text-tertiary" aria-hidden />
                <p className="text-sm text-text-secondary">
                  <Trans>No notifications yet.</Trans>
                </p>
              </div>
            ) : null}

            {notifications.map((item) => (
              <article
                key={item.id}
                className="grid gap-2 rounded-lg border border-divider-subtle bg-background-default p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-text-primary">
                      {item.title}
                    </h2>
                    <p className="text-sm text-text-secondary">{item.body}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-text-tertiary">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-text-tertiary">
                    {notificationTypeLabel(item.type)}
                  </span>
                  <span className="flex items-center gap-1">
                    {item.href ? (
                      <Button
                        render={
                          <Link
                            to={item.href}
                            onClick={() => {
                              if (!item.readAt) markRead.mutate({ id: item.id })
                            }}
                          />
                        }
                        variant="ghost"
                        size="sm"
                      >
                        <Trans>Open</Trans>
                        <ArrowRightIcon data-icon="inline-end" />
                      </Button>
                    ) : null}
                    {!item.readAt ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead.mutate({ id: item.id })}
                        disabled={markRead.isPending}
                      >
                        <CheckIcon data-icon="inline-start" />
                        <Trans>Mark read</Trans>
                      </Button>
                    ) : null}
                  </span>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Trans>Preferences</Trans>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {preferences
              ? (
                  [
                    ['emailEnabled', t`Email`],
                    ['inAppEnabled', t`In-app`],
                    ['remindersEnabled', t`Deadline reminders`],
                    ['pulseEnabled', t`Pulse updates`],
                    ['unassignedRemindersEnabled', t`Unassigned work`],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-3 text-sm">
                    <span>{label}</span>
                    <Switch
                      checked={preferences[key]}
                      onCheckedChange={(checked) => updatePreferences.mutate({ [key]: checked })}
                    />
                  </label>
                ))
              : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
