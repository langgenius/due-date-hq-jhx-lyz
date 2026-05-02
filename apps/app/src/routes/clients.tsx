import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { AlertCircleIcon, FileClockIcon, FileSearchIcon } from 'lucide-react'
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
  type inferParserType,
} from 'nuqs'
import { toast } from 'sonner'

import type { ClientCreateInput, ClientPublic } from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Button } from '@duedatehq/ui/components/ui/button'

import { ClientFactsWorkspace } from '@/features/clients/ClientFactsWorkspace'
import { CreateClientDialog } from '@/features/clients/CreateClientDialog'
import {
  CLIENT_ENTITY_TYPES,
  CLIENT_READINESS_FILTERS,
  CLIENT_SOURCE_FILTERS,
  STATE_FILTER_ALL,
  buildClientFactsModel,
  filterClients,
  isClientEntityType,
  isClientReadinessStatus,
  isClientSourceType,
  type ClientEntityType,
} from '@/features/clients/client-readiness'
import { ImportHistoryDrawer } from '@/features/migration/ImportHistoryDrawer'
import { useMigrationWizard } from '@/features/migration/WizardProvider'
import { queryInputUrlUpdateRateLimit } from '@/lib/query-rate-limit'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

const CLIENT_LIST_LIMIT = 500
const REPLACE_HISTORY_OPTIONS = { history: 'replace' } as const

export const clientsSearchParamsParsers = {
  q: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  clients: parseAsArrayOf(parseAsString).withDefault([]).withOptions(REPLACE_HISTORY_OPTIONS),
  entity: parseAsArrayOf(parseAsStringLiteral(CLIENT_ENTITY_TYPES))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
  state: parseAsArrayOf(parseAsString).withDefault([]).withOptions(REPLACE_HISTORY_OPTIONS),
  readiness: parseAsArrayOf(parseAsStringLiteral(CLIENT_READINESS_FILTERS))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
  source: parseAsArrayOf(parseAsStringLiteral(CLIENT_SOURCE_FILTERS))
    .withDefault([])
    .withOptions(REPLACE_HISTORY_OPTIONS),
  owner: parseAsArrayOf(parseAsString).withDefault([]).withOptions(REPLACE_HISTORY_OPTIONS),
  client: parseAsString.withOptions(REPLACE_HISTORY_OPTIONS),
  importHistory: parseAsStringLiteral(['open']).withOptions(REPLACE_HISTORY_OPTIONS),
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
  const [profileOpen, setProfileOpen] = useState(false)
  const [
    {
      q: search,
      clients: clientFilter,
      entity: entityFilter,
      state: stateFilter,
      readiness: readinessFilter,
      source: sourceFilter,
      owner: ownerFilter,
      client: selectedClientId,
      importHistory,
    },
    setClientsQuery,
  ] = useQueryStates(clientsSearchParamsParsers)

  const clientsQuery = useQuery(
    orpc.clients.listByFirm.queryOptions({ input: { limit: CLIENT_LIST_LIMIT } }),
  )
  const clients = clientsQuery.data ?? EMPTY_CLIENTS
  const factsModel = useMemo(() => buildClientFactsModel(clients), [clients])
  const clientIdQuery = useMemo(() => cleanStringFilters(clientFilter), [clientFilter])
  const stateQuery = useMemo(
    () =>
      cleanStringFilters(stateFilter)
        .map((state) => state.toUpperCase())
        .filter((state) => state !== STATE_FILTER_ALL),
    [stateFilter],
  )
  const ownerQuery = useMemo(() => cleanStringFilters(ownerFilter), [ownerFilter])
  const filteredClients = useMemo(
    () =>
      filterClients(clients, {
        search,
        clientFilters: clientIdQuery,
        entityFilters: entityFilter,
        stateFilters: stateQuery,
        readinessFilters: readinessFilter,
        sourceFilters: sourceFilter,
        ownerFilters: ownerQuery,
      }),
    [
      clientIdQuery,
      clients,
      entityFilter,
      ownerQuery,
      readinessFilter,
      search,
      sourceFilter,
      stateQuery,
    ],
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
          clients: null,
          entity: null,
          state: null,
          readiness: null,
          source: null,
          owner: null,
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

  const handleClientFilterChange = useCallback(
    (values: string[]) => {
      void setClientsQuery({
        clients: values.length > 0 ? values : null,
        client: null,
      })
    },
    [setClientsQuery],
  )

  const handleEntityFilterChange = useCallback(
    (values: string[]) => {
      const typedEntities = values.filter(isClientEntityType)
      void setClientsQuery({
        entity: typedEntities.length > 0 ? typedEntities : null,
        client: null,
      })
    },
    [setClientsQuery],
  )

  const handleStateFilterChange = useCallback(
    (values: string[]) => {
      const states = cleanStringFilters(values)
        .map((state) => state.toUpperCase())
        .filter((state) => state !== STATE_FILTER_ALL)
      void setClientsQuery({
        state: states.length > 0 ? states : null,
        client: null,
      })
    },
    [setClientsQuery],
  )

  const handleReadinessFilterChange = useCallback(
    (values: string[]) => {
      const typedReadiness = values.filter(isClientReadinessStatus)
      void setClientsQuery({
        readiness: typedReadiness.length > 0 ? typedReadiness : null,
        client: null,
      })
    },
    [setClientsQuery],
  )

  const handleSourceFilterChange = useCallback(
    (values: string[]) => {
      const typedSources = values.filter(isClientSourceType)
      void setClientsQuery({
        source: typedSources.length > 0 ? typedSources : null,
        client: null,
      })
    },
    [setClientsQuery],
  )

  const handleOwnerFilterChange = useCallback(
    (values: string[]) => {
      const owners = cleanStringFilters(values)
      void setClientsQuery({
        owner: owners.length > 0 ? owners : null,
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

  const handleImportHistoryOpenChange = useCallback(
    (next: boolean) => {
      void setClientsQuery({ importHistory: next ? 'open' : null })
    },
    [setClientsQuery],
  )

  const handleViewImportedClient = useCallback(
    (clientId: string) => {
      void setClientsQuery({
        q: null,
        clients: null,
        entity: null,
        state: null,
        readiness: null,
        source: null,
        owner: null,
        client: clientId,
        importHistory: 'open',
      }).then(() => setProfileOpen(true))
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
          <Button variant="ghost" onClick={() => handleImportHistoryOpenChange(true)}>
            <FileClockIcon data-icon="inline-start" />
            <Trans>Import history</Trans>
          </Button>
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

      <ImportHistoryDrawer
        open={importHistory === 'open'}
        onOpenChange={handleImportHistoryOpenChange}
        onViewClient={handleViewImportedClient}
      />
      <ClientFactsWorkspace
        clients={clients}
        filteredClients={filteredClients}
        activeClient={activeClient}
        factsModel={factsModel}
        entityLabels={entityLabels}
        isLoading={clientsQuery.isLoading}
        search={search}
        clientFilter={clientIdQuery}
        entityFilter={entityFilter}
        stateFilter={stateQuery}
        readinessFilter={readinessFilter}
        sourceFilter={sourceFilter}
        ownerFilter={ownerQuery}
        profileOpen={profileOpen}
        onSearchChange={handleSearchChange}
        onClientFilterChange={handleClientFilterChange}
        onEntityFilterChange={handleEntityFilterChange}
        onStateFilterChange={handleStateFilterChange}
        onReadinessFilterChange={handleReadinessFilterChange}
        onSourceFilterChange={handleSourceFilterChange}
        onOwnerFilterChange={handleOwnerFilterChange}
        onSelectClient={handleSelectClient}
        onProfileOpenChange={setProfileOpen}
        onImport={openWizard}
      />
    </div>
  )
}

function cleanStringFilters(values: readonly string[], maxLength = 120): string[] {
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value.length <= maxLength),
    ),
  ]
}
