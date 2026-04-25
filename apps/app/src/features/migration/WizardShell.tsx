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
 * Wizard outer chrome — full-screen modal + Stepper + sticky footer.
 *
 * Authority: docs/product-design/migration-copilot/02-ux-4step-wizard.md §2.
 *
 * Focus trap is handled by Base-UI Dialog; we lock the close to a
 * confirmation modal so accidental Esc does not blow away the draft.
 */
export function WizardShell({
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

  return (
    <Dialog open onOpenChange={(open) => !open && setConfirming(true)}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex max-h-[calc(100vh-4rem)] w-[min(960px,calc(100%-3rem))] max-w-none flex-col gap-0 overflow-hidden rounded-lg p-0',
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-default bg-bg-canvas px-5">
          <DialogTitle className="text-base font-medium text-text-primary">
            <Trans>Import clients · Step {step} of 4</Trans>
          </DialogTitle>
          <DialogDescription className="sr-only">
            <Trans>
              Migration Copilot wizard — paste or upload your client roster, review the AI mapping,
              normalize values, and preview the import before committing.
            </Trans>
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t`Close wizard`}
            onClick={() => setConfirming(true)}
          >
            <XIcon />
          </Button>
        </header>
        <Stepper current={step} />
        <div className="min-h-0 flex-1 overflow-y-auto bg-bg-canvas px-5 pb-5">{children}</div>
        <footer className="flex h-14 shrink-0 items-center justify-between border-t border-border-default bg-bg-panel px-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={busy || backDisabled || step === 1 || !onBack}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            <Trans>Back</Trans>
          </Button>
          <Button
            size="sm"
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
            className="w-[min(480px,calc(100%-2rem))]"
          >
            <DialogTitle>
              <Trans>Leave wizard?</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>Your draft is saved — you can resume from Settings › Imports history.</Trans>
            </DialogDescription>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline" size="sm" onClick={() => setConfirming(false)} />}
              >
                <Trans>Keep editing</Trans>
              </DialogClose>
              <Button size="sm" onClick={onClose}>
                <Trans>Leave & save draft</Trans>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </Dialog>
  )
}
