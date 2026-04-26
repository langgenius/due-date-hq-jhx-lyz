import { Skeleton } from '@duedatehq/ui/components/ui/skeleton'

export function EntryRouteHydrateFallback() {
  return <div aria-hidden className="h-[240px] w-full max-w-[400px]" />
}

export function RouteHydrateFallback() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  )
}
