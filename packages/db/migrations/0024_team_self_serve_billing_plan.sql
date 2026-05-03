-- Expand plan semantics for the self-serve Team tier.
-- firm_profile.plan is SQLite TEXT without a CHECK constraint; the TypeScript schema
-- owns the enum. This migration updates cached seat limits for existing paid rows.
UPDATE `firm_profile`
SET
  `seat_limit` = 3,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer)
WHERE `plan` = 'pro' AND `seat_limit` != 3;
--> statement-breakpoint
UPDATE `firm_profile`
SET
  `seat_limit` = 10,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer)
WHERE `plan` = 'team' AND `seat_limit` != 10;
--> statement-breakpoint
UPDATE `firm_profile`
SET
  `seat_limit` = 10,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer)
WHERE `plan` = 'firm' AND `seat_limit` < 10;
