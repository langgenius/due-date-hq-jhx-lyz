interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PUBLIC_APP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
