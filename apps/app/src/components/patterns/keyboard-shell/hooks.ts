import { useContext } from 'react'
import {
  useHotkey,
  useHotkeySequence,
  type HotkeySequence,
  type RegisterableHotkey,
  type UseHotkeyOptions,
  type UseHotkeySequenceOptions,
} from '@tanstack/react-hotkeys'

import type { AppHotkeyMeta } from './types'
import { KeyboardShellContext } from './state'

type AppHotkeyOptions = Omit<UseHotkeyOptions, 'meta'> & {
  meta?: UseHotkeyOptions['meta'] & AppHotkeyMeta
}
type AppHotkeySequenceOptions = Omit<UseHotkeySequenceOptions, 'meta'> & {
  meta?: UseHotkeySequenceOptions['meta'] & AppHotkeyMeta
}

export function useKeyboardShell() {
  const ctx = useContext(KeyboardShellContext)
  if (!ctx) {
    throw new Error('useKeyboardShell must be used within KeyboardProvider')
  }
  return ctx
}

export function useKeyboardShortcutsBlocked(): boolean {
  return useKeyboardShell().shortcutsBlocked
}

export function useAppHotkey(
  hotkey: RegisterableHotkey,
  callback: UseHotkeyCallback,
  options: AppHotkeyOptions = {},
): void {
  useHotkey(hotkey, callback, options)
}

export function useAppHotkeySequence(
  sequence: HotkeySequence,
  callback: UseHotkeyCallback,
  options: AppHotkeySequenceOptions = {},
): void {
  useHotkeySequence(sequence, callback, options)
}

type UseHotkeyCallback = Parameters<typeof useHotkey>[1]
