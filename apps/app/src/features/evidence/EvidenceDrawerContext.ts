import { createContext, useContext } from 'react'

export interface OpenEvidenceInput {
  obligationId: string
  label: string
  focusEvidenceId?: string | null
}

export interface EvidenceDrawerContextValue {
  openEvidence: (input: OpenEvidenceInput) => void
  closeEvidence: () => void
}

export const EvidenceDrawerContext = createContext<EvidenceDrawerContextValue | null>(null)

export function useEvidenceDrawer(): EvidenceDrawerContextValue {
  const context = useContext(EvidenceDrawerContext)
  if (!context) throw new Error('useEvidenceDrawer must be used within EvidenceDrawerProvider')
  return context
}
