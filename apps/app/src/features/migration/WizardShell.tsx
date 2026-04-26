import { useState, type ReactNode } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from 'lucide-react'

import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@duedatehq/ui/components/ui/dialog'
import { cn } from '@duedatehq/ui/lib/utils'

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
 * Esc / overlay click bounces through a "leave & save draft" confirmation so
 * accidental dismissals don't blow away the user's paste.
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
    setConfirming(true)
  }

  function handleLeave() {
    setConfirming(false)
    onClose()
  }

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
                <Trans>Save draft</Trans>
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t`Close wizard`}
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
            {continueLabel ?? <Trans>Continue</Trans>}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </footer>
      </DialogContent>

      {confirming ? (
        <Dialog open={confirming} onOpenChange={setConfirming}>
          <DialogContent
            showCloseButton={false}
            role="alertdialog"
            className="w-[min(480px,calc(100%-2rem))] rounded-xl border border-divider-regular bg-components-panel-bg shadow-overlay"
          >
            <DialogTitle>
              <Trans>Leave wizard?</Trans>
            </DialogTitle>
            <DialogDescription className="text-md">
              <Trans>Your draft is saved — you can resume from Settings › Imports history.</Trans>
            </DialogDescription>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline" size="sm" onClick={() => setConfirming(false)} />}
              >
                <Trans>Keep editing</Trans>
              </DialogClose>
              <Button size="sm" onClick={handleLeave}>
                <Trans>Leave & save draft</Trans>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </Dialog>
  )
}
