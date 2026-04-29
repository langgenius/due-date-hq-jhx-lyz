import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Trans, useLingui } from '@lingui/react/macro'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { DownloadIcon, FilterIcon, SearchIcon } from 'lucide-react'

import type { AuditEventPublic, AuditListInput } from '@duedatehq/contracts'
import { AUDIT_FILTER_MAX_LENGTH, AUDIT_SEARCH_MAX_LENGTH } from '@duedatehq/contracts'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Badge } from '@duedatehq/ui/components/ui/badge'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import { Input } from '@duedatehq/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'

import { queryInputUrlUpdateRateLimit, useDebouncedQueryInput } from '@/lib/query-rate-limit'
import { orpc } from '@/lib/rpc'
import { rpcErrorMessage } from '@/lib/rpc-error'

import { AuditEventDrawer } from './audit-event-drawer'
import { AuditLogTable } from './audit-log-table'
import {
  AUDIT_CATEGORY_OPTIONS,
  AUDIT_RANGE_OPTIONS,
  categoryToInput,
  isAuditCategoryOption,
  isAuditRange,
  type AuditCategoryOption,
} from './audit-log-model'

const EMPTY_EVENTS: AuditEventPublic[] = []
const INITIAL_CURSOR: string | null = null
const PAGE_SIZE = 50
const REPLACE_HISTORY_OPTIONS = { history: 'replace' } as const

export const auditLogSearchParamsParsers = {
  q: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  category: parseAsStringLiteral(AUDIT_CATEGORY_OPTIONS)
    .withDefault('all')
    .withOptions(REPLACE_HISTORY_OPTIONS),
  range: parseAsStringLiteral(AUDIT_RANGE_OPTIONS)
    .withDefault('24h')
    .withOptions(REPLACE_HISTORY_OPTIONS),
  action: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  actor: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  entityType: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  entity: parseAsString.withDefault('').withOptions(REPLACE_HISTORY_OPTIONS),
  event: parseAsString.withOptions(REPLACE_HISTORY_OPTIONS),
} as const

function useAuditCategoryLabels(): Record<AuditCategoryOption, string> {
  const { t } = useLingui()
  return {
    all: t`All categories`,
    client: t`Client`,
    obligation: t`Obligation`,
    migration: t`Migration`,
    rules: t`Rules`,
    auth: t`Auth`,
    team: t`Team`,
    pulse: t`Pulse`,
    export: t`Export`,
    ai: t`AI`,
    system: t`System`,
  }
}

function useAuditRangeLabels(): Record<(typeof AUDIT_RANGE_OPTIONS)[number], string> {
  const { t } = useLingui()
  return {
    '24h': t`Last 24h`,
    '7d': t`Last 7d`,
    '30d': t`Last 30d`,
    all: t`All time`,
  }
}

function useAuditEvents(queryInputWithoutCursor: Omit<AuditListInput, 'cursor'>) {
  return useInfiniteQuery(
    orpc.audit.list.infiniteOptions({
      initialPageParam: INITIAL_CURSOR,
      input: (cursor) => ({
        ...queryInputWithoutCursor,
        cursor,
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
  )
}

function AuditSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function AuditLogPage() {
  const { t } = useLingui()
  const categoryLabels = useAuditCategoryLabels()
  const rangeLabels = useAuditRangeLabels()
  const [query, setQuery] = useQueryStates(auditLogSearchParamsParsers)

  const debouncedSearch = useDebouncedQueryInput(query.q, { maxLength: AUDIT_SEARCH_MAX_LENGTH })
  const debouncedAction = useDebouncedQueryInput(query.action, {
    maxLength: AUDIT_FILTER_MAX_LENGTH,
  })
  const debouncedActor = useDebouncedQueryInput(query.actor, {
    maxLength: AUDIT_FILTER_MAX_LENGTH,
  })
  const debouncedEntityType = useDebouncedQueryInput(query.entityType, {
    maxLength: AUDIT_FILTER_MAX_LENGTH,
  })
  const debouncedEntity = useDebouncedQueryInput(query.entity, {
    maxLength: AUDIT_FILTER_MAX_LENGTH,
  })

  const queryInputWithoutCursor = useMemo<Omit<AuditListInput, 'cursor'>>(
    () => ({
      limit: PAGE_SIZE,
      range: query.range,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(query.category !== 'all' ? { category: categoryToInput(query.category) } : {}),
      ...(debouncedAction ? { action: debouncedAction } : {}),
      ...(debouncedActor ? { actorId: debouncedActor } : {}),
      ...(debouncedEntityType ? { entityType: debouncedEntityType } : {}),
      ...(debouncedEntity ? { entityId: debouncedEntity } : {}),
    }),
    [
      debouncedAction,
      debouncedActor,
      debouncedEntity,
      debouncedEntityType,
      debouncedSearch,
      query.category,
      query.range,
    ],
  )

  const auditQuery = useAuditEvents(queryInputWithoutCursor)
  const events = useMemo(
    () => auditQuery.data?.pages.flatMap((page) => page.events) ?? EMPTY_EVENTS,
    [auditQuery.data?.pages],
  )
  const selectedEvent = events.find((event) => event.id === query.event) ?? null
  const filtersActive =
    query.q !== '' ||
    query.category !== 'all' ||
    query.range !== '24h' ||
    query.action !== '' ||
    query.actor !== '' ||
    query.entityType !== '' ||
    query.entity !== ''

  function resetFilters() {
    void setQuery({
      q: null,
      category: null,
      range: null,
      action: null,
      actor: null,
      entityType: null,
      entity: null,
      event: null,
    })
  }

  function openEvent(id: string) {
    void setQuery({ event: id })
  }

  function closeEvent(open: boolean) {
    if (!open) void setQuery({ event: null })
  }

  function loadMore() {
    if (!auditQuery.hasNextPage || auditQuery.isFetchingNextPage) return
    void auditQuery.fetchNextPage()
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-wider text-text-tertiary uppercase">
          <Trans>Admin</Trans>
        </span>
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl leading-tight font-semibold text-text-primary">
              <Trans>Audit log</Trans>
            </h1>
            <p className="max-w-180 text-md text-text-secondary">
              <Trans>Review firm-wide write events, before/after state, and actor metadata.</Trans>
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            <DownloadIcon data-icon="inline-start" />
            <Trans>Export · P1</Trans>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans>Audit filters</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Filter by time range, action category, actor, or entity.</Trans>
          </CardDescription>
          <CardAction>
            <Badge variant="outline" className="font-mono tabular-nums">
              {events.length}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_repeat(2,minmax(160px,200px))_auto] lg:items-center">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                aria-label={t`Search audit events`}
                className="pl-8"
                placeholder={t`Search action, entity, or reason`}
                value={query.q}
                onChange={(event) => {
                  const nextSearch = event.target.value
                  void setQuery(
                    { q: nextSearch || null, event: null },
                    nextSearch === ''
                      ? undefined
                      : { limitUrlUpdates: queryInputUrlUpdateRateLimit },
                  )
                }}
              />
            </div>

            <Select
              value={query.category}
              onValueChange={(value) => {
                if (typeof value !== 'string' || !isAuditCategoryOption(value)) return
                void setQuery({ category: value === 'all' ? null : value, event: null })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{categoryLabels[query.category]}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {AUDIT_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {categoryLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={query.range}
              onValueChange={(value) => {
                if (typeof value !== 'string' || !isAuditRange(value)) return
                void setQuery({ range: value === '24h' ? null : value, event: null })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{rangeLabels[query.range]}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {AUDIT_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {rangeLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={resetFilters} disabled={!filtersActive}>
              <FilterIcon data-icon="inline-start" />
              <Trans>Reset</Trans>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Input
              aria-label={t`Exact action`}
              placeholder={t`Action`}
              value={query.action}
              onChange={(event) => {
                const nextAction = event.target.value
                void setQuery(
                  { action: nextAction || null, event: null },
                  nextAction === '' ? undefined : { limitUrlUpdates: queryInputUrlUpdateRateLimit },
                )
              }}
            />
            <Input
              aria-label={t`Actor id`}
              placeholder={t`Actor id`}
              value={query.actor}
              onChange={(event) => {
                const nextActor = event.target.value
                void setQuery(
                  { actor: nextActor || null, event: null },
                  nextActor === '' ? undefined : { limitUrlUpdates: queryInputUrlUpdateRateLimit },
                )
              }}
            />
            <Input
              aria-label={t`Entity type`}
              placeholder={t`Entity type`}
              value={query.entityType}
              onChange={(event) => {
                const nextEntityType = event.target.value
                void setQuery(
                  { entityType: nextEntityType || null, event: null },
                  nextEntityType === ''
                    ? undefined
                    : { limitUrlUpdates: queryInputUrlUpdateRateLimit },
                )
              }}
            />
            <Input
              aria-label={t`Entity id`}
              placeholder={t`Entity id`}
              value={query.entity}
              onChange={(event) => {
                const nextEntity = event.target.value
                void setQuery(
                  { entity: nextEntity || null, event: null },
                  nextEntity === '' ? undefined : { limitUrlUpdates: queryInputUrlUpdateRateLimit },
                )
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans>Event stream</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Newest firm-scoped audit events appear first.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {auditQuery.isLoading ? <AuditSkeleton /> : null}

          {auditQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>
                <Trans>Could not load audit events</Trans>
              </AlertTitle>
              <AlertDescription>
                {rpcErrorMessage(auditQuery.error) ?? t`Please try again.`}
              </AlertDescription>
            </Alert>
          ) : null}

          {!auditQuery.isLoading && !auditQuery.isError && events.length === 0 ? (
            <div className="grid gap-2 rounded-lg border border-divider-subtle p-6 text-center">
              <h2 className="text-lg font-semibold text-text-primary">
                {filtersActive ? (
                  <Trans>No audit events match these filters.</Trans>
                ) : (
                  <Trans>No audit events yet.</Trans>
                )}
              </h2>
              <p className="text-sm text-text-secondary">
                {filtersActive ? (
                  <Trans>Reset filters to return to the latest firm-wide events.</Trans>
                ) : (
                  <Trans>
                    Workboard status updates and client imports will appear here when they write
                    audit rows.
                  </Trans>
                )}
              </p>
            </div>
          ) : null}

          {events.length > 0 ? <AuditLogTable events={events} onOpenEvent={openEvent} /> : null}

          {auditQuery.hasNextPage ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={auditQuery.isFetchingNextPage}>
                {auditQuery.isFetchingNextPage ? (
                  <Trans>Loading...</Trans>
                ) : (
                  <Trans>Load more</Trans>
                )}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AuditEventDrawer
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        onOpenChange={closeEvent}
      />
    </div>
  )
}
