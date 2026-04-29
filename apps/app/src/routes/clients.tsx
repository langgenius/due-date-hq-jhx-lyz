import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { AlertCircleIcon, FileSearchIcon } from 'lucide-react'
import { parseAsString, parseAsStringLiteral, useQueryStates, type inferParserType } from 'nuqs'
import { toast } from 'sonner'

import type { ClientCreateInput, ClientPublic } from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Button } from '@duedatehq/ui/components/ui/button'

import { ClientFactsWorkspace } from '@/features/clients/ClientFactsWorkspace'
import { CreateClientDialog } from '@/features/clients/CreateClientDialog'
import {
  ALL_ENTITIES,
  CLIENT_ENTITY_FILTERS,
  STATE_FILTER_ALL,
  buildClientFactsModel,
  filterClients,
  isClientEntityType,
  type ClientEntityType,
} from '@/features/clients/client-readiness'
import { useMigrationWizard } from '@/features/migration/WizardProvider'
import { queryInputUrlUpdateRateLimit } from '@/lib/query-rate-limit'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

const CLIENT_LIST_LIMIT = 500
const REPLACE_HISTORY_OPTIONS = { history: 'replace' } as const

export const clientsSearchParamsParsers = {
  q: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  entity: parseAsStringLiteral(CLIENT_ENTITY_FILTERS)
    .withDefault(ALL_ENTITIES)
    .withOptions(REPLACE_HISTORY_OPTIONS),
  state: parseAsString.withDefault(STATE_FILTER_ALL).withOptions(REPLACE_HISTORY_OPTIONS),
  client: parseAsString.withOptions(REPLACE_HISTORY_OPTIONS),
} as const

export type ClientsSearchParams = inferParserType<typeof clientsSearchParamsParsers>

const EMPTY_CLIENTS: ClientPublic[] = []

function useEntityLabels(): Record<ClientEntityType, string> {
  const { t } = useLingui()
  return useMemo(
    () => ({
      llc: t`LLC`,
      s_corp: t`S corp`,
      partnership: t`Partnership`,
      c_corp: t`C corp`,
      sole_prop: t`Sole prop`,
      trust: t`Trust`,
      individual: t`Individual`,
      other: t`Other`,
    }),
    [t],
  )
}

export function ClientsRoute() {
  const { t } = useLingui()
  const queryClient = useQueryClient()
  const { openWizard } = useMigrationWizard()
  const entityLabels = useEntityLabels()
  const [
    { q: search, entity: entityFilter, state: stateFilter, client: selectedClientId },
    setClientsQuery,
  ] = useQueryStates(clientsSearchParamsParsers)

  const clientsQuery = useQuery(
    orpc.clients.listByFirm.queryOptions({ input: { limit: CLIENT_LIST_LIMIT } }),
  )
  const clients = clientsQuery.data ?? EMPTY_CLIENTS
  const factsModel = useMemo(() => buildClientFactsModel(clients), [clients])
  const filteredClients = useMemo(
    () => filterClients(clients, { search, entityFilter, stateFilter }),
    [clients, entityFilter, search, stateFilter],
  )
  const activeClient =
    (selectedClientId ? filteredClients.find((client) => client.id === selectedClientId) : null) ??
    filteredClients[0] ??
    null

  const createMutation = useMutation(
    orpc.clients.create.mutationOptions({
      onSuccess: (client) => {
        void queryClient.invalidateQueries({ queryKey: orpc.clients.listByFirm.key() })
        void setClientsQuery({
          q: null,
          entity: ALL_ENTITIES,
          state: STATE_FILTER_ALL,
          client: client.id,
        })
        toast.success(t`Client created`, { description: client.name })
      },
      onError: (err) => {
        toast.error(t`Couldn't create client`, {
          description: rpcErrorMessage(err) ?? t`Please try again.`,
        })
      },
    }),
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      void setClientsQuery(
        { q: value || null, client: null },
        value === '' ? undefined : { limitUrlUpdates: queryInputUrlUpdateRateLimit },
      )
    },
    [setClientsQuery],
  )

  const handleEntityFilterChange = useCallback(
    (value: string | null) => {
      if (!value || (value !== ALL_ENTITIES && !isClientEntityType(value))) return
      void setClientsQuery({
        entity: value === ALL_ENTITIES ? null : value,
        client: null,
      })
    },
    [setClientsQuery],
  )

  const handleStateFilterChange = useCallback(
    (value: string | null) => {
      if (!value) return
      void setClientsQuery({
        state: value === STATE_FILTER_ALL ? null : value,
        client: null,
      })
    },
    [setClientsQuery],
  )

  const handleSelectClient = useCallback(
    (clientId: string) => {
      void setClientsQuery({ client: clientId })
    },
    [setClientsQuery],
  )

  const handleCreateClient = useCallback(
    (input: ClientCreateInput, callbacks: { onSuccess: () => void }) => {
      createMutation.mutate(input, callbacks)
    },
    [createMutation],
  )

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            <Trans>Clients</Trans>
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-text-primary">
              <Trans>Client facts</Trans>
            </h1>
            <p className="max-w-3xl text-sm text-text-secondary">
              <Trans>
                Validate the firm client facts that generate obligations, dashboard risk, and Pulse
                matches.
              </Trans>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openWizard}>
            <FileSearchIcon data-icon="inline-start" />
            <Trans>Import clients</Trans>
          </Button>
          <CreateClientDialog
            entityLabels={entityLabels}
            isPending={createMutation.isPending}
            onCreate={handleCreateClient}
          />
        </div>
      </header>

      {clientsQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            <Trans>Couldn't load clients</Trans>
          </AlertTitle>
          <AlertDescription>
            {rpcErrorMessage(clientsQuery.error) ?? t`Please try again.`}{' '}
            <button type="button" className="underline" onClick={() => void clientsQuery.refetch()}>
              <Trans>Retry</Trans>
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      <ClientFactsWorkspace
        clients={clients}
        filteredClients={filteredClients}
        activeClient={activeClient}
        factsModel={factsModel}
        entityLabels={entityLabels}
        isLoading={clientsQuery.isLoading}
        search={search}
        entityFilter={entityFilter}
        stateFilter={stateFilter}
        onSearchChange={handleSearchChange}
        onEntityFilterChange={handleEntityFilterChange}
        onStateFilterChange={handleStateFilterChange}
        onSelectClient={handleSelectClient}
        onImport={openWizard}
      />
    </div>
  )
}
