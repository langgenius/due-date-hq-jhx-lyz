// Marketing landing copy contract. Each locale dictionary must satisfy `LandingCopy`
// so pages and section components stay locale-agnostic.

export interface MetaCopy {
  title: string
  description: string
  /** Public path under /og/, e.g. "/og/home.en.png". 1200x630 PNG. */
  ogImage: string
}

export interface NavCopy {
  brand: string
  audience: string
  links: { label: string; href: string }[]
  statusPill: string
  cta: string
}

export interface HeroTrustItem {
  label: string
}

export interface HeroSurfaceRow {
  client: string
  ein: string
  form: string
  due: string
  daysLeft: string
  exposure: string
  evidence: string
  severity: 'critical' | 'high' | 'medium'
}

export interface HeroSurfaceCopy {
  breadcrumb: { workbench: string; dashboard: string; week: string }
  kbdCommand: string
  pulse: {
    tag: string
    text: string
    source: string
    cta: string
  }
  metric: {
    eyebrow: string
    range: string
    value: string
    delta: string
    stats: { label: string; value: string }[]
  }
  table: {
    headers: {
      client: string
      form: string
      due: string
      days: string
      exposure: string
      evidence: string
    }
    rows: HeroSurfaceRow[]
  }
  hints: { keys: string; label: string }[]
  liveLabel: string
}

export interface HeroCopy {
  eyebrow: string
  title: string
  description: string
  primaryCta: string
  secondaryCta: string
  trust: HeroTrustItem[]
  surface: HeroSurfaceCopy
}

export interface SlaItem {
  ruleNumber: string
  ruleLabel: string
  value: string
  unit: string
  description: string
}

export interface SlaStripCopy {
  items: SlaItem[]
}

export interface ProblemRow {
  pill: string
  text: string
  date: string
  /** Optional row tint per DESIGN.md `risk-row-{critical,high,upcoming}` tokens. */
  severity?: 'critical' | 'high' | 'medium'
}

export interface ProblemCard {
  tag: string
  /** Drives the tag pill color tint. critical=red, high=orange, medium=amber. */
  severity: 'critical' | 'high' | 'medium'
  cadence: string
  headline: string
  body: string
  listTitle: string
  listSummary: string
  rows: ProblemRow[]
}

export interface ProblemCopy {
  eyebrow: string
  index: string
  title: string
  paragraph: string
  footnote: string
  cards: ProblemCard[]
}

export interface WorkflowKbd {
  keys: string
  label: string
}

export interface WorkflowDashboardRow {
  client: string
  form: string
  due: string
  daysLeft: string
  exposure: string
  /** Drives row tint, left bar, and days/exposure text color. */
  severity: 'critical' | 'high' | 'medium'
}

export interface WorkflowDashboardCopy {
  kind: 'dashboard'
  header: { title: string; timestamp: string }
  ranges: string[]
  pulse: { tag: string; text: string; cta: string }
  rows: WorkflowDashboardRow[]
}

export interface WorkflowMappingRow {
  source: string
  sample: string
  target: string
  confidenceLabel: string
  confidence: 'HIGH' | 'MED' | 'LOW'
}

export interface WorkflowMappingCopy {
  kind: 'mapping'
  step: string
  steps: { label: string }[]
  headers: { source: string; target: string; sample: string; confidence: string }
  rows: WorkflowMappingRow[]
  footer: { summary: string; cta: string }
}

export interface WorkflowEvidenceField {
  label: string
  value: string
}

export interface WorkflowEvidenceCopy {
  kind: 'evidence'
  drawerTitle: string
  confidence: string
  closeHint: string
  fields: WorkflowEvidenceField[]
  source: { label: string; value: string; verified: string; quoteLabel: string; quote: string }
  meta: { source: string; verifiedBy: string; reviewed: string; status: string }
}

export type WorkflowSurface = WorkflowDashboardCopy | WorkflowMappingCopy | WorkflowEvidenceCopy

export interface WorkflowStepCopy {
  index: string
  tag: string
  headline: string
  body: string
  hints: WorkflowKbd[]
  surface: WorkflowSurface
}

export interface WorkflowCopy {
  eyebrow: string
  index: string
  title: string
  paragraph: string
  steps: WorkflowStepCopy[]
}

export interface ProofStat {
  label: string
  value: string
  unit: string
  body: string
}

export interface ProofCopy {
  eyebrow: string
  index: string
  title: string
  paragraph: string
  footnote: string
  stats: ProofStat[]
}

export interface SecurityItem {
  pill: string
  body: string
}

export interface SecurityCopy {
  title: string
  items: SecurityItem[]
}

export interface FinalCtaCopy {
  pill: string
  pillCaption: string
  title: string
  body: string
  primaryCta: string
  secondaryCta: string
  trust: string
}

export interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}

export interface ThemeSwitcherCopy {
  /** Aria-label for the theme `radiogroup` cluster. */
  label: string
  /** Per-option labels (used as `aria-label` on each icon button). */
  system: string
  light: string
  dark: string
}

export interface LanguageSwitcherCopy {
  /** Aria-label for the language cluster. */
  label: string
  /** Short labels rendered inside the buttons (segmented control). */
  enShort: string
  zhShort: string
  /** Verbose labels used as `aria-label` for screen readers. */
  enLong: string
  zhLong: string
}

export interface FooterCopy {
  brand: string
  tagline: string
  audience: string
  columns: FooterColumn[]
  copyright: string
  theme: ThemeSwitcherCopy
  language: LanguageSwitcherCopy
  status: string
}

export interface LandingCopy {
  meta: MetaCopy
  nav: NavCopy
  hero: HeroCopy
  sla: SlaStripCopy
  problem: ProblemCopy
  workflow: WorkflowCopy
  proof: ProofCopy
  security: SecurityCopy
  finalCta: FinalCtaCopy
  footer: FooterCopy
}
