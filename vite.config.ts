import { defineConfig } from 'vite-plus'

/**
 * Root Vite+ config — the monorepo's orchestration layer.
 *
 * Replaces, in one file:
 *   - turbo.json                   → `run.tasks`
 *   - oxlintrc.json                → `lint`
 *   - oxfmt.toml / .oxfmtrc.json   → `fmt`
 *   - lefthook.yml / lint-staged   → `staged`
 *
 * Per-app build config (React plugin, Tailwind plugin, dev proxy,
 * aliases) still lives in `apps/web/vite.config.ts`. This root file
 * drives `vp` subcommands for the whole workspace, not bundling.
 *
 * Authoritative references:
 *   docs/Dev File/01-Tech-Stack.md §4.4
 *   docs/Dev File/08-Project-Structure.md §6  (dependency direction)
 */
export default defineConfig({
  // ──────────────────────────────────────────────────────────
  // Linting (oxlint + tsgolint via `vp check`)
  //
  // `overrides` enforces the monorepo's dep-direction rules
  // (08 §6): procedures cannot import db/schema directly,
  // packages/core is pure TS, packages/contracts is zod-only,
  // packages/ai must not touch @duedatehq/db.
  // ──────────────────────────────────────────────────────────
  lint: {
    plugins: ['oxc', 'typescript', 'react', 'import', 'unicorn'],
    categories: {
      correctness: 'error',
      suspicious: 'warn',
      perf: 'warn',
      restriction: 'off',
    },
    env: {
      browser: true,
      node: true,
      es2023: true,
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      'no-console': 'off',
      'oxc/no-barrel-file': ['error', { threshold: 0 }],
      'typescript/no-explicit-any': 'error',
      // React 19's new JSX transform doesn't need React in scope.
      'react/react-in-jsx-scope': 'off',
      // `import './styles.css'` side-effect imports are intentional.
      'import/no-unassigned-import': 'off',
      // Empty-by-design scaffolding files are acceptable during Phase 0.
      'unicorn/no-empty-file': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@duedatehq/db/schema', '@duedatehq/db/schema/*'],
              message: 'Use context.scoped instead of directly importing schema in procedures.',
            },
          ],
        },
      ],
    },
    overrides: [
      {
        files: ['packages/db/**'],
        rules: { 'no-restricted-imports': 'off' },
      },
      {
        files: ['apps/server/src/jobs/**', 'apps/server/src/webhooks/**', 'packages/db/seed/**'],
        rules: { 'no-restricted-imports': 'off' },
      },
      {
        files: ['packages/core/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  group: [
                    'drizzle-orm',
                    'drizzle-orm/*',
                    '@duedatehq/db',
                    '@duedatehq/db/*',
                    'hono',
                    'hono/*',
                    '@cloudflare/workers-types',
                    '@orpc/server',
                    '@orpc/server/*',
                  ],
                  message:
                    'packages/core must be pure TS with no runtime/infrastructure dependencies.',
                },
              ],
            },
          ],
        },
      },
      {
        files: ['packages/contracts/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  group: [
                    '@orpc/server',
                    '@orpc/server/*',
                    'hono',
                    'hono/*',
                    'drizzle-orm',
                    'drizzle-orm/*',
                    '@duedatehq/db',
                    '@duedatehq/db/*',
                  ],
                  message:
                    'packages/contracts must only depend on zod and @orpc/contract (no server/db deps).',
                },
              ],
            },
          ],
        },
      },
      {
        files: ['packages/ai/**'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  group: ['@duedatehq/db', '@duedatehq/db/*'],
                  message:
                    'packages/ai must not import @duedatehq/db directly. Inject writers/stores via ports.ts.',
                },
              ],
            },
          ],
        },
      },
    ],
    ignorePatterns: [
      '**/dist/**',
      '**/.wrangler/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/drizzle/**',
      'apps/web/src/components/ui/**',
      '.agents/**',
      '.claude/**',
      '.cursor/**',
    ],
  },

  // ──────────────────────────────────────────────────────────
  // Formatting (oxfmt via `vp fmt`).
  // ──────────────────────────────────────────────────────────
  fmt: {
    semi: false,
    singleQuote: true,
    jsxSingleQuote: false,
    trailingComma: 'all',
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    arrowParens: 'always',
    endOfLine: 'lf',
    sortPackageJson: true,
    ignorePatterns: ['.agents/**', '.claude/**', '.cursor/**'],
  },

  // ──────────────────────────────────────────────────────────
  // Monorepo task graph (replaces turbo.json).
  // `vp run -r <task>` executes the task in every workspace
  // package that declares it, respecting pnpm dep ordering.
  // Content-based cache is enabled by default.
  // ──────────────────────────────────────────────────────────
  run: {
    cache: {
      scripts: true,
      tasks: true,
    },
    tasks: {
      // Build after lint/typecheck passes, so red-line errors
      // surface before we spend time on bundling.
      'workspace-build': {
        command: 'vp run -r build',
        dependsOn: ['workspace-check'],
        env: ['NODE_ENV'],
      },
      'workspace-check': {
        command: 'vp check',
        env: ['NODE_ENV'],
      },
      'workspace-test': {
        command: 'vp run -r test',
        env: ['NODE_ENV', 'CI'],
      },
      // Deploy is the only Cloudflare-control-plane task. It is
      // explicitly targeted at @duedatehq/server because the JIT
      // packages don't deploy. `cache: false` means no env
      // fingerprinting — Cloudflare credentials are simply
      // inherited from the shell at run time.
      'workspace-deploy': {
        command: 'vp run @duedatehq/server#deploy',
        cache: false,
        dependsOn: ['workspace-build', 'workspace-test'],
      },
    },
  },

  // ──────────────────────────────────────────────────────────
  // Git hooks (replaces lefthook + lint-staged).
  // `vp install` (or `pnpm prepare` which runs `vp config`) sets
  // up the pre-commit hook that reads this block. Keep the
  // `vp staged` only receives staged files; CI owns full-repo checks.
  // ──────────────────────────────────────────────────────────
  staged: {
    '*': 'vp check --fix',
  },
})
