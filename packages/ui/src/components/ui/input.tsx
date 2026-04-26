import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '@duedatehq/ui/lib/utils'

/**
 * Base input. Visual baseline matches Dify's "regular" (h-8, rounded-lg),
 * with bg/border state layers driven by --color-components-input-* tokens.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'flex h-8 w-full min-w-0 items-center rounded-lg border border-transparent bg-components-input-bg-normal px-3 py-1 text-sm text-components-input-text-filled outline-none transition-colors',
        'placeholder:text-components-input-text-placeholder',
        'hover:bg-components-input-bg-hover',
        'focus-visible:border-components-input-border-active focus-visible:bg-components-input-bg-active focus-visible:ring-2 focus-visible:ring-state-accent-active-alt',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-components-input-bg-disabled disabled:text-components-input-text-filled-disabled',
        'aria-invalid:border-components-input-border-destructive aria-invalid:bg-components-input-bg-destructive aria-invalid:ring-2 aria-invalid:ring-state-destructive-active',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
