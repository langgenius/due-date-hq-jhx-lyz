import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@duedatehq/ui/lib/utils'

const badgeVariants = cva(
  cn(
    'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-badge font-medium whitespace-nowrap transition-colors',
    'focus-visible:ring-2 focus-visible:ring-state-accent-active-alt',
    'has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
    'aria-invalid:border-state-destructive-border aria-invalid:ring-2 aria-invalid:ring-state-destructive-active',
    '[&>svg]:pointer-events-none [&>svg]:size-3!',
  ),
  {
    variants: {
      variant: {
        default: 'bg-state-accent-active-alt text-text-accent hover:[a]:bg-state-accent-active',
        secondary: 'bg-components-badge-bg-gray-soft text-text-secondary',
        success: 'bg-components-badge-bg-green-soft text-text-success',
        warning: 'bg-components-badge-bg-warning-soft text-text-warning',
        info: 'bg-components-badge-bg-blue-soft text-text-accent',
        destructive: 'bg-components-badge-bg-red-soft text-text-destructive',
        outline: 'border-divider-regular text-text-secondary hover:[a]:bg-state-base-hover',
        ghost: 'text-text-secondary hover:bg-state-base-hover',
        link: 'text-text-accent underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

/**
 * Status indicator dot. Renders the Dify-style halo using the
 * `--shadow-status-indicator-{tone}` composite shadow tokens.
 */
function BadgeStatusDot({
  tone = 'success',
  className,
  ...props
}: React.ComponentProps<'span'> & {
  tone?: 'success' | 'warning' | 'error' | 'normal' | 'disabled'
}) {
  const palette = {
    success: 'bg-components-badge-status-light-success-bg shadow-status-indicator-green',
    warning: 'bg-components-badge-status-light-warning-bg shadow-status-indicator-warning',
    error: 'bg-components-badge-status-light-error-bg shadow-status-indicator-red',
    normal: 'bg-components-badge-status-light-normal-bg shadow-status-indicator-blue',
    disabled: 'bg-components-badge-status-light-disabled-bg shadow-status-indicator-gray',
  }[tone]

  return (
    <span
      data-slot="badge-status-dot"
      data-tone={tone}
      aria-hidden
      className={cn('inline-block size-2 shrink-0 rounded-full', palette, className)}
      {...props}
    />
  )
}

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  })
}

export { Badge, BadgeStatusDot, badgeVariants }
