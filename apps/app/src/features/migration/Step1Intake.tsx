import { useEffect, useId, useMemo, useRef, type ChangeEvent, type DragEvent } from 'react'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { LockIcon, UploadCloudIcon } from 'lucide-react'

import { parseTabular, TabularParseError } from '@duedatehq/core/csv-parser'
import { detectSsnColumns } from '@duedatehq/core/pii'
import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Textarea } from '@duedatehq/ui/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@duedatehq/ui/components/ui/tooltip'
import { cn } from '@duedatehq/ui/lib/utils'

import { PRESET_IDS, type IntakeState, type PresetId } from './state'

const MAX_FILE_BYTES = 2 * 1024 * 1024

const PRESET_LABELS: Record<PresetId, string> = {
  taxdome: 'TaxDome',
  drake: 'Drake',
  karbon: 'Karbon',
  quickbooks: 'QuickBooks',
  file_in_time: 'File In Time',
}

function handleDragOver(event: DragEvent<HTMLDivElement>) {
  event.preventDefault()
}

interface Step1Props {
  intake: IntakeState
  onText: (text: string, fileName: string | null) => void
  onPreset: (preset: PresetId | null) => void
  onParsed: (args: {
    rowCount: number
    truncated: boolean
    ssnBlockedColumnIndexes: number[]
  }) => void
  onParseError: (error: string | null) => void
}

/**
 * Step 1 Intake — Paste / Upload / Preset chips + SSN block + bad row banner.
 * Authority: docs/product-design/migration-copilot/02-ux-4step-wizard.md §4.
 */
export function Step1Intake({ intake, onText, onPreset, onParsed, onParseError }: Step1Props) {
  const { t } = useLingui()
  const pasteId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse on every text change so the SSN banner + row count update live.
  useEffect(() => {
    if (!intake.rawText.trim()) {
      onParsed({ rowCount: 0, truncated: false, ssnBlockedColumnIndexes: [] })
      onParseError(null)
      return
    }
    try {
      const parsed = parseTabular(intake.rawText, { kind: 'paste' })
      const ssn = detectSsnColumns(parsed.headers, parsed.rows)
      onParsed({
        rowCount: parsed.rowCount,
        truncated: parsed.truncated,
        ssnBlockedColumnIndexes: ssn.blockedColumnIndexes,
      })
      onParseError(null)
    } catch (err) {
      const message =
        err instanceof TabularParseError
          ? friendlyParseError(err)
          : t`We couldn't read that file. Try exporting as CSV.`
      onParseError(message)
      onParsed({ rowCount: 0, truncated: false, ssnBlockedColumnIndexes: [] })
    }
    // We intentionally exclude callbacks — they are stable from the parent
    // reducer dispatchers, and re-running on every render would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intake.rawText])

  const ssnBlockedHeaders = useMemo(() => {
    if (intake.ssnBlockedColumnIndexes.length === 0) return [] as string[]
    try {
      const parsed = parseTabular(intake.rawText, { kind: 'paste' })
      return intake.ssnBlockedColumnIndexes
        .map((i) => parsed.headers[i] ?? '')
        .filter((label) => label.length > 0)
    } catch {
      return []
    }
  }, [intake.ssnBlockedColumnIndexes, intake.rawText])

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }

  function handleFilePicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) loadFile(file)
    event.target.value = ''
  }

  function loadFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      onParseError(t`File is larger than 2 MB. Please trim or split the export.`)
      return
    }
    if (file.name.toLowerCase().endsWith('.xlsx')) {
      onParseError(t`XLSX uploads land in Phase 0 — please export as CSV for now.`)
      return
    }
    void file.text().then((text) => {
      onText(text, file.name)
    })
  }

  return (
    <div className="flex flex-col gap-5 py-5" id="wizard-step1-body">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-text-primary">
          <Trans>Where is your data coming from?</Trans>
        </h2>
        <p className="text-sm text-text-secondary">
          <Trans>We&apos;ll figure out the shape — paste or upload, your call.</Trans>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={pasteId} className="text-xs font-medium text-text-muted uppercase">
          <Trans>Paste rows</Trans>
        </label>
        <Textarea
          id={pasteId}
          aria-label={t`Paste client data`}
          aria-describedby="paste-hint"
          value={intake.rawText}
          onChange={(e) => onText(e.target.value, null)}
          placeholder={t`Paste here — any shape, we'll figure it out. Include the header row if you have one.`}
          className="h-[240px] resize-y rounded-md border border-border-default bg-bg-elevated p-3 font-mono text-xs tabular-nums"
        />
      </div>

      <div className="flex items-center gap-3">
        <span aria-hidden className="h-px flex-1 bg-border-default" />
        <span className="text-xs font-medium text-text-muted uppercase">
          <Trans>or</Trans>
        </span>
        <span aria-hidden className="h-px flex-1 bg-border-default" />
      </div>

      <div
        role="button"
        tabIndex={0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        className="flex h-[120px] cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border-strong bg-bg-subtle text-sm text-text-secondary transition-colors hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <UploadCloudIcon className="size-5 text-text-muted" aria-hidden />
        <span>
          <Trans>Drop CSV / TSV here or click to choose · max 1000 rows · 2 MB</Trans>
        </span>
        {intake.fileName ? (
          <span className="font-mono text-xs text-text-secondary tabular-nums">
            {intake.fileName}
          </span>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          className="hidden"
          onChange={handleFilePicked}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-text-muted uppercase">
          <Trans>I&apos;m coming from… (optional)</Trans>
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_IDS.map((id) => (
            <PresetChip
              key={id}
              id={id}
              label={PRESET_LABELS[id]}
              selected={intake.preset === id}
              onToggle={() => onPreset(intake.preset === id ? null : id)}
            />
          ))}
        </div>
      </div>

      <p id="paste-hint" className="flex items-center gap-1.5 text-xs text-text-muted">
        <LockIcon className="size-3" aria-hidden />
        <Trans>We block SSN-like patterns before sending anything to the AI.</Trans>
      </p>

      {intake.ssnBlockedColumnIndexes.length > 0 ? (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTitle>
            <Trans>SSN-like columns blocked</Trans>
          </AlertTitle>
          <AlertDescription>
            <Trans>
              We blocked SSN-like patterns to protect your clients. Those columns won&apos;t be sent
              to the AI. Columns flagged: {ssnBlockedHeaders.join(', ')} → forced IGNORE.
            </Trans>
          </AlertDescription>
        </Alert>
      ) : null}

      {intake.truncated ? (
        <Alert role="status" aria-live="polite">
          <AlertTitle>
            <Trans>Row limit hit</Trans>
          </AlertTitle>
          <AlertDescription>
            <Plural
              value={intake.rowCount}
              one="We imported the first 1000 of # row. Split your file to import more."
              other="We imported the first 1000 of # rows. Split your file to import more."
            />
          </AlertDescription>
        </Alert>
      ) : null}

      {intake.parseError ? (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTitle>
            <Trans>Couldn&apos;t parse the input</Trans>
          </AlertTitle>
          <AlertDescription>{intake.parseError}</AlertDescription>
        </Alert>
      ) : null}

      {intake.submitError ? (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTitle>
            <Trans>Couldn&apos;t start the import</Trans>
          </AlertTitle>
          <AlertDescription>{intake.submitError}</AlertDescription>
        </Alert>
      ) : null}

      {intake.rowCount > 0 && intake.parseError === null ? (
        <p className="text-sm text-status-done">
          <Plural
            value={intake.rowCount}
            one="# row ready to import"
            other="# rows ready to import"
          />
        </p>
      ) : null}
    </div>
  )
}

interface PresetChipProps {
  id: PresetId
  label: string
  selected: boolean
  onToggle: () => void
}

function PresetChip({ id, label, selected, onToggle }: PresetChipProps) {
  const chip = (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        'inline-flex h-6 cursor-pointer items-center rounded-md border px-2.5 text-xs font-medium transition-colors',
        selected
          ? 'border-accent-default bg-accent-tint text-accent-default'
          : 'border-border-default bg-bg-canvas text-text-secondary hover:border-accent-default hover:text-accent-default',
      )}
    >
      {label}
    </button>
  )
  if (id === 'file_in_time') {
    return (
      <Tooltip>
        <TooltipTrigger render={chip} />
        <TooltipContent className="max-w-[240px]">
          <Trans>
            Coming from File In Time? We&apos;ll migrate your full-year calendar in one shot.
          </Trans>
        </TooltipContent>
      </Tooltip>
    )
  }
  return chip
}

function friendlyParseError(error: TabularParseError): string {
  switch (error.code) {
    case 'empty_input':
      return 'Paste or upload to continue.'
    case 'no_data_rows':
      return "We couldn't find a header row. Make sure the first line lists your column names."
    case 'xlsx_not_supported':
      return 'XLSX is not yet supported. Export as CSV and re-upload.'
    default:
      return "We couldn't read that file. Try exporting as CSV."
  }
}
