// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

const viteConfig = {
  plugins: tailwindcss(),
}

// Marketing static site (duedatehq.com). Per docs/dev-file/12-Marketing-Architecture.md §4.
// - `site` is required by @astrojs/sitemap and for canonical URLs.
// - `trailingSlash: 'never'` + `build.format: 'file'` collapses /zh-CN/ vs /zh-CN duplicates.
// - Tailwind 4 must be wired through `vite.plugins[tailwindcss()]`; the CSS-only
//   `@import 'tailwindcss'` form alone does NOT activate the plugin.
// - i18n.fallback ('zh-CN' -> 'en') with fallbackType: 'redirect' covers missing zh-CN routes.
//   `redirectToDefaultLocale` is intentionally omitted because it only takes effect when
//   `prefixDefaultLocale: true`, which conflicts with the "default English at /" strategy.
// - The `@astrojs/react` integration is intentionally NOT registered. The first
//   landing has zero React islands; registering the integration would cause Astro
//   to emit a ~190 KB orphan React client bundle into `dist/_astro/`. When a real
//   React island is needed later (e.g. interactive LocaleSwitcher), add `react()`
//   back here and ensure §5.1 JS-budget rules apply.
// @ts-expect-error Astro 6 + workspace Vite alias recurses while comparing plugin types.
export default defineConfig({
  site: 'https://duedatehq.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      // The i18n `fallback` engine emits a hidden `/zh-CN/zh-cn` redirect
      // alongside `/zh-CN`. Astro skips writing the HTML, but the sitemap
      // crawler still picks the route up. Filter it explicitly so SEO tools
      // only see the two canonical URLs (`/` and `/zh-CN`).
      filter: (page) => !/\/zh-CN\/zh-cn\/?$/i.test(page),
    }),
  ],
  vite: viteConfig,
  i18n: {
    locales: ['en', 'zh-CN'],
    defaultLocale: 'en',
    fallback: { 'zh-CN': 'en' },
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'redirect',
    },
  },
})
