import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Trans } from '@lingui/react/macro'
import { ArrowUpRightIcon, SparklesIcon } from 'lucide-react'

import type { OpportunityPublic } from '@duedatehq/contracts'
import { Button } from '@duedatehq/ui/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@duedatehq/ui/components/ui/card'
import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'
import { orpc } from '@/lib/rpc'
import { OpportunityKindBadge, OpportunityTimingBadge, opportunityIcon } from './opportunity-ui'

export function ClientOpportunitiesCard({ clientId }: { clientId: string }) {
  const opportunitiesQuery = useQuery(
    orpc.opportunities.list.queryOptions({ input: { clientId, limit: 3 } }),
  )
  const opportunities = opportunitiesQuery.data?.opportunities ?? []

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="flex items-center gap-2 text-sm">
          <SparklesIcon className="size-4 text-text-secondary" aria-hidden />
          <Trans>Future business cues</Trans>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {opportunitiesQuery.isLoading ? (
          <div className="grid gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : opportunities.length === 0 ? (
          <p className="text-sm text-text-secondary">
            <Trans>No lightweight opportunity cues for this client yet.</Trans>
          </p>
        ) : (
          <div className="grid gap-3">
            {opportunities.map((opportunity) => (
              <ClientOpportunityItem key={opportunity.id} opportunity={opportunity} />
            ))}
            <Button
              size="sm"
              variant="outline"
              className="w-fit"
              render={<Link to="/opportunities" />}
            >
              <ArrowUpRightIcon data-icon="inline-start" />
              <Trans>View all opportunities</Trans>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ClientOpportunityItem({ opportunity }: { opportunity: OpportunityPublic }) {
  const Icon = opportunityIcon(opportunity.kind)
  return (
    <article className="grid gap-2 rounded-md border border-divider-subtle bg-background-subtle p-3">
      <div className="flex min-w-0 items-start gap-2">
        <div className="grid size-7 shrink-0 place-items-center rounded-md bg-background-default text-text-secondary">
          <Icon className="size-3.5" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <OpportunityKindBadge kind={opportunity.kind} />
            <OpportunityTimingBadge timing={opportunity.timing} />
          </div>
          <h3 className="mt-2 text-sm font-medium text-text-primary">{opportunity.title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{opportunity.summary}</p>
        </div>
      </div>
    </article>
  )
}
