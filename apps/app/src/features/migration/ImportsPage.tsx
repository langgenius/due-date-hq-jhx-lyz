import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@duedatehq/ui/components/ui/card'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

function fmt(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ImportsPage() {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const batchesQuery = useQuery(orpc.migration.listBatches.queryOptions({ input: { limit: 50 } }))
  const revert = useMutation(
    orpc.migration.revert.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.migration.key() })
        toast.success(t`Import reverted`)
      },
      onError: (error) => {
        toast.error(t`Could not revert import`, {
          description: rpcErrorMessage(error) ?? t`Please try again.`,
        })
      },
    }),
  )
  const singleUndo = useMutation(
    orpc.migration.singleUndo.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: orpc.migration.key() })
        toast.success(t`Client import undone`)
      },
      onError: (error) => {
        toast.error(t`Could not undo client`, {
          description: rpcErrorMessage(error) ?? t`Please try again.`,
        })
      },
    }),
  )

  const batches = batchesQuery.data?.batches ?? []

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="grid gap-1">
        <span className="text-xs font-medium tracking-wider text-text-tertiary uppercase">
          <Trans>Clients</Trans>
        </span>
        <h1 className="text-2xl leading-tight font-semibold text-text-primary">
          <Trans>Imports</Trans>
        </h1>
      </header>

      {batchesQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>
            <Trans>Could not load import history</Trans>
          </AlertTitle>
          <AlertDescription>
            {rpcErrorMessage(batchesQuery.error) ?? t`Please try again.`}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4">
        {batches.map((batch) => (
          <Card key={batch.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="grid gap-1">
                <CardTitle className="text-base">
                  {batch.rawInputFileName ?? batch.presetUsed ?? batch.source}
                </CardTitle>
                <p className="font-mono text-xs text-text-tertiary">{batch.id}</p>
              </div>
              <Badge variant="outline">{batch.status}</Badge>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-4">
                <span>
                  <Trans>Rows</Trans>: {batch.rowCount}
                </span>
                <span>
                  <Trans>Success</Trans>: {batch.successCount}
                </span>
                <span>
                  <Trans>Applied</Trans>: {fmt(batch.appliedAt)}
                </span>
                <span>
                  <Trans>Revert until</Trans>: {fmt(batch.revertExpiresAt)}
                </span>
              </div>
              <BatchClients
                batchId={batch.id}
                canUndo={batch.status === 'applied'}
                onUndo={(clientId) => singleUndo.mutate({ batchId: batch.id, clientId })}
              />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revert.mutate({ batchId: batch.id })}
                  disabled={batch.status !== 'applied' || revert.isPending}
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  <Trans>Revert batch</Trans>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function BatchClients({
  batchId,
  canUndo,
  onUndo,
}: {
  batchId: string
  canUndo: boolean
  onUndo: (clientId: string) => void
}) {
  const clientsQuery = useQuery(
    orpc.migration.listBatchClients.queryOptions({ input: { batchId } }),
  )
  const clients = clientsQuery.data?.clients ?? []
  if (clients.length === 0) return null
  return (
    <div className="grid gap-2 rounded-lg border border-divider-subtle p-3">
      {clients.slice(0, 8).map((client) => (
        <div key={client.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate">{client.name}</span>
          <Button variant="ghost" size="sm" onClick={() => onUndo(client.id)} disabled={!canUndo}>
            <Trash2Icon data-icon="inline-start" />
            <Trans>Undo</Trans>
          </Button>
        </div>
      ))}
    </div>
  )
}
