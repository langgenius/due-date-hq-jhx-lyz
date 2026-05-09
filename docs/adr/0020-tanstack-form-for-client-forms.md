# ADR 0020 · TanStack Form for Client Forms

Date: 2026-05-09

## Context

`apps/app` only had two schema-managed forms using `react-hook-form` and
`@hookform/resolvers/zod`: client creation and rules generation preview. The resolver package's
`zod` entrypoint imports Zod at runtime but does not declare Zod in its package metadata, which
requires package-manager patching under pnpm's isolated dependency graph.

The rest of the app already standardizes on TanStack libraries for server state, tables, virtual
lists, and keyboard shortcuts. Zod remains the contract/schema source for app and API boundaries.

## Decision

Use `@tanstack/react-form@1.29.3` as the form-state library for complex client-side forms in
`apps/app`.

- Use `useForm`, `form.Field`, and `form.Subscribe` for library-managed form state.
- Attach Zod schemas directly through TanStack Form validators, using the Standard Schema support
  built into TanStack Form.
- Keep `zod` as the validation/schema dependency owned by the app and contracts.
- Remove `react-hook-form` and `@hookform/resolvers`; do not add root-level `zod` or package
  extensions to compensate for resolver metadata.
- Simple native forms may keep local submit handlers when they do not need field registration,
  schema validation, or cross-field form state.

## Consequences

- The app has one fewer resolver layer and no pnpm metadata patch for form validation.
- Schema-managed forms align with the existing TanStack-heavy frontend stack.
- Zod validation stays explicit and close to the submitted values.
- Future complex forms should use TanStack Form first; adding another form state library requires a
  new ADR or a superseding decision.

## Status

accepted
