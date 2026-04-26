import { cn } from '@duedatehq/ui/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-state-base-hover-alt', className)}
      {...props}
    />
  )
}

export { Skeleton }
