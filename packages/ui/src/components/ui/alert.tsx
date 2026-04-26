import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@duedatehq/ui/lib/utils'

const alertVariants = cva(
  cn(
    'group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm',
    'has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18',
    'has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5',
    "*:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        default: 'border-divider-regular bg-components-card-bg text-text-primary',
        info: 'border-state-accent-hover-alt bg-state-accent-hover text-text-primary *:[svg]:text-text-accent',
        success:
          'border-state-success-hover-alt bg-state-success-hover text-text-primary *:[svg]:text-text-success',
        warning:
          'border-state-warning-hover-alt bg-state-warning-hover text-text-primary *:[svg]:text-text-warning',
        destructive:
          'border-state-destructive-hover-alt bg-state-destructive-hover text-text-primary *:[svg]:text-text-destructive *:data-[slot=alert-description]:text-text-destructive-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'font-medium text-text-primary group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 hover:[&_a]:text-text-accent',
        className,
      )}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-sm text-balance text-text-tertiary md:text-pretty [&_a]:underline [&_a]:underline-offset-3 hover:[&_a]:text-text-accent [&_p:not(:last-child)]:mb-4',
        className,
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('absolute top-2.5 right-3', className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
