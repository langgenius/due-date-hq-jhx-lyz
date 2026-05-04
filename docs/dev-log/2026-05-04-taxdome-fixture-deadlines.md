---
title: '2026-05-04 · TaxDome fixture future deadlines'
date: 2026-05-04
author: 'Codex'
---

# TaxDome fixture future deadlines

## What changed

- Added a `Deadline` column to `taxdome-30clients.csv`.
- Updated all 30 TaxDome fixture rows so deadlines are not earlier than `2026-05-04`.
- Split the dates evenly across near-term testing windows: 10 within the future week, 10 within the
  future month, and 10 beyond one month.
- Updated the migration fixture README column count and TaxDome fixture notes.

## Validation

- CSV shape checked with `awk`.
