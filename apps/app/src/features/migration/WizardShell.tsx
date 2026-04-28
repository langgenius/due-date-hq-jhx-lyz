import { useState, type ReactNode } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from 'lucide-react'

import { Button } from '@duedatehq/ui/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@duedatehq/ui/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@duedatehq/ui/components/ui/dialog'
import { cn } from '@duedatehq/ui/lib/utils'

import { useAppHotkey, isEditableEventTarget } from '@/components/patterns/keyboard-shell'

import { Stepper } from './Stepper'
import type { StepIndex } from './state'

interface WizardShellProps {
  /** Controlled visibility — provider toggles this in response to user intent. */
  open: boolean
  step: StepIndex
  /** Disables the [Continue →] button and shows a spinner inside it. */
  busy: boolean
  /** Whether the current step considers itself ready to advance. */
  canContinue: boolean
  /** Lingui-aware label for Step 4 swaps the primary CTA. */
  continueLabel?: ReactNode | undefined
  onBack?: (() => void) | undefined
  onContinue: () => void
  onClose: () => void
  /** When true, [Back] is disabled (Step 1). */
  backDisabled?: boolean | undefined
  children: ReactNode
}

/**
 * Wizard outer chrome — workbench-style modal with traffic-light dots,
 * mono breadcrumb, hairline Stepper, and keyboard-hint footer.
 *
 * Visual authority: DESIGN.md §Layout/Components + apps/marketing HeroSurface.
 * Behavior authority: docs/product-design/migration-copilot/02-ux-4step-wizard.md §2.
 *
 * Esc / overlay click bounces through a discard confirmation so accidental
 * dismissals don't silently drop the user's paste or unsaved edits.
 */
export function WizardShell({
  open,
  step,
  busy,
  canContinue,
  continueLabel,
  onBack,
  onContinue,
  onClose,
  backDisabled,
  children,
}: WizardShellProps) {
  const { t } = useLingui()
  const [confirming, setConfirming] = useState(false)

  function handleOpenChange(next: boolean) {
    if (next) return
    if (busy) return
    setConfirming(true)
  }

  function handleDiscard() {
    setConfirming(false)
    onClose()
  }

  useAppHotkey('Escape', () => setConfirming(true), {
    enabled: open && !confirming && !busy,
    requireReset: true,
    meta: {
      id: 'wizard.escape',
      name: 'Close wizard',
      description: 'Open the discard import confirmation.',
      category: 'wizard',
      scope: 'overlay',
    },
  })

  useAppHotkey(
    'Enter',
    (event) => {
      if (isEditableEventTarget(event.target)) return
      onContinue()
    },
    {
      enabled: open && !confirming && canContinue && !busy,
      requireReset: true,
      ignoreInputs: false,
      meta: {
        id: 'wizard.continue',
        name: 'Continue wizard',
        description: 'Advance the current migration step.',
        category: 'wizard',
        scope: 'overlay',
      },
    },
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex max-h-[calc(100vh-4rem)] w-[960px] max-w-[calc(100%-3rem)] flex-col gap-0 overflow-hidden rounded-xl border border-divider-regular bg-components-panel-bg p-3 shadow-overlay sm:max-w-[calc(100%-3rem)]',
        )}
      >
        <DialogTitle className="sr-only">
          <Trans>Import clients · Step {step} of 4</Trans>
        </DialogTitle>
        <DialogDescription className="sr-only">
          <Trans>
            Migration Copilot wizard — paste or upload your client roster, review the AI mapping,
            normalize values, and preview the import before committing.
          </Trans>
        </DialogDescription>

        {/* Window chrome — mirrors HeroSurface traffic-light + mono breadcrumb. */}
        <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-divider-subtle bg-background-body px-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-sm text-text-tertiary">
              <span
                className="block size-2.5 rounded-sm bg-components-badge-status-light-success-bg"
                aria-hidden
              />
              <span>
                <Trans>Workbench</Trans>
              </span>
              <span aria-hidden>/</span>
              <span>
                <Trans>Import</Trans>
              </span>
              <span aria-hidden>/</span>
              <span className="text-text-secondary">
                <Trans>Step {step} / 4</Trans>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 font-mono text-xs text-text-tertiary sm:inline-flex">
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-divider-regular bg-components-panel-bg px-1.5 text-xs text-text-primary">
                Esc
              </kbd>
              <span className="text-text-tertiary">
                {busy ? <Trans>Working…</Trans> : <Trans>Close</Trans>}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t`Close wizard`}
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              <XIcon />
            </Button>
          </div>
        </header>

        <Stepper current={step} />

        <div className="min-h-0 flex-1 overflow-y-auto px-6">{children}</div>

        <footer className="flex h-12 shrink-0 items-center justify-end gap-4 border-divider-subtle bg-background-body px-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={busy || backDisabled || step === 1 || !onBack}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            <Trans>Back</Trans>
          </Button>
          <Button
            size="lg"
            onClick={onContinue}
            disabled={busy || !canContinue}
            aria-busy={busy || undefined}
          >
            {busy ? (
              step === 4 ? (
                <Trans>Importing…</Trans>
              ) : (
                <Trans>Working…</Trans>
              )
            ) : (
              (continueLabel ?? <Trans>Continue</Trans>)
            )}
            {busy ? null : <ArrowRightIcon data-icon="inline-end" />}
          </Button>
        </footer>
      </DialogContent>

      {confirming ? (
        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                <Trans>Discard import?</Trans>
              </AlertDialogTitle>
              <AlertDialogDescription className="text-md">
                <Trans>Your pasted data and unsaved edits in this wizard will be lost.</Trans>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel size="sm">
                <Trans>Keep editing</Trans>
              </AlertDialogCancel>
              <AlertDialogAction variant="destructive-primary" size="sm" onClick={handleDiscard}>
                <Trans>Discard import</Trans>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </Dialog>
  )
}
