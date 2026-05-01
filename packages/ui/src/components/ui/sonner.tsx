'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react'

/**
 * Toast surface — uses `--components-panel-bg-blur` so it picks up the right
 * blur/shadow in both light and dark modes (instead of the bare `--popover`
 * alias that doesn't carry blur).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      richColors
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--components-panel-bg-blur)',
          '--normal-text': 'var(--text-primary)',
          '--normal-border': 'var(--components-panel-border)',
          '--border-radius': 'var(--radius-lg)',
          '--success-bg': 'var(--state-success-hover)',
          '--success-text': 'var(--text-success)',
          '--success-border': 'var(--state-success-hover-alt)',
          '--warning-bg': 'var(--state-warning-hover)',
          '--warning-text': 'var(--text-warning)',
          '--warning-border': 'var(--state-warning-hover-alt)',
          '--error-bg': 'var(--state-destructive-hover)',
          '--error-text': 'var(--text-destructive)',
          '--error-border': 'var(--state-destructive-hover-alt)',
          '--info-bg': 'var(--state-accent-hover)',
          '--info-text': 'var(--text-accent)',
          '--info-border': 'var(--state-accent-hover-alt)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
