# 2026-04-27 · Login Heading Catalog Fix

## Context

The `zh-CN` Lingui catalog translated the login heading
`Welcome back to the workbench.` as a repeated, expanded message:

```po
msgstr ""
"欢迎回到工作台。欢迎回到工作台。欢迎回来。\n"
"事务所工作台已就绪。"
```

The source string is a single `<Trans>` message in `apps/app/src/routes/login.tsx`.
The heading reserves two lines with CSS, so the catalog only needs a soft line
break at a natural Chinese phrase boundary.

## Change

- Removed the duplicated `欢迎回到工作台。` prefix and restored the pre-regression
  two-line copy: `欢迎回到工作台。欢迎回来。\n事务所工作台已就绪。`.
- Recompiled Lingui catalogs so `messages.ts` matches `messages.po`.

## Notes

The wider `zh-CN` catalog scan found no other single-sentence messages expanded
into repeated Chinese copy. Remaining English tokens in Chinese translations are
product names, abbreviations, placeholders, or current product terminology such
as `Google`, `CSV`, `CPA`, `AI`, `EIN`, and `DueDateHQ`.
