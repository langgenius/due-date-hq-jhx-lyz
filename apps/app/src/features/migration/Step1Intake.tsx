import { useId, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { LoaderCircleIcon, LockIcon, UploadCloudIcon } from 'lucide-react'
import readXlsxFile, { type SheetData } from 'read-excel-file/browser'

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

function hasDraggedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes('Files')
}

function formatXlsxCell(cell: unknown): string {
  if (cell === null || cell === undefined) return ''
  if (cell instanceof Date) return cell.toISOString()
  if (typeof cell === 'string') return cell
  if (typeof cell === 'number' || typeof cell === 'boolean' || typeof cell === 'bigint') {
    return String(cell)
  }
  if (typeof cell === 'symbol') return cell.description ?? ''
  return JSON.stringify(cell) ?? ''
}

interface Step1Props {
  intake: IntakeState
  onText: (
    text: string,
    fileName: string | null,
    options?: {
      fileKind?: IntakeState['fileKind']
      rawFileBase64?: string | null
      contentType?: string | null
      sizeBytes?: number
    },
  ) => void
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
  const uploadHintId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileDragDepthRef = useRef(0)
  const fileReadSerialRef = useRef(0)
  const [isFileDragActive, setIsFileDragActive] = useState(false)
  const [isReadingFile, setIsReadingFile] = useState(false)

  function resetParsedRows() {
    onParsed({ rowCount: 0, truncated: false, ssnBlockedColumnIndexes: [] })
  }

  function commitText(
    text: string,
    fileName: string | null,
    options: {
      fileKind?: IntakeState['fileKind']
      rawFileBase64?: string | null
      contentType?: string | null
      sizeBytes?: number
    } = {},
  ) {
    onText(text, fileName, options)

    if (!text.trim()) {
      resetParsedRows()
      onParseError(
        fileName
          ? t`That file doesn't contain any rows. Upload a CSV, TSV, or XLSX with a header and at least one data row.`
          : null,
      )
      return
    }

    try {
      const parsed = parseTabular(text, { kind: 'paste' })
      if (parsed.rowCount === 0) {
        resetParsedRows()
        onParseError(
          t`We found a header, but no data rows. Add at least one client row to continue.`,
        )
        return
      }
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
      resetParsedRows()
      onParseError(message)
    }
  }

  function handleTextChange(text: string) {
    fileReadSerialRef.current += 1
    setIsReadingFile(false)
    commitText(text, null, {
      fileKind: 'paste',
      rawFileBase64: null,
      contentType: null,
      sizeBytes: 0,
    })
  }

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

  function resetFileDragState() {
    fileDragDepthRef.current = 0
    setIsFileDragActive(false)
  }

  function handleFileDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return
    event.preventDefault()
    fileDragDepthRef.current += 1
    setIsFileDragActive(true)
  }

  function handleFileDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsFileDragActive(true)
  }

  function handleFileDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    fileDragDepthRef.current = Math.max(0, fileDragDepthRef.current - 1)
    if (fileDragDepthRef.current === 0) setIsFileDragActive(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    resetFileDragState()
    const file = event.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }

  function handleFilePicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) loadFile(file)
    event.target.value = ''
  }

  function loadFile(file: File) {
    const lowerName = file.name.toLowerCase()
    const fileKind: IntakeState['fileKind'] = lowerName.endsWith('.xlsx')
      ? 'xlsx'
      : lowerName.endsWith('.tsv')
        ? 'tsv'
        : 'csv'
    const contentType =
      file.type ||
      (fileKind === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : fileKind === 'tsv'
          ? 'text/tab-separated-values'
          : 'text/csv')
    const readSerial = startFileRead(file, fileKind, contentType)

    if (file.size > MAX_FILE_BYTES) {
      setIsReadingFile(false)
      onParseError(t`File is larger than 2 MB. Please trim or split the export.`)
      return
    }
    if (fileKind === 'xlsx') {
      void loadXlsxFile(file, readSerial, contentType)
      return
    }
    void file
      .text()
      .then((text) => {
        if (!isCurrentFileRead(readSerial)) return
        commitText(text, file.name, {
          fileKind,
          contentType,
          sizeBytes: file.size,
        })
      })
      .catch(() => {
        if (!isCurrentFileRead(readSerial)) return
        resetParsedRows()
        onParseError(t`We couldn't read that file. Try exporting as CSV.`)
      })
      .finally(() => {
        if (isCurrentFileRead(readSerial)) setIsReadingFile(false)
      })
  }

  function startFileRead(
    file: File,
    fileKind: IntakeState['fileKind'],
    contentType: string,
  ): number {
    fileReadSerialRef.current += 1
    setIsReadingFile(true)
    onText('', file.name, {
      fileKind,
      rawFileBase64: null,
      contentType,
      sizeBytes: file.size,
    })
    resetParsedRows()
    onParseError(null)
    return fileReadSerialRef.current
  }

  function isCurrentFileRead(serial: number) {
    return fileReadSerialRef.current === serial
  }

  async function loadXlsxFile(file: File, readSerial: number, contentType: string) {
    try {
      const [sheets, rawFileBase64] = await Promise.all([readXlsxFile(file), fileToBase64(file)])
      if (!isCurrentFileRead(readSerial)) return
      const rows: SheetData = sheets.find((sheet) =>
        sheet.data.some((row) => row.some((cell) => formatXlsxCell(cell).trim() !== '')),
      )?.data ?? [[]]
      const text = rows
        .map((row) =>
          row
            .map((cell) => formatXlsxCell(cell).replaceAll('\t', ' ').replaceAll('\n', ' '))
            .join('\t'),
        )
        .join('\n')
      commitText(text, file.name, {
        fileKind: 'xlsx',
        rawFileBase64,
        contentType,
        sizeBytes: file.size,
      })
    } catch {
      if (!isCurrentFileRead(readSerial)) return
      resetParsedRows()
      onParseError(t`We couldn't read that XLSX file. Try exporting the first sheet as CSV.`)
    } finally {
      if (isCurrentFileRead(readSerial)) setIsReadingFile(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 pt-5 pb-5" id="wizard-step1-body">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-text-primary">
          <Trans>Where is your data coming from?</Trans>
        </h2>
        <p className="text-md text-text-secondary">
          <Trans>We&apos;ll figure out the shape — paste or upload, your call.</Trans>
        </p>
        <p className="text-sm text-text-tertiary">
          <Trans>
            Columns named Estimated tax due, Estimated tax liability, Owner count, or Owners can
            power the penalty exposure preview.
          </Trans>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={pasteId}
          className="font-mono text-xs tracking-[0.16em] text-text-tertiary uppercase"
        >
          <Trans>Paste rows</Trans>
        </label>
        <div className="rounded-lg border border-divider-regular bg-components-panel-bg p-1 shadow-subtle">
          <Textarea
            id={pasteId}
            aria-label={t`Paste client data`}
            aria-describedby="paste-hint"
            value={intake.rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t`Paste here — any shape, we'll figure it out. Include the header row if you have one.`}
            className="h-[200px] resize-y border-0 bg-transparent p-2 font-mono text-base tabular-nums shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span aria-hidden className="h-px flex-1 bg-divider-regular" />
        <span className="font-mono text-xs tracking-[0.16em] text-text-tertiary uppercase">
          <Trans>or</Trans>
        </span>
        <span aria-hidden className="h-px flex-1 bg-divider-regular" />
      </div>

      <div
        role="button"
        tabIndex={0}
        onDrop={handleDrop}
        onDragEnter={handleFileDragEnter}
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onClick={() => fileInputRef.current?.click()}
        aria-describedby={uploadHintId}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        className={cn(
          'flex h-[120px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          isFileDragActive || isReadingFile
            ? 'border-state-accent-solid bg-state-accent-hover-alt text-text-accent'
            : 'border-divider-deep bg-components-panel-bg text-text-secondary hover:border-state-accent-solid hover:bg-state-accent-hover-alt',
        )}
      >
        {isReadingFile ? (
          <LoaderCircleIcon className="size-5 animate-spin text-text-accent" aria-hidden />
        ) : (
          <UploadCloudIcon
            className={cn('size-5', isFileDragActive ? 'text-text-accent' : 'text-text-tertiary')}
            aria-hidden
          />
        )}
        <span id={uploadHintId}>
          <Trans>Drop CSV / TSV / XLSX here or click to choose · max 1000 rows · 2 MB</Trans>
        </span>
        {isReadingFile ? (
          <span role="status" aria-live="polite" className="font-mono text-md text-text-accent">
            <Trans>Reading file…</Trans>
          </span>
        ) : intake.fileName ? (
          <span className="font-mono text-md text-text-secondary tabular-nums">
            {intake.fileName}
          </span>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onClick={(event) => event.stopPropagation()}
          onChange={handleFilePicked}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs tracking-[0.16em] text-text-tertiary uppercase">
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

      <p id="paste-hint" className="flex items-center gap-1.5 text-sm text-text-tertiary">
        <LockIcon className="size-4" aria-hidden />
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
        <p className="text-md text-text-success">
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
        'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-md font-medium transition-colors',
        selected
          ? 'border-state-accent-solid bg-state-accent-hover-alt text-text-accent'
          : 'border-divider-regular bg-background-body text-text-secondary hover:border-state-accent-solid hover:text-text-accent',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'block size-1.5 rounded-full transition-colors',
          selected ? 'bg-state-accent-solid' : 'bg-state-accent-solid/60',
        )}
      />
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
      return 'XLSX could not be parsed. Export as CSV and re-upload.'
    default:
      return "We couldn't read that file. Try exporting as CSV."
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('error', () => reject(reader.error))
    reader.addEventListener('load', () => {
      const value = typeof reader.result === 'string' ? reader.result : ''
      resolve(value.includes(',') ? value.split(',').slice(1).join(',') : value)
    })
    reader.readAsDataURL(file)
  })
}
