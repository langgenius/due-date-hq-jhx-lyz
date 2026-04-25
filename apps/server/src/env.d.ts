// Vite's `?raw` import suffix isn't part of the worker bundler's built-in
// types but `packages/ai` consumes prompt markdown files via this loader.
// Mirroring the declaration here keeps `tsc --noEmit` happy when the server
// transitively imports from @duedatehq/ai. The loader behavior is provided
// by wrangler's esbuild pipeline at build time.
declare module '*.md?raw' {
  const content: string
  export default content
}
