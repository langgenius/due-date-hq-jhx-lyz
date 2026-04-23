// Ambient types for Lingui `.po` imports transformed by @lingui/vite-plugin.
// The plugin compiles each `.po` into a module exposing a `messages` record.
declare module '*.po' {
  import type { Messages } from '@lingui/core'
  export const messages: Messages
}
