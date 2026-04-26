import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@duedatehq/ui/lib/utils'

/**
 * Button — Dify visual language with backward-compat variant/size keys.
 *
 * New variants (Dify naming): primary, secondary, tertiary, ghost,
 * destructive-primary, destructive-secondary, destructive-tertiary,
 * destructive-ghost, accent, link.
 *
 * Backward-compat keys (callers prior to migration): default → primary,
 * outline → secondary, destructive → destructive-secondary.
 *
 * Sizes (heights match Dify three-tier scale): xs (24, small) /
 * default & sm (32, medium) / lg (36, large) plus matching icon-*.
 * `sm` is kept as an alias of medium for backward compatibility with call-sites.
 */
const buttonVariants = cva(
  cn(
    'group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-colors outline-none select-none',
    'focus-visible:ring-2 focus-visible:ring-state-accent-active-alt',
    'disabled:pointer-events-none disabled:cursor-not-allowed data-[disabled]:cursor-not-allowed',
    'aria-invalid:border-state-destructive-border aria-invalid:ring-2 aria-invalid:ring-state-destructive-active',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        primary: cn(
          'border-components-button-primary-border bg-components-button-primary-bg text-components-button-primary-text shadow-xs',
          'hover:border-components-button-primary-border-hover hover:bg-components-button-primary-bg-hover',
          'aria-expanded:bg-components-button-primary-bg-hover',
          'disabled:border-components-button-primary-border-disabled disabled:bg-components-button-primary-bg-disabled disabled:text-components-button-primary-text-disabled disabled:shadow-none',
        ),
        secondary: cn(
          'border-components-button-secondary-border bg-components-button-secondary-bg text-components-button-secondary-text shadow-xs',
          'hover:border-components-button-secondary-border-hover hover:bg-components-button-secondary-bg-hover',
          'aria-expanded:border-components-button-secondary-border-hover aria-expanded:bg-components-button-secondary-bg-hover',
          'disabled:border-components-button-secondary-border-disabled disabled:bg-components-button-secondary-bg-disabled disabled:text-components-button-secondary-text-disabled',
        ),
        tertiary: cn(
          'bg-components-button-tertiary-bg text-components-button-tertiary-text',
          'hover:bg-components-button-tertiary-bg-hover',
          'aria-expanded:bg-components-button-tertiary-bg-hover',
          'disabled:bg-components-button-tertiary-bg-disabled disabled:text-components-button-tertiary-text-disabled',
        ),
        ghost: cn(
          'text-components-button-ghost-text',
          'hover:bg-components-button-ghost-bg-hover',
          'aria-expanded:bg-components-button-ghost-bg-hover',
          'disabled:text-components-button-ghost-text-disabled',
        ),
        accent: cn(
          'border-components-button-accent-border bg-components-button-accent-bg text-components-button-accent-text shadow-xs',
          'hover:bg-components-button-accent-bg-hover',
          'aria-expanded:bg-components-button-accent-bg-hover',
          'disabled:bg-components-button-accent-bg-disabled disabled:text-components-button-accent-text-disabled',
        ),
        'destructive-primary': cn(
          'border-components-button-destructive-primary-border bg-components-button-destructive-primary-bg text-components-button-destructive-primary-text shadow-xs',
          'hover:border-components-button-destructive-primary-border-hover hover:bg-components-button-destructive-primary-bg-hover',
          'disabled:bg-components-button-destructive-primary-bg-disabled disabled:text-components-button-destructive-primary-text-disabled disabled:shadow-none',
        ),
        'destructive-secondary': cn(
          'border-components-button-destructive-secondary-border bg-components-button-destructive-secondary-bg text-components-button-destructive-secondary-text shadow-xs',
          'hover:border-components-button-destructive-secondary-border-hover hover:bg-components-button-destructive-secondary-bg-hover',
          'disabled:bg-components-button-destructive-secondary-bg-disabled disabled:text-components-button-destructive-secondary-text-disabled',
        ),
        'destructive-tertiary': cn(
          'bg-components-button-destructive-tertiary-bg text-components-button-destructive-tertiary-text',
          'hover:bg-components-button-destructive-tertiary-bg-hover',
          'disabled:text-components-button-destructive-tertiary-text-disabled',
        ),
        'destructive-ghost': cn(
          'text-components-button-destructive-ghost-text',
          'hover:bg-components-button-destructive-ghost-bg-hover',
        ),
        link: 'text-text-accent underline-offset-4 hover:underline',
        // Legacy aliases — preserved so existing call-sites keep working.
        // These are intentionally NOT exported via type narrowing; they alias
        // onto the Dify-style variants above.
        default: cn(
          'border-components-button-primary-border bg-components-button-primary-bg text-components-button-primary-text shadow-xs',
          'hover:border-components-button-primary-border-hover hover:bg-components-button-primary-bg-hover',
          'disabled:border-components-button-primary-border-disabled disabled:bg-components-button-primary-bg-disabled disabled:text-components-button-primary-text-disabled disabled:shadow-none',
        ),
        outline: cn(
          'border-components-button-secondary-border bg-components-button-secondary-bg text-components-button-secondary-text shadow-xs',
          'hover:border-components-button-secondary-border-hover hover:bg-components-button-secondary-bg-hover',
          'aria-expanded:bg-components-button-secondary-bg-hover',
          'disabled:bg-components-button-secondary-bg-disabled disabled:text-components-button-secondary-text-disabled',
        ),
        destructive: cn(
          'border-components-button-destructive-secondary-border bg-components-button-destructive-secondary-bg text-components-button-destructive-secondary-text shadow-xs',
          'hover:border-components-button-destructive-secondary-border-hover hover:bg-components-button-destructive-secondary-bg-hover',
          'disabled:bg-components-button-destructive-secondary-bg-disabled disabled:text-components-button-destructive-secondary-text-disabled',
        ),
      },
      size: {
        // Dify medium: h-8 / px-3.5 / rounded-lg / 13px / font-medium
        default:
          'h-8 gap-1.5 rounded-lg px-3.5 text-base in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5',
        // Dify small: h-6 / px-2 / rounded-md / 12px (project text-xs is 11px; keep current xs token)
        xs: "h-6 gap-1 rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        // sm is a legacy alias merged into Dify medium so call-sites stay valid.
        sm: 'h-8 gap-1.5 rounded-lg px-3.5 text-base in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5',
        // Dify large: h-9 / px-4 / rounded-[10px] / 14px / font-semibold
        lg: 'h-9 gap-1.5 rounded-[10px] px-4 text-md font-semibold has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        icon: 'size-8 rounded-lg in-data-[slot=button-group]:rounded-lg',
        'icon-xs':
          "size-6 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-7 rounded-md in-data-[slot=button-group]:rounded-md',
        'icon-lg': 'size-10 rounded-[10px] in-data-[slot=button-group]:rounded-[10px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
