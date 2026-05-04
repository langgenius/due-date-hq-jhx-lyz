import type { MigrationIntegrationProvider } from '@duedatehq/contracts'

export type ProviderCapabilityTier =
  | 'supported_export_preset'
  | 'supported_integration_handoff'
  | 'partner_manual_only'

export interface ProviderCapability {
  provider: MigrationIntegrationProvider
  label: string
  tier: ProviderCapabilityTier
  helper: string
  recommended: boolean
}

const KARBON_CAPABILITY = {
  provider: 'karbon',
  label: 'Karbon API / export',
  tier: 'supported_integration_handoff',
  helper: 'Use Karbon API payloads or exported contacts/work items when available.',
  recommended: true,
} satisfies ProviderCapability

const TAXDOME_CAPABILITY = {
  provider: 'taxdome',
  label: 'TaxDome Zapier payload',
  tier: 'supported_integration_handoff',
  helper: 'Use Zapier account/contact payloads, or choose the TaxDome preset for CSV exports.',
  recommended: true,
} satisfies ProviderCapability

const PROCONNECT_CAPABILITY = {
  provider: 'proconnect',
  label: 'ProConnect export handoff',
  tier: 'supported_export_preset',
  helper: 'Use JSON records prepared from Intuit reporting exports for e-filed return data.',
  recommended: true,
} satisfies ProviderCapability

const SAFESEND_CAPABILITY = {
  provider: 'safesend',
  label: 'SafeSend report handoff',
  tier: 'supported_export_preset',
  helper: 'Use JSON records prepared from Returns, Organizers, or Reminder Management reports.',
  recommended: false,
} satisfies ProviderCapability

const SORABAN_CAPABILITY = {
  provider: 'soraban',
  label: 'Soraban via Karbon/Zapier or uploaded export',
  tier: 'partner_manual_only',
  helper: 'Use only customer-provided exports or records routed through Karbon/Zapier.',
  recommended: false,
} satisfies ProviderCapability

export const PROVIDER_CAPABILITIES = [
  KARBON_CAPABILITY,
  TAXDOME_CAPABILITY,
  PROCONNECT_CAPABILITY,
  SAFESEND_CAPABILITY,
  SORABAN_CAPABILITY,
] satisfies ReadonlyArray<ProviderCapability>

export const PROVIDER_CAPABILITY_BY_PROVIDER: Record<
  MigrationIntegrationProvider,
  ProviderCapability
> = {
  karbon: KARBON_CAPABILITY,
  taxdome: TAXDOME_CAPABILITY,
  proconnect: PROCONNECT_CAPABILITY,
  safesend: SAFESEND_CAPABILITY,
  soraban: SORABAN_CAPABILITY,
}

export const PROVIDER_CAPABILITY_TIER_LABELS: Record<ProviderCapabilityTier, string> = {
  supported_export_preset: 'Report/export handoff',
  supported_integration_handoff: 'API/Zapier handoff',
  partner_manual_only: 'Partner/manual handoff',
}
