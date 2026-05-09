# 2026-05-07 Archive Solo Pulse Demo

## Change

- Added `mock/archive-solo-pulse-demo.sql` as a repeatable local D1 supplement for the
  `Archive Solo Practice` (`mock_firm_solo`) workspace.
- The supplement seeds five Archive Solo clients and five matching obligations so Pulse changes
  visibly affect clients in the dashboard banner, Rules > Pulse Changes, and Pulse detail drawer.
- Seeded four active Pulse changes across AI confidence bands: `AI 96%`, `AI 82%`, `AI 63%`, and
  `AI 46%`. The CA high-confidence Pulse includes one eligible client and one missing-county
  client that requires review.
- Documented the supplement command in `mock/README.md`.

## Validation

- Executed the supplement against local D1:

  ```bash
  pnpm --dir apps/server exec wrangler d1 execute DB --local --config wrangler.toml --file ../../mock/archive-solo-pulse-demo.sql
  ```

- Verified local D1 has 5 Archive Solo supplement clients, 5 supplement obligations, and 4
  supplement Pulse alerts.
- Verified each seeded Pulse alert has non-zero `matched_count + needs_review_count`.
- DESIGN.md remains aligned because this is data-only demo seeding; no UI behavior or visual spec
  changed.
