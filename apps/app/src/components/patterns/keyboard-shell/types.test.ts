import { describe, expect, it } from 'vitest'

import { isEditableEventTarget, isInteractiveEventTarget, RESERVED_SHORTCUTS } from './types'

describe('keyboard shell utilities', () => {
  it('treats text controls and contenteditable as editable targets', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const select = document.createElement('select')
    const editable = document.createElement('div')
    editable.contentEditable = 'true'

    expect(isEditableEventTarget(input)).toBe(true)
    expect(isEditableEventTarget(textarea)).toBe(true)
    expect(isEditableEventTarget(select)).toBe(true)
    expect(isEditableEventTarget(editable)).toBe(true)
  })

  it('does not treat button-like controls as editable targets', () => {
    const buttonInput = document.createElement('input')
    buttonInput.type = 'button'
    const button = document.createElement('button')

    expect(isEditableEventTarget(buttonInput)).toBe(false)
    expect(isEditableEventTarget(button)).toBe(false)
  })

  it('treats buttons and menu items as interactive shortcut targets', () => {
    const button = document.createElement('button')
    const item = document.createElement('div')
    item.setAttribute('role', 'menuitem')

    expect(isInteractiveEventTarget(button)).toBe(true)
    expect(isInteractiveEventTarget(item)).toBe(true)
  })

  it('keeps disabled PRD shortcut slots visible for help surfaces', () => {
    expect(RESERVED_SHORTCUTS.map((shortcut) => shortcut.id)).toEqual([
      'ask.focus',
      'firm.switch',
      'evidence.selected',
    ])
  })
})
