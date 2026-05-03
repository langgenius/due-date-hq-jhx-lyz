import { useState, type ReactNode } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, LoaderCircleIcon, XIcon } from 'lucide-react'

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
import { ConceptLabel } from '@/features/concepts/concept-help'

import { Stepper } from './Stepper'
import type { StepIndex } from './state'

export type WizardTransitionPhase = 'intake' | 'mapping' | 'rerun_mapper' | 'normalize' | 'import'

export interface WizardTransitionState {
  phase: WizardTransitionPhase
  activeIndex: number
}

interface WizardShellProps {
  /** Controlled visibility — provider toggles this in response to user intent. */
  open: boolean
  step: StepIndex
  /** Disables the [Continue →] button and locks the body while work is pending. */
  busy: boolean
  transition?: WizardTransitionState | null | undefined
  /** Whether the current step considers itself ready to advance. */
  canContinue: boolean
  /** Lingui-aware label for Step 4 swaps the primary CTA. */
  continueLabel?: ReactNode | undefined
  onBack?: (() => void) | undefined
  onContinue: () => void
  onClose: () => void
  /** When true, close attempts ask before discarding current wizard work. */
  confirmOnClose: boolean
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
 * Esc / overlay click bounces through a discard confirmation once the wizard
 * has discardable work, so accidental dismissals don't silently drop the user's
 * paste or unsaved edits.
 */
export function WizardShell({
  open,
  step,
  busy,
  transition,
  canContinue,
  continueLabel,
  onBack,
  onContinue,
  onClose,
  confirmOnClose,
  backDisabled,
  children,
}: WizardShellProps) {
  const { t } = useLingui()
  const [confirming, setConfirming] = useState(false)

  function requestClose() {
    if (busy) return
    if (confirmOnClose) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    onClose()
  }

  function handleOpenChange(next: boolean) {
    if (next) return
    requestClose()
  }

  function handleDiscard() {
    setConfirming(false)
    onClose()
  }

  useAppHotkey('Escape', requestClose, {
    enabled: open && !confirming && !busy,
    requireReset: true,
    meta: {
      id: 'wizard.escape',
      name: 'Close wizard',
      description: 'Close the wizard or open the discard import confirmation.',
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
        <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-divider-subtle px-3">
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
                <ConceptLabel concept="migrationCopilot">
                  <Trans>Import</Trans>
                </ConceptLabel>
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
              onClick={requestClose}
            >
              <XIcon />
            </Button>
          </div>
        </header>

        <Stepper current={step} />

        {transition ? (
          <div className="relative min-h-[300px] flex-1" aria-busy={busy || undefined}>
            <ProcessingOverlay transition={transition} />
          </div>
        ) : (
          <div
            className="relative min-h-0 flex-1 overflow-y-auto px-6"
            aria-busy={busy || undefined}
          >
            {children}
          </div>
        )}

        <footer className="flex h-12 shrink-0 items-center justify-end gap-4 border-divider-subtle px-4">
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

function ProcessingOverlay({ transition }: { transition: WizardTransitionState }) {
  const copy = transitionCopy(transition.phase)
  const activeIndex = Math.min(Math.max(transition.activeIndex, 0), copy.steps.length - 1)
  const progressValue = Math.round((activeIndex / copy.steps.length) * 100)

  return (
    <div className="absolute inset-0 overflow-y-auto bg-components-panel-bg/85">
      <div className="grid min-h-full place-items-center px-6 py-6">
        <section
          role="status"
          aria-live="polite"
          className="w-full max-w-[520px] rounded-lg border border-state-accent-active bg-background-body p-4 shadow-overlay"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-state-accent-hover-alt text-text-accent">
              <LoaderCircleIcon className="size-5 animate-spin" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-md font-semibold text-text-primary">{copy.title}</h3>
              <p className="mt-1 text-sm text-text-secondary">{copy.description}</p>
            </div>
          </div>

          <div
            className="mt-4 h-1 overflow-hidden rounded-full bg-state-accent-hover-alt"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressValue}
          >
            <div
              className="h-full rounded-full bg-state-accent-solid transition-[width] duration-500 ease-out"
              style={{ width: `${progressValue}%` }}
            />
          </div>

          <ol className="mt-4 grid gap-2">
            {copy.steps.map((step, index) => {
              const complete = index < activeIndex
              const active = index === activeIndex
              return (
                <li
                  key={step.key}
                  className={cn(
                    'flex min-h-8 items-center gap-2 rounded-md border px-2.5 text-sm transition-colors',
                    active
                      ? 'border-state-accent-active bg-state-accent-hover text-text-primary'
                      : complete
                        ? 'border-divider-regular bg-background-body text-text-secondary'
                        : 'border-divider-subtle bg-background-default-subtle text-text-tertiary',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-sm border',
                      active
                        ? 'border-state-accent-solid bg-state-accent-solid text-text-primary-on-surface'
                        : complete
                          ? 'border-state-success-solid bg-state-success-hover text-text-success'
                          : 'border-divider-regular bg-background-body text-text-muted',
                    )}
                  >
                    {complete ? (
                      <CheckIcon className="size-3.5" aria-hidden />
                    ) : active ? (
                      <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" aria-hidden />
                    )}
                  </span>
                  <span className="truncate">{step.label}</span>
                </li>
              )
            })}
          </ol>
        </section>
      </div>
    </div>
  )
}

interface TransitionStep {
  key: string
  label: ReactNode
}

function transitionCopy(phase: WizardTransitionPhase): {
  title: ReactNode
  description: ReactNode
  steps: TransitionStep[]
} {
  switch (phase) {
    case 'intake':
      return {
        title: <Trans>Preparing your mapping</Trans>,
        description: (
          <Trans>Creating a safe import batch, uploading rows, and mapping your columns.</Trans>
        ),
        steps: [
          { key: 'create-batch', label: <Trans>Create batch</Trans> },
          { key: 'upload-rows', label: <Trans>Upload rows</Trans> },
          { key: 'map-columns', label: <Trans>Map columns</Trans> },
        ],
      }
    case 'mapping':
      return {
        title: <Trans>Preparing normalization</Trans>,
        description: <Trans>Saving your confirmed fields and grouping values for review.</Trans>,
        steps: [
          { key: 'save-mapping', label: <Trans>Save mapping</Trans> },
          { key: 'read-field-values', label: <Trans>Read field values</Trans> },
          { key: 'suggest-clean-values', label: <Trans>Suggest clean values</Trans> },
        ],
      }
    case 'rerun_mapper':
      return {
        title: <Trans>Refreshing the AI mapping</Trans>,
        description: <Trans>Re-reading your columns with the latest overrides applied.</Trans>,
        steps: [
          { key: 'read-columns', label: <Trans>Read columns</Trans> },
          { key: 'remap-fields', label: <Trans>Re-map fields</Trans> },
          { key: 'refresh-confidence', label: <Trans>Refresh confidence</Trans> },
        ],
      }
    case 'normalize':
      return {
        title: <Trans>Building the import preview</Trans>,
        description: (
          <Trans>
            Saving normalized values, applying the Default Matrix, and calculating totals.
          </Trans>
        ),
        steps: [
          { key: 'save-normalized-values', label: <Trans>Save normalized values</Trans> },
          { key: 'apply-default-matrix', label: <Trans>Apply Default Matrix</Trans> },
          { key: 'calculate-preview', label: <Trans>Calculate preview</Trans> },
        ],
      }
    case 'import':
      return {
        title: <Trans>Generating your deadline queue</Trans>,
        description: <Trans>Creating clients, deadlines, evidence links, and audit records.</Trans>,
        steps: [
          { key: 'create-clients', label: <Trans>Create clients</Trans> },
          { key: 'generate-deadlines', label: <Trans>Generate deadlines</Trans> },
          { key: 'record-audit-trail', label: <Trans>Record audit trail</Trans> },
        ],
      }
  }
  const exhaustive: never = phase
  return exhaustive
}
