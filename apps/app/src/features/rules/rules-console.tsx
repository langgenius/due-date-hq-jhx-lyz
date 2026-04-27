import { useMemo, useState } from 'react'
import { useLingui } from '@lingui/react/macro'

import { Tabs, TabsList, TabsTrigger } from '@duedatehq/ui/components/ui/tabs'
import { cn } from '@duedatehq/ui/lib/utils'

import { CoverageTab } from './coverage-tab'
import { GenerationPreviewTab } from './generation-preview-tab'
import { RuleLibraryTab } from './rule-library-tab'
import { RulesPageHeader } from './rules-console-primitives'
import { SourcesTab } from './sources-tab'
import { isRulesTab, RULES_TABS, type RulesTab } from './rules-console-model'

/**
 * Rules Console — 4-tab read-only shell.
 *
 * Layout invariants (Figma 214:2 / 219:2 / 224:2 / 225:2):
 *  - SidebarInset is a 100% wide flex column. The tab nav is full width with
 *    24 px left padding so it visually anchors to the same vertical line as
 *    the sidebar's interior content.
 *  - Page content (header + panel) lives in a centered 880 px column with
 *    24 px outer padding so the math `viewport - sidebar - 880 → / 2` lands
 *    the content at left = 170 px on the 1440 px Figma frame, exactly where
 *    every tab puts the `Rules Console` title and tables.
 *  - The wrapping `<Tabs>` owns the route viewport height. The tab nav is a
 *    non-scrolling top rail; only the content column below it scrolls.
 *  - The wrapping `<Tabs>` defaults to `flex gap-2 data-horizontal:flex-col`
 *    via `@duedatehq/ui`. We override `gap-0` so the tab nav and scroll region
 *    sit flush against the route header rib at y = 56 + 1.
 *  - All user-facing copy is i18n-routed through Lingui (`useLingui` macros);
 *    the underlying `RULES_TABS` table only carries values + counts.
 */

function RulesTabPanel({ activeTab }: { activeTab: RulesTab }) {
  if (activeTab === 'coverage') return <CoverageTab />
  if (activeTab === 'sources') return <SourcesTab />
  if (activeTab === 'library') return <RuleLibraryTab />
  return <GenerationPreviewTab />
}

export function RulesConsole() {
  const { t } = useLingui()
  const [activeTab, setActiveTab] = useState<RulesTab>('coverage')

  const tabLabels = useMemo<Record<RulesTab, string>>(
    () => ({
      coverage: t`Coverage`,
      sources: t`Sources`,
      library: t`Rule Library`,
      preview: t`Generation Preview`,
    }),
    [t],
  )

  const tabDescriptions = useMemo<Record<RulesTab, string>>(
    () => ({
      coverage: t`Sources are the official materials we watch (31). Rules are the structured deadline templates we generate (26 · 25 verified · 1 candidate). Preview shows what rules generate for a given client — reminder-ready obligations come only from verified rules.`,
      sources: t`31 official channels we watch for rule changes — health, cadence, and acquisition method per source. Click any row to open the official page in a new tab. Failing or degraded sources never silently update verified rules; ops review changes via the candidate flow before promotion.`,
      library: t`26 obligation rules — 25 verified, 1 candidate (FED disaster relief watch). Click any row to open rule detail with due-date logic, extension policy, and evidence linked to official sources. Candidate rows never trigger user reminders.`,
      preview: t`Input client facts → dry-run rules engine → see which obligations would be created. Reminder-ready obligations fire 30 / 7 / 1-day reminders; requires-review items surface for CPA confirmation, never auto-reminded.`,
    }),
    [t],
  )

  const description = tabDescriptions[activeTab]

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (isRulesTab(value)) setActiveTab(value)
      }}
      className="flex h-full min-h-0 flex-col gap-0 overflow-hidden"
    >
      {/*
        Tab nav rib + underline accent.

        - cva default `bg-components-segmented-text-active` resolves to the
          dark navy `#101828`. Figma 214:75 / 219:249 explicitly use
          `accent/default = #5b5bd6`, so we override `after:bg-state-accent-solid`
          (which maps to `--color-util-colors-primary-500 = #5b5bd6`).
        - Underline insets are 8 px each side per Figma (`left:8`, `right:8`
          inside an 89.6 px / 105.6 px tab). The cva default is `inset-x-0`
          (full bleed), hence the explicit `after:left-2 after:right-2`
          overrides.
      */}
      <div className="h-10 shrink-0 overflow-x-auto px-6">
        <TabsList variant="line" className="h-10 gap-0 p-0">
          {RULES_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'h-10 flex-none rounded-none px-4 py-0 text-[13px] text-text-muted',
                'data-active:font-semibold data-active:text-text-primary',
                'after:left-2 after:right-2 after:bg-state-accent-solid group-data-horizontal/tabs:after:bottom-0',
              )}
            >
              <span>{tabLabels[tab.value]}</span>
              {tab.count ? (
                <span className="font-mono text-xs tabular-nums text-text-tertiary data-active:text-text-secondary">
                  {tab.count}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-[928px] flex-col gap-6 px-6 py-6">
          <RulesPageHeader description={description} />
          <RulesTabPanel activeTab={activeTab} />
        </div>
      </div>
    </Tabs>
  )
}
