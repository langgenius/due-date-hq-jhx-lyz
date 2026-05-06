# 2026-05-06 Archive Solo Demo Reset

## Change

- Reset the local `Archive Solo Practice` (`mock_firm_solo`) demo workspace to an empty business-data state for live walkthroughs.
- Removed the Archive Solo seed client, obligation, and firm-scoped audit row from `mock/demo.sql` so reseeding keeps the practice blank.
- Fixed a malformed Team plan readiness response seed row so `mock/demo.sql` can be replayed into a D1 copy.
- Added `karbon-full-flow-demo.csv` as a live-demo Karbon fixture covering mapping, normalization, Default Matrix, skipped rows, explicit tax types, client facts, exposure inputs, and rule-driven obligation generation.

## Validation

- Verified local D1 `mock_firm_solo` has 0 clients, 0 obligations, 0 migration batches, 0 audit events, and 0 active practice rules.
- Parsed `karbon-full-flow-demo.csv` with the project CSV parser and confirmed 26 data rows / 12 columns.
