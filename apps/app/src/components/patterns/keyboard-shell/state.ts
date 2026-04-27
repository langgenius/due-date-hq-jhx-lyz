import { createContext } from 'react'

export interface KeyboardShellContextValue {
  commandPaletteOpen: boolean
  shortcutHelpOpen: boolean
  shortcutsBlocked: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  openShortcutHelp: () => void
  closeShortcutHelp: () => void
}

export const KeyboardShellContext = createContext<KeyboardShellContextValue | null>(null)
