import { act, type SyntheticEvent } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { activateLocale } from '@/i18n/i18n'
import { AppI18nProvider } from '@/i18n/provider'
import {
  TwoFactorSetupPanel,
  type PendingTwoFactorSetup,
} from './account-security-two-factor-setup'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

const pendingSetup: PendingTwoFactorSetup = {
  totpURI: 'otpauth://totp/DueDateHQ:test@example.com?secret=ABC123&issuer=DueDateHQ',
  backupCodes: ['code-1', 'code-2'],
}

function renderSetup(
  input: {
    code?: string
    verifyPending?: boolean
    onCodeChange?: (code: string) => void
    onCopyBackupCodes?: () => void
    onCopySetupUri?: () => void
    onVerify?: (event: SyntheticEvent<HTMLFormElement>) => void
  } = {},
) {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)

  act(() => {
    root?.render(
      <AppI18nProvider>
        <TwoFactorSetupPanel
          code={input.code ?? ''}
          pendingSetup={pendingSetup}
          verifyPending={input.verifyPending ?? false}
          onCodeChange={input.onCodeChange ?? vi.fn()}
          onCopyBackupCodes={input.onCopyBackupCodes ?? vi.fn()}
          onCopySetupUri={input.onCopySetupUri ?? vi.fn()}
          onVerify={input.onVerify ?? vi.fn()}
        />
      </AppI18nProvider>,
    )
  })
}

describe('TwoFactorSetupPanel', () => {
  beforeEach(() => {
    activateLocale('en')
  })

  afterEach(() => {
    if (root) act(() => root?.unmount())
    container?.remove()
    document.body.replaceChildren()
    root = null
    container = null
  })

  it('renders a QR code, setup URI fallback, recovery codes, and gated verification', () => {
    renderSetup()

    expect(document.querySelector('svg title')?.textContent).toBe('Authenticator setup QR code')
    expect(document.querySelector<HTMLInputElement>('#totp-uri')?.value).toBe(pendingSetup.totpURI)
    expect(document.body.textContent).toContain('Save these recovery codes now')
    expect(document.body.textContent).toContain('code-1')
    expect(document.body.textContent).toContain('code-2')
    expect(document.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true)
  })

  it('submits verification only after a code is present', () => {
    const onVerify = vi.fn((event: SyntheticEvent<HTMLFormElement>) => event.preventDefault())
    renderSetup({ code: '123456', onVerify })

    const form = document.querySelector('form')
    expect(form).toBeInstanceOf(HTMLFormElement)

    act(() => {
      form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }))
    })

    expect(onVerify).toHaveBeenCalledTimes(1)
  })

  it('exposes separate copy actions for URI and recovery codes', () => {
    const onCopySetupUri = vi.fn()
    const onCopyBackupCodes = vi.fn()
    renderSetup({ onCopySetupUri, onCopyBackupCodes })

    const buttons = Array.from(document.querySelectorAll('button'))
    const copyUri = buttons.find((button) => button.textContent?.includes('Copy URI'))
    const copyCodes = buttons.find((button) => button.textContent === 'Copy')

    act(() => {
      copyUri?.click()
      copyCodes?.click()
    })

    expect(onCopySetupUri).toHaveBeenCalledTimes(1)
    expect(onCopyBackupCodes).toHaveBeenCalledTimes(1)
  })
})
