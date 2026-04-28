import { useMemo, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  AlertCircleIcon,
  Building2Icon,
  FileSearchIcon,
  PlusIcon,
  SearchIcon,
  UserRoundCheckIcon,
  UsersRoundIcon,
  type LucideIcon,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { parseAsString, parseAsStringLiteral, useQueryStates, type inferParserType } from 'nuqs'

import {
  ClientCreateInputSchema,
  type ClientCreateInput,
  type ClientPublic,
} from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Badge, BadgeStatusDot } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@duedatehq/ui/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@duedatehq/ui/components/ui/field'
import { Input } from '@duedatehq/ui/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@duedatehq/ui/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@duedatehq/ui/components/ui/table'
import { Textarea } from '@duedatehq/ui/components/ui/textarea'

import { useMigrationWizard } from '@/features/migration/WizardProvider'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'
import { formatDate } from '@/lib/utils'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string
    cellClassName?: string
  }
}

const CLIENT_ENTITY_TYPES = [
  'llc',
  's_corp',
  'partnership',
  'c_corp',
  'sole_prop',
  'trust',
  'individual',
  'other',
] as const satisfies readonly ClientCreateInput['entityType'][]
const EMPTY_CLIENTS: ClientPublic[] = []
const ALL_ENTITIES = 'all'
const CLIENT_ENTITY_FILTERS = [ALL_ENTITIES, ...CLIENT_ENTITY_TYPES] as const
const STATE_FILTER_ALL = 'all'
const CLIENT_LIST_LIMIT = 500
const REPLACE_HISTORY_OPTIONS = { history: 'replace' } as const

type ClientEntityType = ClientCreateInput['entityType']
type ClientFormValues = {
  name: string
  entityType: ClientEntityType
  ein: string
  state: string
  county: string
  email: string
  assigneeName: string
  notes: string
}
type ClientFormField = keyof ClientFormValues
type ClientMetric = {
  label: string
  value: string
  detail: string
  icon: LucideIcon
}

export const clientsSearchParamsParsers = {
  q: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  entity: parseAsStringLiteral(CLIENT_ENTITY_FILTERS)
    .withDefault(ALL_ENTITIES)
    .withOptions(REPLACE_HISTORY_OPTIONS),
  state: parseAsString.withDefault(STATE_FILTER_ALL).withOptions(REPLACE_HISTORY_OPTIONS),
  client: parseAsString.withOptions(REPLACE_HISTORY_OPTIONS),
} as const

export type ClientsSearchParams = inferParserType<typeof clientsSearchParamsParsers>

const defaultClientFormValues: ClientFormValues = {
  name: '',
  entityType: 'llc',
  ein: '',
  state: '',
  county: '',
  email: '',
  assigneeName: '',
  notes: '',
}

function createClientFormSchema(t: ReturnType<typeof useLingui>['t']) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t`Client name is required`),
    entityType: z.enum(CLIENT_ENTITY_TYPES),
    ein: z
      .string()
      .trim()
      .refine((value) => value === '' || /^\d{2}-\d{7}$/.test(value), {
        message: t`Use EIN format ##-#######`,
      }),
    state: z
      .string()
      .trim()
      .refine((value) => value === '' || /^[A-Za-z]{2}$/.test(value), {
        message: t`Use a 2-letter state code`,
      }),
    county: z
      .string()
      .trim()
      .max(120, t`County must be 120 characters or fewer`),
    email: z
      .string()
      .trim()
      .refine((value) => value === '' || z.email().safeParse(value).success, {
        message: t`Enter a valid email address`,
      }),
    assigneeName: z
      .string()
      .trim()
      .max(200, t`Owner must be 200 characters or fewer`),
    notes: z
      .string()
      .trim()
      .max(5000, t`Notes must be 5000 characters or fewer`),
  })
}

function isClientEntityType(value: string): value is ClientEntityType {
  return CLIENT_ENTITY_TYPES.some((entityType) => entityType === value)
}

function nullableText(value: string): string | null {
  const next = value.trim()
  return next ? next : null
}

function formValuesToInput(values: ClientFormValues): ClientCreateInput {
  return {
    name: values.name.trim(),
    entityType: values.entityType,
    ein: nullableText(values.ein),
    state: nullableText(values.state)?.toUpperCase() ?? null,
    county: nullableText(values.county),
    email: nullableText(values.email),
    assigneeName: nullableText(values.assigneeName),
    notes: nullableText(values.notes),
  }
}

function contractPathToFormField(path: PropertyKey[]): ClientFormField | null {
  const [field] = path
  switch (field) {
    case 'name':
    case 'entityType':
    case 'ein':
    case 'state':
    case 'county':
    case 'email':
    case 'assigneeName':
    case 'notes':
      return field
    default:
      return null
  }
}

function getClientSearchHaystack(client: ClientPublic): string {
  return [
    client.name,
    client.ein,
    client.state,
    client.county,
    client.entityType,
    client.email,
    client.assigneeName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

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
  const activeClientId = selectedClientId

  const clientsQuery = useQuery(
    orpc.clients.listByFirm.queryOptions({ input: { limit: CLIENT_LIST_LIMIT } }),
  )
  const clients = clientsQuery.data ?? EMPTY_CLIENTS

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

  const stateOptions = useMemo(
    () =>
      Array.from(
        new Set(
          clients.map((client) => client.state).filter((state): state is string => Boolean(state)),
        ),
      ).sort(),
    [clients],
  )

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return clients.filter((client) => {
      if (entityFilter !== ALL_ENTITIES && client.entityType !== entityFilter) return false
      if (stateFilter !== STATE_FILTER_ALL && client.state !== stateFilter) return false
      if (normalizedSearch && !getClientSearchHaystack(client).includes(normalizedSearch)) {
        return false
      }
      return true
    })
  }, [clients, entityFilter, search, stateFilter])

  const activeClient =
    (activeClientId ? filteredClients.find((client) => client.id === activeClientId) : null) ??
    filteredClients[0] ??
    null

  const metrics = useMemo<ClientMetric[]>(
    () => [
      {
        label: t`Clients`,
        value: String(clients.length),
        detail: t`tenant-scoped records`,
        icon: UsersRoundIcon,
      },
      {
        label: t`Assigned`,
        value: String(clients.filter((client) => client.assigneeName).length),
        detail: t`with owner names`,
        icon: UserRoundCheckIcon,
      },
      {
        label: t`States`,
        value: String(stateOptions.length),
        detail: t`represented in directory`,
        icon: Building2Icon,
      },
    ],
    [clients, stateOptions.length, t],
  )

  const columns = useMemo<ColumnDef<ClientPublic>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t`Client`,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium text-text-primary">{row.original.name}</span>
            <span className="truncate text-xs text-text-tertiary">
              {row.original.email ?? t`No email`}
            </span>
          </div>
        ),
        meta: { cellClassName: 'min-w-[220px]' },
      },
      {
        accessorKey: 'entityType',
        header: t`Entity`,
        cell: (info) => entityLabels[info.getValue<ClientEntityType>()],
      },
      {
        accessorKey: 'state',
        header: t`Location`,
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">
            {[row.original.state, row.original.county].filter(Boolean).join(' / ') || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'ein',
        header: t`EIN`,
        cell: (info) => (
          <span className="font-mono tabular-nums">{info.getValue<string | null>() ?? 'N/A'}</span>
        ),
      },
      {
        accessorKey: 'assigneeName',
        header: t`Owner`,
        cell: (info) => info.getValue<string | null>() ?? t`Unassigned`,
      },
      {
        accessorKey: 'migrationBatchId',
        header: t`Source`,
        cell: (info) =>
          info.getValue<string | null>() ? (
            <Badge variant="info">
              <BadgeStatusDot tone="normal" />
              <Trans>Imported</Trans>
            </Badge>
          ) : (
            <Badge variant="outline">
              <Trans>Manual</Trans>
            </Badge>
          ),
      },
      {
        accessorKey: 'updatedAt',
        header: t`Updated`,
        cell: (info) => (
          <span className="font-mono tabular-nums">{formatDate(info.getValue<string>())}</span>
        ),
      },
    ],
    [entityLabels, t],
  )

  const table = useReactTable({
    data: filteredClients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (client) => client.id,
  })

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            <Trans>Admin</Trans>
          </span>
          <p className="max-w-3xl text-sm text-text-secondary">
            <Trans>
              Manage the firm client directory that powers migration, rules preview, dashboard risk,
              and workboard obligations.
            </Trans>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openWizard}>
            <FileSearchIcon data-icon="inline-start" />
            <Trans>Import clients</Trans>
          </Button>
          <CreateClientDialog
            entityLabels={entityLabels}
            isPending={createMutation.isPending}
            onCreate={(input, callbacks) => createMutation.mutate(input, callbacks)}
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

      <section className="grid gap-3 md:grid-cols-3">
        {clientsQuery.isLoading
          ? [0, 1, 2].map((item) => <Skeleton key={item} className="h-24 w-full" />)
          : metrics.map((metric) => <ClientMetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 flex-col gap-1">
                <CardTitle>
                  <Trans>Client directory</Trans>
                </CardTitle>
                <CardDescription>
                  <Trans>Search, segment, and inspect active tenant client records.</Trans>
                </CardDescription>
              </div>
              <CardAction>
                <Badge variant="outline" className="font-mono tabular-nums">
                  {filteredClients.length}/{clients.length}
                </Badge>
              </CardAction>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_180px_140px]">
              <InputGroup>
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  value={search}
                  onChange={(event) => {
                    void setClientsQuery({ q: event.target.value || null, client: null })
                  }}
                  placeholder={t`Search clients`}
                />
              </InputGroup>
              <Select
                value={entityFilter}
                onValueChange={(value) => {
                  if (value && (value === ALL_ENTITIES || isClientEntityType(value))) {
                    void setClientsQuery({
                      entity: value === ALL_ENTITIES ? null : value,
                      client: null,
                    })
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL_ENTITIES}>
                      <Trans>All entities</Trans>
                    </SelectItem>
                    {CLIENT_ENTITY_TYPES.map((entityType) => (
                      <SelectItem key={entityType} value={entityType}>
                        {entityLabels[entityType]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={stateFilter}
                onValueChange={(value) => {
                  if (value) {
                    void setClientsQuery({
                      state: value === STATE_FILTER_ALL ? null : value,
                      client: null,
                    })
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={STATE_FILTER_ALL}>
                      <Trans>All states</Trans>
                    </SelectItem>
                    {stateOptions.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {clientsQuery.isLoading ? (
              <ClientTableSkeleton />
            ) : filteredClients.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-divider-regular">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={header.column.columnDef.meta?.headerClassName}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={activeClient?.id === row.original.id ? 'selected' : undefined}
                        className="cursor-pointer"
                        onClick={() => void setClientsQuery({ client: row.original.id })}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cell.column.columnDef.meta?.cellClassName}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <ClientEmptyState hasClients={clients.length > 0} onImport={openWizard} />
            )}
          </CardContent>
        </Card>

        <ClientDetailPanel client={activeClient} entityLabels={entityLabels} />
      </section>
    </div>
  )
}

function ClientMetricCard({ metric }: { metric: ClientMetric }) {
  const Icon = metric.icon
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium text-text-secondary">{metric.label}</span>
          <span className="font-mono text-3xl font-semibold tabular-nums text-text-primary">
            {metric.value}
          </span>
          <span className="truncate text-xs text-text-tertiary">{metric.detail}</span>
        </div>
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-background-section text-text-secondary">
          <Icon className="size-4" aria-hidden />
        </div>
      </CardContent>
    </Card>
  )
}

function ClientTableSkeleton() {
  return (
    <div className="grid gap-2">
      {[0, 1, 2, 3, 4].map((item) => (
        <Skeleton key={item} className="h-12 w-full" />
      ))}
    </div>
  )
}

function ClientEmptyState({ hasClients, onImport }: { hasClients: boolean; onImport: () => void }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-divider-regular p-6 text-center">
      <div className="grid size-10 place-items-center rounded-lg bg-background-section text-text-secondary">
        <UsersRoundIcon className="size-5" aria-hidden />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-medium text-text-primary">
          {hasClients ? (
            <Trans>No clients match these filters</Trans>
          ) : (
            <Trans>No clients yet</Trans>
          )}
        </p>
        <p className="text-sm text-text-tertiary">
          {hasClients ? (
            <Trans>Clear search or filters to return to the full firm directory.</Trans>
          ) : (
            <Trans>Import a CSV or create the first manual client record.</Trans>
          )}
        </p>
      </div>
      {!hasClients ? (
        <Button variant="outline" onClick={onImport}>
          <FileSearchIcon data-icon="inline-start" />
          <Trans>Run migration</Trans>
        </Button>
      ) : null}
    </div>
  )
}

function ClientDetailPanel({
  client,
  entityLabels,
}: {
  client: ClientPublic | null
  entityLabels: Record<ClientEntityType, string>
}) {
  return (
    <Card className="xl:sticky xl:top-6">
      <CardHeader>
        <CardTitle>
          <Trans>Client detail</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>Read-only v1 snapshot from clients.get/listByFirm data.</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {client ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-base font-semibold text-text-primary">
                  {client.name}
                </span>
                <span className="text-sm text-text-tertiary">
                  {entityLabels[client.entityType]}
                </span>
              </div>
              <Badge variant={client.migrationBatchId ? 'info' : 'outline'}>
                {client.migrationBatchId ? <Trans>Imported</Trans> : <Trans>Manual</Trans>}
              </Badge>
            </div>

            <div className="grid gap-3">
              <DetailRow label={<Trans>EIN</Trans>} value={client.ein ?? 'N/A'} mono />
              <DetailRow
                label={<Trans>Location</Trans>}
                value={[client.state, client.county].filter(Boolean).join(' / ') || 'N/A'}
                mono
              />
              <DetailRow label={<Trans>Email</Trans>} value={client.email ?? 'N/A'} />
              <DetailRow label={<Trans>Owner</Trans>} value={client.assigneeName ?? 'N/A'} />
              <DetailRow label={<Trans>Created</Trans>} value={formatDate(client.createdAt)} mono />
              <DetailRow label={<Trans>Updated</Trans>} value={formatDate(client.updatedAt)} mono />
            </div>

            <div className="rounded-lg border border-divider-regular bg-background-section p-3">
              <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                <Trans>Notes</Trans>
              </span>
              <p className="mt-2 text-sm text-text-secondary">
                {client.notes || <Trans>No notes.</Trans>}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-divider-regular p-6 text-center text-sm text-text-tertiary">
            <Trans>Select a client to inspect the record.</Trans>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: ReactNode
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
      <span className="text-text-tertiary">{label}</span>
      <span className={mono ? 'font-mono tabular-nums text-text-primary' : 'text-text-primary'}>
        {value}
      </span>
    </div>
  )
}

function CreateClientDialog({
  entityLabels,
  isPending,
  onCreate,
}: {
  entityLabels: Record<ClientEntityType, string>
  isPending: boolean
  onCreate: (input: ClientCreateInput, callbacks: { onSuccess: () => void }) => void
}) {
  const { t } = useLingui()
  const [open, setOpen] = useState(false)
  const clientFormSchema = useMemo(() => createClientFormSchema(t), [t])
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultClientFormValues,
  })
  const entityType = form.watch('entityType')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        <PlusIcon data-icon="inline-start" />
        <Trans>New client</Trans>
      </DialogTrigger>
      <DialogContent className="w-[640px] max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>
            <Trans>Create client</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>Add a manual client record to the active firm directory.</Trans>
          </DialogDescription>
        </DialogHeader>
        <form
          className="contents"
          onSubmit={form.handleSubmit((values) => {
            const parsed = ClientCreateInputSchema.safeParse(formValuesToInput(values))
            if (!parsed.success) {
              parsed.error.issues.forEach((issue) => {
                const field = contractPathToFormField(issue.path)
                if (field) form.setError(field, { message: issue.message, type: 'validate' })
              })
              return
            }

            onCreate(parsed.data, {
              onSuccess: () => {
                form.reset(defaultClientFormValues)
                setOpen(false)
              },
            })
          })}
        >
          <FieldGroup className="gap-4">
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <Field>
                <FieldLabel htmlFor="client-name">
                  <Trans>Client name</Trans>
                </FieldLabel>
                <Input
                  id="client-name"
                  aria-invalid={Boolean(form.formState.errors.name)}
                  {...form.register('name')}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>
              <Field>
                <FieldLabel>
                  <Trans>Entity type</Trans>
                </FieldLabel>
                <Select
                  value={entityType}
                  onValueChange={(value) => {
                    if (value && isClientEntityType(value)) {
                      form.setValue('entityType', value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CLIENT_ENTITY_TYPES.map((entity) => (
                        <SelectItem key={entity} value={entity}>
                          {entityLabels[entity]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="client-ein">
                  <Trans>EIN</Trans>
                </FieldLabel>
                <Input
                  id="client-ein"
                  className="font-mono tabular-nums"
                  placeholder="12-3456789"
                  aria-invalid={Boolean(form.formState.errors.ein)}
                  {...form.register('ein')}
                />
                <FieldError errors={[form.formState.errors.ein]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-state">
                  <Trans>State</Trans>
                </FieldLabel>
                <Input
                  id="client-state"
                  className="font-mono uppercase tabular-nums"
                  placeholder="CA"
                  maxLength={2}
                  aria-invalid={Boolean(form.formState.errors.state)}
                  {...form.register('state')}
                />
                <FieldError errors={[form.formState.errors.state]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-county">
                  <Trans>County</Trans>
                </FieldLabel>
                <Input id="client-county" {...form.register('county')} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="client-email">
                  <Trans>Email</Trans>
                </FieldLabel>
                <Input
                  id="client-email"
                  type="email"
                  aria-invalid={Boolean(form.formState.errors.email)}
                  {...form.register('email')}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-assignee">
                  <Trans>Owner</Trans>
                </FieldLabel>
                <Input id="client-assignee" {...form.register('assigneeName')} />
                <FieldDescription>
                  <Trans>Free-text for now; Team members wire in Phase 1.</Trans>
                </FieldDescription>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="client-notes">
                <Trans>Notes</Trans>
              </FieldLabel>
              <Textarea id="client-notes" rows={3} {...form.register('notes')} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              <Trans>Cancel</Trans>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t`Creating...` : t`Create client`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
