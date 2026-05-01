-- DueDateHQ live-demo dataset.
-- Seed with: pnpm db:migrate:local && pnpm db:seed:demo

BEGIN TRANSACTION;

DELETE FROM client_email_suppression WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM reminder WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM in_app_notification WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM email_outbox WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM notification_preference WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM dashboard_brief WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM llm_log WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM ai_output WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM audit_evidence_package WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM evidence_link WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM audit_event WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM obligation_exception_application WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM exception_rule WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM pulse_application WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM pulse_firm_alert WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM pulse_source_signal WHERE id LIKE 'mock_%';
DELETE FROM pulse_source_snapshot WHERE id LIKE 'mock_%';
DELETE FROM pulse
WHERE id LIKE 'mock_%'
  OR id IN (
    '40000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000004',
    '40000000-0000-4000-8000-000000000005',
    '40000000-0000-4000-8000-000000000006',
    '40000000-0000-4000-8000-000000000007'
  );
DELETE FROM obligation_instance WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM client WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM migration_error
WHERE batch_id LIKE 'mock_migration_%'
  OR batch_id IN (SELECT id FROM migration_batch WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo'));
DELETE FROM migration_normalization
WHERE batch_id LIKE 'mock_migration_%'
  OR batch_id IN (SELECT id FROM migration_batch WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo'));
DELETE FROM migration_mapping
WHERE batch_id LIKE 'mock_migration_%'
  OR batch_id IN (SELECT id FROM migration_batch WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo'));
DELETE FROM migration_batch WHERE firm_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM subscription WHERE reference_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM invitation WHERE organization_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM member WHERE organization_id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM session WHERE user_id IN (
  'mock_user_owner_sarah',
  'mock_user_manager_miguel',
  'mock_user_preparer_avery',
  'mock_user_coordinator_jules'
);
DELETE FROM account WHERE user_id IN (
  'mock_user_owner_sarah',
  'mock_user_manager_miguel',
  'mock_user_preparer_avery',
  'mock_user_coordinator_jules'
);
DELETE FROM firm_profile WHERE id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM organization WHERE id IN ('mock_firm_brightline', 'mock_firm_solo');
DELETE FROM user WHERE id IN (
  'mock_user_owner_sarah',
  'mock_user_manager_miguel',
  'mock_user_preparer_avery',
  'mock_user_coordinator_jules'
);

INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at)
VALUES
  ('mock_user_owner_sarah', 'Sarah Martinez', 'sarah.demo@duedatehq.test', 1, NULL, CAST(unixepoch('2026-05-01 08:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:00:00') * 1000 AS INTEGER)),
  ('mock_user_manager_miguel', 'Miguel Chen', 'miguel.manager@duedatehq.test', 1, NULL, CAST(unixepoch('2026-05-01 08:01:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:01:00') * 1000 AS INTEGER)),
  ('mock_user_preparer_avery', 'Avery Patel', 'avery.preparer@duedatehq.test', 1, NULL, CAST(unixepoch('2026-05-01 08:02:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:02:00') * 1000 AS INTEGER)),
  ('mock_user_coordinator_jules', 'Jules Rivera', 'jules.coordinator@duedatehq.test', 1, NULL, CAST(unixepoch('2026-05-01 08:03:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:03:00') * 1000 AS INTEGER));

INSERT INTO organization (id, name, slug, logo, stripe_customer_id, created_at, metadata)
VALUES
  ('mock_firm_brightline', 'Brightline Demo CPA', 'brightline-demo-cpa', NULL, 'cus_mock_brightline', CAST(unixepoch('2026-05-01 08:05:00') * 1000 AS INTEGER), NULL),
  ('mock_firm_solo', 'Archive Solo Practice', 'archive-solo-practice', NULL, NULL, CAST(unixepoch('2026-05-01 08:06:00') * 1000 AS INTEGER), NULL);

INSERT INTO member (id, organization_id, user_id, role, created_at, status)
VALUES
  ('mock_member_owner_sarah', 'mock_firm_brightline', 'mock_user_owner_sarah', 'owner', CAST(unixepoch('2026-05-01 08:10:00') * 1000 AS INTEGER), 'active'),
  ('mock_member_manager_miguel', 'mock_firm_brightline', 'mock_user_manager_miguel', 'manager', CAST(unixepoch('2026-05-01 08:11:00') * 1000 AS INTEGER), 'active'),
  ('mock_member_preparer_avery', 'mock_firm_brightline', 'mock_user_preparer_avery', 'preparer', CAST(unixepoch('2026-05-01 08:12:00') * 1000 AS INTEGER), 'active'),
  ('mock_member_coordinator_jules', 'mock_firm_brightline', 'mock_user_coordinator_jules', 'coordinator', CAST(unixepoch('2026-05-01 08:13:00') * 1000 AS INTEGER), 'active'),
  ('mock_member_solo_sarah', 'mock_firm_solo', 'mock_user_owner_sarah', 'owner', CAST(unixepoch('2026-05-01 08:14:00') * 1000 AS INTEGER), 'active');

INSERT INTO firm_profile
  (id, name, plan, seat_limit, timezone, owner_user_id, status, billing_customer_id, billing_subscription_id, coordinator_can_see_dollars, created_at, updated_at, deleted_at)
VALUES
  ('mock_firm_brightline', 'Brightline Demo CPA', 'pro', 5, 'America/Los_Angeles', 'mock_user_owner_sarah', 'active', 'cus_mock_brightline', 'sub_mock_brightline_pro', 0, CAST(unixepoch('2026-05-01 08:05:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:20:00') * 1000 AS INTEGER), NULL),
  ('mock_firm_solo', 'Archive Solo Practice', 'solo', 1, 'America/New_York', 'mock_user_owner_sarah', 'active', NULL, NULL, 0, CAST(unixepoch('2026-05-01 08:06:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:21:00') * 1000 AS INTEGER), NULL);

INSERT INTO invitation (id, organization_id, email, role, status, expires_at, created_at, inviter_id)
VALUES
  ('mock_invitation_pending_ops', 'mock_firm_brightline', 'ops.lead@duedatehq.test', 'manager', 'pending', CAST(unixepoch('2026-05-08 12:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:05:00') * 1000 AS INTEGER), 'mock_user_owner_sarah'),
  ('mock_invitation_pending_bookkeeper', 'mock_firm_brightline', 'bookkeeper@duedatehq.test', 'coordinator', 'pending', CAST(unixepoch('2026-05-08 12:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:10:00') * 1000 AS INTEGER), 'mock_user_owner_sarah');

INSERT INTO subscription
  (id, plan, reference_id, stripe_customer_id, stripe_subscription_id, status, period_start, period_end, trial_start, trial_end, cancel_at_period_end, cancel_at, canceled_at, ended_at, seats, billing_interval, stripe_schedule_id, created_at, updated_at)
VALUES
  ('mock_subscription_brightline_pro', 'pro', 'mock_firm_brightline', 'cus_mock_brightline', 'sub_mock_brightline_pro', 'active', CAST(unixepoch('2026-05-01 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-06-01 00:00:00') * 1000 AS INTEGER), NULL, NULL, 0, NULL, NULL, NULL, 5, 'month', NULL, CAST(unixepoch('2026-05-01 08:30:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:30:00') * 1000 AS INTEGER));

INSERT INTO migration_batch
  (id, firm_id, user_id, source, raw_input_r2_key, raw_input_file_name, raw_input_content_type, raw_input_size_bytes, mapping_json, preset_used, row_count, success_count, skipped_count, ai_global_confidence, status, applied_at, revert_expires_at, reverted_at, created_at, updated_at)
VALUES
  ('30000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'mock_user_preparer_avery', 'preset_karbon', 'firm/mock_firm_brightline/migration/30000000-0000-4000-8000-000000000001/karbon-may-import.csv', 'karbon-may-import.csv', 'text/csv', 1884, '{"rawInput":{"kind":"csv","headers":["Client","EIN","State","Entity","Assignee","Tax types"],"rowCount":4,"truncated":false},"mapperFallback":"preset"}', 'karbon', 4, 3, 1, 0.97, 'applied', CAST(unixepoch('2026-05-01 09:20:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-02 09:20:00') * 1000 AS INTEGER), NULL, CAST(unixepoch('2026-05-01 09:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:20:00') * 1000 AS INTEGER)),
  ('30000000-0000-4000-8000-000000000002', 'mock_firm_brightline', 'mock_user_manager_miguel', 'preset_taxdome', 'firm/mock_firm_brightline/migration/30000000-0000-4000-8000-000000000002/taxdome-test.csv', 'taxdome-test.csv', 'text/csv', 744, '{"rawInput":{"kind":"csv","headers":["Name","Type","Jurisdiction"],"rowCount":2,"truncated":false},"revertReason":"demo cleanup"}', 'taxdome', 2, 2, 0, 0.94, 'reverted', CAST(unixepoch('2026-04-30 15:30:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 15:30:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 10:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-04-30 15:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 10:00:00') * 1000 AS INTEGER));

INSERT INTO migration_mapping
  (id, batch_id, source_header, target_field, confidence, reasoning, user_overridden, model, prompt_version, created_at)
VALUES
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Client', 'client.name', 0.99, 'Column contains business names.', 0, 'openai/gpt-5-mini', 'mapper@v1', CAST(unixepoch('2026-05-01 09:05:00') * 1000 AS INTEGER)),
  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'State', 'client.state', 0.98, 'Two-letter jurisdiction values.', 0, 'openai/gpt-5-mini', 'mapper@v1', CAST(unixepoch('2026-05-01 09:05:00') * 1000 AS INTEGER)),
  ('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'Entity', 'client.entity_type', 0.96, 'Entity labels map to DueDateHQ taxonomy.', 0, 'openai/gpt-5-mini', 'mapper@v1', CAST(unixepoch('2026-05-01 09:05:00') * 1000 AS INTEGER)),
  ('31000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001', 'Tax types', 'client.tax_types', 0.95, 'Mixed federal and state obligation hints.', 1, 'openai/gpt-5-mini', 'mapper@v1', CAST(unixepoch('2026-05-01 09:06:00') * 1000 AS INTEGER));

INSERT INTO migration_normalization
  (id, batch_id, field, raw_value, normalized_value, confidence, model, prompt_version, reasoning, user_overridden, created_at)
VALUES
  ('32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'entity_type', 'S Corporation', 's_corp', 0.98, 'openai/gpt-5-mini', 'normalizer-entity@v1', 'Common S corporation synonym.', 0, CAST(unixepoch('2026-05-01 09:08:00') * 1000 AS INTEGER)),
  ('32000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'state', 'Texas', 'TX', 0.99, 'openai/gpt-5-mini', 'normalizer-tax-types@v1', 'State name normalized to postal code.', 0, CAST(unixepoch('2026-05-01 09:08:00') * 1000 AS INTEGER)),
  ('32000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'tax_types', '1065, NY CT-3-S', '["federal_1065","ny_ct3s"]', 0.93, 'openai/gpt-5-mini', 'normalizer-tax-types@v1', 'Tax type dictionary match.', 1, CAST(unixepoch('2026-05-01 09:09:00') * 1000 AS INTEGER));

INSERT INTO migration_error
  (id, batch_id, row_index, raw_row_json, error_code, error_message, created_at)
VALUES
  ('33000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 4, '{"Client":"Draft Riverbend","State":"","Entity":"LLC"}', 'STATE_REQUIRED', 'State is required before default matrix can generate state obligations.', CAST(unixepoch('2026-05-01 09:12:00') * 1000 AS INTEGER));

INSERT INTO client
  (id, firm_id, name, ein, state, county, entity_type, email, notes, assignee_name, estimated_tax_liability_cents, estimated_tax_liability_source, equity_owner_count, migration_batch_id, created_at, updated_at, deleted_at)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'Arbor & Vale LLC', '12-3456789', 'CA', 'Los Angeles', 'llc', 'finance@arborvale.test', 'High-touch partnership client for Pulse relief demo.', 'M. Chen', 7800000, 'demo_seed', 3, NULL, CAST(unixepoch('2026-05-01 08:40:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:35:00') * 1000 AS INTEGER), NULL),
  ('10000000-0000-4000-8000-000000000002', 'mock_firm_brightline', 'Bright Studio S-Corp', '21-2222222', 'CA', NULL, 's_corp', 'ops@brightstudio.test', 'Missing county intentionally exercises Pulse needs-review flow.', 'A. Rivera', 9400000, 'demo_seed', 2, NULL, CAST(unixepoch('2026-05-01 08:41:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:36:00') * 1000 AS INTEGER), NULL),
  ('10000000-0000-4000-8000-000000000003', 'mock_firm_brightline', 'Northstar Dental Group', '98-7654321', 'NY', 'Queens', 's_corp', 'controller@northstardental.test', 'Imported from Karbon.', 'A. Rivera', 5500000, 'imported', 4, '30000000-0000-4000-8000-000000000001', CAST(unixepoch('2026-05-01 09:20:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:37:00') * 1000 AS INTEGER), NULL),
  ('10000000-0000-4000-8000-000000000004', 'mock_firm_brightline', 'Copperline Studios Inc.', '45-1111111', 'TX', 'Travis', 'c_corp', 'tax@copperline.test', 'Waiting on client packet.', 'K. Patel', 12600000, 'imported', 8, '30000000-0000-4000-8000-000000000001', CAST(unixepoch('2026-05-01 09:21:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:38:00') * 1000 AS INTEGER), NULL),
  ('10000000-0000-4000-8000-000000000005', 'mock_firm_brightline', 'Cascade Florist', '33-4444444', 'WA', 'King', 'sole_prop', NULL, 'Unassigned owner and missing email exercise workload and client facts.', NULL, NULL, NULL, NULL, NULL, CAST(unixepoch('2026-05-01 08:44:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:39:00') * 1000 AS INTEGER), NULL),
  ('10000000-0000-4000-8000-000000000006', 'mock_firm_brightline', 'Magnolia Family Trust', '77-5555555', 'FL', 'Miami-Dade', 'trust', 'trustee@magnolia.test', 'Trust and Florida state coverage sample.', 'M. Chen', 2500000, 'demo_seed', 5, NULL, CAST(unixepoch('2026-05-01 08:45:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:40:00') * 1000 AS INTEGER), NULL),
  ('10000000-0000-4000-8000-000000000007', 'mock_firm_brightline', 'Lakeview Medical Partners', '66-8888888', 'MA', 'Suffolk', 'partnership', 'admin@lakeviewmedical.test', 'Large exposure partner return.', 'A. Rivera', 18500000, 'imported', 11, '30000000-0000-4000-8000-000000000001', CAST(unixepoch('2026-05-01 09:22:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:41:00') * 1000 AS INTEGER), NULL),
  ('10000000-0000-4000-8000-000000000008', 'mock_firm_brightline', 'Orbit Design LLC', '51-7777777', 'CA', 'San Diego', 'llc', 'founder@orbitdesign.test', 'CA FTB overlay already applied.', 'K. Patel', 4100000, 'demo_seed', 2, NULL, CAST(unixepoch('2026-05-01 08:48:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:42:00') * 1000 AS INTEGER), NULL),
  ('10000000-0000-4000-8000-000000000009', 'mock_firm_brightline', 'Riverbend Draft Client', NULL, NULL, NULL, 'llc', NULL, 'Incomplete record from skipped import row.', NULL, NULL, NULL, NULL, '30000000-0000-4000-8000-000000000001', CAST(unixepoch('2026-05-01 09:23:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:43:00') * 1000 AS INTEGER), NULL),
  ('10000000-0000-4000-8000-000000000010', 'mock_firm_solo', 'Archive Solo Client', '10-1010101', 'CA', 'Orange', 'individual', 'archive@solo.test', 'Small second firm for switcher demo.', 'Sarah Martinez', NULL, NULL, NULL, NULL, CAST(unixepoch('2026-05-01 08:50:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:50:00') * 1000 AS INTEGER), NULL);

INSERT INTO obligation_instance
  (id, firm_id, client_id, tax_type, tax_year, base_due_date, current_due_date, status, migration_batch_id, estimated_tax_due_cents, estimated_exposure_cents, exposure_status, penalty_breakdown_json, penalty_formula_version, exposure_calculated_at, created_at, updated_at)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000001', 'federal_1065', 2026, CAST(unixepoch('2026-05-15 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-15 00:00:00') * 1000 AS INTEGER), 'pending', NULL, 7800000, 240000, 'ready', '[{"key":"late_filing","label":"Late filing exposure","amountCents":240000,"formula":"$245 x 3 partners x 3 months"}]', 'penalty-v1', CAST(unixepoch('2026-05-01 09:45:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:52:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:45:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000002', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000001', 'ca_568', 2026, CAST(unixepoch('2026-05-02 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-02 00:00:00') * 1000 AS INTEGER), 'in_progress', NULL, 7800000, 90000, 'ready', '[{"key":"ftb_late_payment","label":"CA late payment exposure","amountCents":90000,"formula":"Estimated balance x demo rate"}]', 'penalty-v1', CAST(unixepoch('2026-05-01 09:45:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:53:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:45:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000003', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000002', 'federal_1120s', 2026, CAST(unixepoch('2026-05-15 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-15 00:00:00') * 1000 AS INTEGER), 'review', NULL, 9400000, 310000, 'ready', '[{"key":"late_filing","label":"S corp shareholder penalty","amountCents":310000,"formula":"Shareholder count x monthly penalty"}]', 'penalty-v1', CAST(unixepoch('2026-05-01 09:45:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:54:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:45:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000004', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000003', 'ny_ct3s', 2026, CAST(unixepoch('2026-05-04 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-04 00:00:00') * 1000 AS INTEGER), 'review', '30000000-0000-4000-8000-000000000001', 5500000, 120000, 'ready', '[{"key":"ny_review","label":"NY review exposure","amountCents":120000,"formula":"Demo estimate from imported liability"}]', 'penalty-v1', CAST(unixepoch('2026-05-01 09:46:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:24:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:46:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000005', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000004', 'tx_franchise_report', 2026, CAST(unixepoch('2026-05-05 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-05 00:00:00') * 1000 AS INTEGER), 'waiting_on_client', '30000000-0000-4000-8000-000000000001', 12600000, 185000, 'ready', '[{"key":"tx_franchise","label":"TX franchise report exposure","amountCents":185000,"formula":"Demo state estimate"}]', 'penalty-v1', CAST(unixepoch('2026-05-01 09:46:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:25:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:46:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000006', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000005', 'federal_1040', 2026, CAST(unixepoch('2026-04-29 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-04-29 00:00:00') * 1000 AS INTEGER), 'pending', NULL, NULL, NULL, 'needs_input', '[]', NULL, NULL, CAST(unixepoch('2026-05-01 08:56:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:56:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000007', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000006', 'federal_1041', 2026, CAST(unixepoch('2026-05-08 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-08 00:00:00') * 1000 AS INTEGER), 'done', NULL, 2500000, 0, 'ready', '[{"key":"closed","label":"Completed before exposure accrued","amountCents":0,"formula":"Marked done"}]', 'penalty-v1', CAST(unixepoch('2026-05-01 09:46:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:57:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:46:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000008', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000006', 'fl_corp_income', 2026, CAST(unixepoch('2026-05-12 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-12 00:00:00') * 1000 AS INTEGER), 'pending', NULL, 2500000, NULL, 'unsupported', '[]', NULL, NULL, CAST(unixepoch('2026-05-01 08:58:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:58:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000009', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000007', 'federal_1065', 2026, CAST(unixepoch('2026-05-01 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 00:00:00') * 1000 AS INTEGER), 'pending', '30000000-0000-4000-8000-000000000001', 18500000, 430000, 'ready', '[{"key":"late_filing","label":"Large partnership late filing exposure","amountCents":430000,"formula":"$245 x 11 partners x 2 months"}]', 'penalty-v1', CAST(unixepoch('2026-05-01 09:46:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:26:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:46:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000010', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000008', 'ca_llc_franchise_min_800', 2026, CAST(unixepoch('2026-04-30 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-04-30 00:00:00') * 1000 AS INTEGER), 'in_progress', NULL, 4100000, 75000, 'ready', '[{"key":"ca_llc","label":"CA LLC minimum tax exposure","amountCents":75000,"formula":"Demo overlay adjusted due date"}]', 'penalty-v1', CAST(unixepoch('2026-05-01 09:46:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:59:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:46:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000011', 'mock_firm_brightline', '10000000-0000-4000-8000-000000000009', 'federal_1040', 2026, CAST(unixepoch('2026-05-06 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-06 00:00:00') * 1000 AS INTEGER), 'pending', '30000000-0000-4000-8000-000000000001', NULL, NULL, 'needs_input', '[]', NULL, NULL, CAST(unixepoch('2026-05-01 09:27:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:27:00') * 1000 AS INTEGER)),
  ('20000000-0000-4000-8000-000000000012', 'mock_firm_solo', '10000000-0000-4000-8000-000000000010', 'federal_1040', 2026, CAST(unixepoch('2026-05-09 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-09 00:00:00') * 1000 AS INTEGER), 'pending', NULL, NULL, NULL, 'needs_input', '[]', NULL, NULL, CAST(unixepoch('2026-05-01 08:55:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:55:00') * 1000 AS INTEGER));

INSERT INTO pulse
  (id, source, source_url, raw_r2_key, published_at, ai_summary, verbatim_quote, parsed_jurisdiction, parsed_counties, parsed_forms, parsed_entity_types, parsed_original_due_date, parsed_new_due_date, parsed_effective_from, confidence, status, reviewed_by, reviewed_at, requires_human_review, is_sample, created_at, updated_at)
VALUES
  ('40000000-0000-4000-8000-000000000001', 'IRS Disaster Relief', 'https://www.irs.gov/newsroom/tax-relief-in-disaster-situations', 'mock/pulse/irs-ca-fire-relief.html', CAST(unixepoch('2026-05-01 07:30:00') * 1000 AS INTEGER), 'IRS relief extends selected partnership and S-corp deadlines for Los Angeles County taxpayers.', 'Affected taxpayers in Los Angeles County have until June 16, 2026 to file selected federal business returns.', 'CA', '["Los Angeles"]', '["federal_1065","federal_1120s"]', '["llc","s_corp"]', CAST(unixepoch('2026-05-15 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-06-16 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 07:30:00') * 1000 AS INTEGER), 0.94, 'approved', 'mock_user_manager_miguel', CAST(unixepoch('2026-05-01 08:30:00') * 1000 AS INTEGER), 1, 1, CAST(unixepoch('2026-05-01 07:35:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:30:00') * 1000 AS INTEGER)),
  ('40000000-0000-4000-8000-000000000002', 'CA FTB Newsroom', 'https://www.ftb.ca.gov/about-ftb/newsroom/index.html', 'mock/pulse/ca-ftb-llc-payment.html', CAST(unixepoch('2026-04-30 15:00:00') * 1000 AS INTEGER), 'CA FTB extends selected LLC payment deadlines by 30 days for San Diego County.', 'The Franchise Tax Board extends the LLC payment deadline to May 30, 2026 for San Diego County taxpayers.', 'CA', '["San Diego"]', '["ca_llc_franchise_min_800"]', '["llc"]', CAST(unixepoch('2026-04-30 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-30 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-04-30 15:00:00') * 1000 AS INTEGER), 0.82, 'approved', 'mock_user_manager_miguel', CAST(unixepoch('2026-04-30 16:00:00') * 1000 AS INTEGER), 1, 1, CAST(unixepoch('2026-04-30 15:10:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:50:00') * 1000 AS INTEGER)),
  ('40000000-0000-4000-8000-000000000003', 'NY DTF Advisory', 'https://www.tax.ny.gov/pit/file/extension_of_time_to_file.htm', 'mock/pulse/ny-dtf-low-confidence.html', CAST(unixepoch('2026-04-29 14:00:00') * 1000 AS INTEGER), 'NY DTF advisory has low-confidence extracted deadline details for manual review.', 'Some due dates and filing obligations may vary by taxpayer circumstance and form type.', 'NY', '["Queens"]', '["ny_it204"]', '["partnership"]', CAST(unixepoch('2026-05-15 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-06-16 00:00:00') * 1000 AS INTEGER), NULL, 0.58, 'approved', 'mock_user_manager_miguel', CAST(unixepoch('2026-04-29 15:00:00') * 1000 AS INTEGER), 1, 1, CAST(unixepoch('2026-04-29 14:10:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:53:00') * 1000 AS INTEGER)),
  ('40000000-0000-4000-8000-000000000004', 'FL DOR Bulletin', 'https://floridarevenue.com/taxes/taxesfees/Pages/corporate.aspx', 'mock/pulse/fl-dor-sub-50-confidence.html', CAST(unixepoch('2026-04-28 13:00:00') * 1000 AS INTEGER), 'FL DOR bulletin has very-low-confidence extracted deadline details for operator review.', 'Corporate income tax filing dates may depend on entity status, fiscal year, and extension election.', 'FL', '[]', '["fl_corp_income"]', '["c_corp"]', CAST(unixepoch('2026-05-12 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-06-01 00:00:00') * 1000 AS INTEGER), NULL, 0.46, 'approved', 'mock_user_manager_miguel', CAST(unixepoch('2026-04-28 14:00:00') * 1000 AS INTEGER), 1, 1, CAST(unixepoch('2026-04-28 13:10:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:54:00') * 1000 AS INTEGER)),
  ('40000000-0000-4000-8000-000000000005', 'Ops Review · Approve Demo', 'https://www.irs.gov/newsroom/tax-relief-in-disaster-situations', 'mock/pulse/ops-approve.html', CAST(unixepoch('2026-05-01 10:00:00') * 1000 AS INTEGER), 'Pending ops review sample intended for the Approve action.', 'Affected Los Angeles County business taxpayers may receive an additional filing extension.', 'CA', '["Los Angeles"]', '["federal_1065"]', '["llc"]', CAST(unixepoch('2026-05-15 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-06-20 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 10:00:00') * 1000 AS INTEGER), 0.88, 'pending_review', NULL, NULL, 1, 1, CAST(unixepoch('2026-05-01 10:01:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 10:01:00') * 1000 AS INTEGER)),
  ('40000000-0000-4000-8000-000000000006', 'Ops Review · Reject Demo', 'https://dor.wa.gov/taxes-rates/business-occupation-tax', 'mock/pulse/ops-reject.html', CAST(unixepoch('2026-05-01 10:05:00') * 1000 AS INTEGER), 'Pending ops review sample intended for the Reject action.', 'The extracted date appears to describe a filing guide update, not a deadline extension.', 'WA', '[]', '["wa_b_and_o"]', '["c_corp"]', CAST(unixepoch('2026-05-31 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-06-30 00:00:00') * 1000 AS INTEGER), NULL, 0.62, 'pending_review', NULL, NULL, 1, 1, CAST(unixepoch('2026-05-01 10:06:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 10:06:00') * 1000 AS INTEGER)),
  ('40000000-0000-4000-8000-000000000007', 'Ops Review · Quarantine Demo', 'https://comptroller.texas.gov/taxes/franchise/', 'mock/pulse/ops-quarantine.html', CAST(unixepoch('2026-05-01 10:10:00') * 1000 AS INTEGER), 'Pending ops review sample intended for the Quarantine action.', 'The source copy conflicts with the extracted franchise report date and should be isolated.', 'TX', '[]', '["tx_franchise_report"]', '["llc"]', CAST(unixepoch('2026-05-15 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-07-15 00:00:00') * 1000 AS INTEGER), NULL, 0.34, 'pending_review', NULL, NULL, 1, 1, CAST(unixepoch('2026-05-01 10:11:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 10:11:00') * 1000 AS INTEGER));

INSERT INTO pulse_firm_alert
  (id, pulse_id, firm_id, status, matched_count, needs_review_count, dismissed_by, dismissed_at, snoozed_until, created_at, updated_at)
VALUES
  ('41000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'matched', 1, 0, NULL, NULL, NULL, CAST(unixepoch('2026-05-01 08:31:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:51:00') * 1000 AS INTEGER)),
  ('41000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'mock_firm_brightline', 'applied', 0, 0, NULL, NULL, NULL, CAST(unixepoch('2026-04-30 16:01:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:52:00') * 1000 AS INTEGER)),
  ('41000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'mock_firm_brightline', 'matched', 0, 0, NULL, NULL, NULL, CAST(unixepoch('2026-04-29 15:01:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:53:00') * 1000 AS INTEGER)),
  ('41000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', 'mock_firm_brightline', 'matched', 0, 0, NULL, NULL, NULL, CAST(unixepoch('2026-04-28 14:01:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:54:00') * 1000 AS INTEGER));

INSERT INTO exception_rule
  (id, firm_id, source_pulse_id, jurisdiction, counties, affected_forms, affected_entity_types, override_type, override_value_json, override_due_date, effective_from, effective_until, status, source_url, verbatim_quote, created_at, updated_at)
VALUES
  ('42000000-0000-4000-8000-000000000001', 'mock_firm_brightline', '40000000-0000-4000-8000-000000000002', 'CA', '["San Diego"]', '["ca_llc_franchise_min_800"]', '["llc"]', 'extend_due_date', '{"originalDueDate":"2026-04-30","newDueDate":"2026-05-30"}', CAST(unixepoch('2026-05-30 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-04-30 15:00:00') * 1000 AS INTEGER), NULL, 'applied', 'https://www.ftb.ca.gov/about-ftb/newsroom/index.html', 'The Franchise Tax Board extends the LLC payment deadline to May 30, 2026 for San Diego County taxpayers.', CAST(unixepoch('2026-05-01 09:30:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:30:00') * 1000 AS INTEGER));

INSERT INTO obligation_exception_application
  (id, firm_id, obligation_instance_id, exception_rule_id, applied_at, applied_by_user_id, reverted_at, reverted_by_user_id)
VALUES
  ('43000000-0000-4000-8000-000000000001', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000010', '42000000-0000-4000-8000-000000000001', CAST(unixepoch('2026-05-01 09:30:00') * 1000 AS INTEGER), 'mock_user_manager_miguel', NULL, NULL);

INSERT INTO pulse_application
  (id, pulse_id, obligation_instance_id, client_id, firm_id, applied_by, applied_at, reverted_by, reverted_at, before_due_date, after_due_date)
VALUES
  ('44000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000008', 'mock_firm_brightline', 'mock_user_manager_miguel', CAST(unixepoch('2026-05-01 09:30:00') * 1000 AS INTEGER), NULL, NULL, CAST(unixepoch('2026-04-30 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-30 00:00:00') * 1000 AS INTEGER));

INSERT INTO pulse_source_state
  (source_id, tier, jurisdiction, enabled, cadence_ms, health_status, last_checked_at, last_success_at, last_change_detected_at, next_check_at, consecutive_failures, last_error, etag, last_modified, created_at, updated_at)
VALUES
  ('irs.disaster', 'T1', 'US', 1, 1800000, 'healthy', CAST(unixepoch('2026-05-01 09:45:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:45:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 07:35:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 10:15:00') * 1000 AS INTEGER), 0, NULL, 'mock-etag-irs-disaster', 'Fri, 01 May 2026 07:35:00 GMT', CAST(unixepoch('2026-05-01 07:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:45:00') * 1000 AS INTEGER)),
  ('ca.ftb.newsroom', 'T1', 'CA', 1, 1800000, 'healthy', CAST(unixepoch('2026-05-01 09:40:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:40:00') * 1000 AS INTEGER), CAST(unixepoch('2026-04-30 15:10:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 10:10:00') * 1000 AS INTEGER), 0, NULL, 'mock-etag-ca-ftb', 'Thu, 30 Apr 2026 15:10:00 GMT', CAST(unixepoch('2026-05-01 07:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:40:00') * 1000 AS INTEGER)),
  ('tx.cpa.rss', 'T1', 'TX', 1, 3600000, 'degraded', CAST(unixepoch('2026-05-01 09:20:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 07:20:00') * 1000 AS INTEGER), NULL, CAST(unixepoch('2026-05-01 10:20:00') * 1000 AS INTEGER), 1, 'RSS returned 304 after one retry.', NULL, NULL, CAST(unixepoch('2026-05-01 07:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:20:00') * 1000 AS INTEGER)),
  ('wa.dor.news', 'T1', 'WA', 1, 3600000, 'healthy', CAST(unixepoch('2026-05-01 09:10:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:10:00') * 1000 AS INTEGER), NULL, CAST(unixepoch('2026-05-01 10:10:00') * 1000 AS INTEGER), 0, NULL, NULL, NULL, CAST(unixepoch('2026-05-01 07:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:10:00') * 1000 AS INTEGER))
ON CONFLICT(source_id) DO UPDATE SET
  tier = excluded.tier,
  jurisdiction = excluded.jurisdiction,
  enabled = excluded.enabled,
  cadence_ms = excluded.cadence_ms,
  health_status = excluded.health_status,
  last_checked_at = excluded.last_checked_at,
  last_success_at = excluded.last_success_at,
  last_change_detected_at = excluded.last_change_detected_at,
  next_check_at = excluded.next_check_at,
  consecutive_failures = excluded.consecutive_failures,
  last_error = excluded.last_error,
  etag = excluded.etag,
  last_modified = excluded.last_modified,
  updated_at = excluded.updated_at;

INSERT INTO pulse_source_snapshot
  (id, source_id, external_id, title, official_source_url, published_at, fetched_at, content_hash, raw_r2_key, parse_status, pulse_id, ai_output_id, failure_reason, created_at, updated_at)
VALUES
  ('mock_snapshot_irs_ca_fire_relief', 'irs.disaster', 'irs-2026-ca-fire-relief', 'IRS announces CA fire relief', 'https://www.irs.gov/newsroom/tax-relief-in-disaster-situations', CAST(unixepoch('2026-05-01 07:30:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 07:35:00') * 1000 AS INTEGER), 'mockhashirsrelief', 'mock/pulse/irs-ca-fire-relief.html', 'extracted', '40000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002', NULL, CAST(unixepoch('2026-05-01 07:35:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 07:45:00') * 1000 AS INTEGER)),
  ('mock_snapshot_tx_retry', 'tx.cpa.rss', 'tx-franchise-feed-retry', 'TX Comptroller feed retry', 'https://comptroller.texas.gov/taxes/franchise/', CAST(unixepoch('2026-05-01 06:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:20:00') * 1000 AS INTEGER), 'mockhashtxretry', 'mock/pulse/tx-retry.xml', 'failed', NULL, NULL, 'Temporary upstream 503 after retry budget.', CAST(unixepoch('2026-05-01 09:20:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:20:00') * 1000 AS INTEGER));

INSERT INTO pulse_source_signal
  (id, source_id, external_id, title, official_source_url, published_at, fetched_at, content_hash, raw_r2_key, tier, jurisdiction, signal_type, status, linked_pulse_id, created_at, updated_at)
VALUES
  ('mock_signal_fema_ca', 'fema.declarations', 'fema-ca-2026-early-signal', 'FEMA early signal for CA counties', 'https://www.fema.gov/disaster/declarations', CAST(unixepoch('2026-04-30 12:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-04-30 12:05:00') * 1000 AS INTEGER), 'mockhashfema', 'mock/pulse/fema-ca-signal.json', 'T2', 'CA', 'anticipated_pulse', 'linked', '40000000-0000-4000-8000-000000000001', CAST(unixepoch('2026-04-30 12:05:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 07:45:00') * 1000 AS INTEGER)),
  ('mock_signal_fema_tx_open', 'fema.declarations', 'fema-tx-2026-early-signal', 'FEMA early signal for TX counties', 'https://www.fema.gov/disaster/declarations', CAST(unixepoch('2026-04-30 13:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-04-30 13:05:00') * 1000 AS INTEGER), 'mockhashfematx', 'mock/pulse/fema-tx-signal.json', 'T2', 'TX', 'anticipated_pulse', 'open', NULL, CAST(unixepoch('2026-04-30 13:05:00') * 1000 AS INTEGER), CAST(unixepoch('2026-04-30 13:05:00') * 1000 AS INTEGER));

INSERT INTO ai_output
  (id, firm_id, user_id, kind, prompt_version, model, input_context_ref, input_hash, output_text, citations_json, guard_result, refusal_code, generated_at, tokens_in, tokens_out, latency_ms, cost_usd)
VALUES
  ('50000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'mock_user_owner_sarah', 'brief', 'dashboard-brief@v1', 'openai/gpt-5-mini', 'dashboard:mock_firm_brightline:2026-05-01', 'mockhash-dashboard-2026-05-01', 'Three deadlines need attention this week. Lakeview has the largest exposure, Arbor is ready for CA work, and Cascade needs liability inputs before exposure can be calculated.', '[{"ref":1,"obligationId":"20000000-0000-4000-8000-000000000009","evidence":{"id":"52000000-0000-4000-8000-000000000006","sourceType":"default_inference_by_entity_state","sourceId":"30000000-0000-4000-8000-000000000001","sourceUrl":null}}]', 'allowed', NULL, CAST(unixepoch('2026-05-01 09:55:00') * 1000 AS INTEGER), 1840, 188, 1180, 0.014),
  ('50000000-0000-4000-8000-000000000002', 'mock_firm_brightline', 'mock_user_manager_miguel', 'pulse_extract', 'pulse-extract@v1', 'openai/gpt-5-mini', 'mock_snapshot_irs_ca_fire_relief', 'mockhash-pulse-extract', 'Extracted jurisdiction, forms, counties, original due date, and new due date from IRS sample announcement.', '[{"sourceUrl":"https://www.irs.gov/newsroom/tax-relief-in-disaster-situations"}]', 'allowed', NULL, CAST(unixepoch('2026-05-01 07:44:00') * 1000 AS INTEGER), 1210, 144, 940, 0.009);

INSERT INTO dashboard_brief
  (id, firm_id, user_id, scope, as_of_date, status, input_hash, ai_output_id, summary_text, top_obligation_ids_json, citations_json, reason, error_code, generated_at, expires_at, created_at, updated_at)
VALUES
  ('51000000-0000-4000-8000-000000000001', 'mock_firm_brightline', NULL, 'firm', '2026-05-01', 'ready', 'mockhash-dashboard-2026-05-01', '50000000-0000-4000-8000-000000000001', 'Three deadlines need attention this week. Lakeview carries the largest exposure, Arbor is ready for CA work, and Cascade needs liability inputs before exposure can be calculated.', '["20000000-0000-4000-8000-000000000009","20000000-0000-4000-8000-000000000002","20000000-0000-4000-8000-000000000005"]', '[{"ref":1,"obligationId":"20000000-0000-4000-8000-000000000009","evidence":{"id":"52000000-0000-4000-8000-000000000006","sourceType":"default_inference_by_entity_state","sourceId":"30000000-0000-4000-8000-000000000001","sourceUrl":null}}]', 'demo_seed', NULL, CAST(unixepoch('2026-05-01 09:55:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-02 09:55:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:54:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:55:00') * 1000 AS INTEGER)),
  ('51000000-0000-4000-8000-000000000002', 'mock_firm_brightline', NULL, 'firm', '2026-04-30', 'ready', 'mockhash-dashboard-2026-04-30', '50000000-0000-4000-8000-000000000001', 'Three deadlines need attention this week. Lakeview carries the largest exposure, Arbor is ready for CA work, and Cascade needs liability inputs before exposure can be calculated.', '["20000000-0000-4000-8000-000000000009","20000000-0000-4000-8000-000000000002","20000000-0000-4000-8000-000000000005"]', '[{"ref":1,"obligationId":"20000000-0000-4000-8000-000000000009","evidence":{"id":"52000000-0000-4000-8000-000000000006","sourceType":"default_inference_by_entity_state","sourceId":"30000000-0000-4000-8000-000000000001","sourceUrl":null}}]', 'demo_seed', NULL, CAST(unixepoch('2026-05-01 09:55:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-02 09:55:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:54:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:55:00') * 1000 AS INTEGER));

INSERT INTO evidence_link
  (id, firm_id, obligation_instance_id, ai_output_id, source_type, source_id, source_url, verbatim_quote, raw_value, normalized_value, confidence, model, matrix_version, verified_at, verified_by, applied_at, applied_by)
VALUES
  ('52000000-0000-4000-8000-000000000001', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000001', NULL, 'default_inference_by_entity_state', 'default-matrix-v1', NULL, 'Federal partnership return due date inferred from entity type and tax year.', 'llc / CA / 2026', 'federal_1065 / 2026-05-15', 1.0, NULL, 'default-matrix-v1.0', CAST(unixepoch('2026-05-01 09:00:00') * 1000 AS INTEGER), 'mock_user_preparer_avery', CAST(unixepoch('2026-05-01 09:20:00') * 1000 AS INTEGER), 'mock_user_preparer_avery'),
  ('52000000-0000-4000-8000-000000000002', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000002', NULL, 'verified_rule', 'ca-568-demo-rule', 'https://www.ftb.ca.gov/forms/misc/568.html', 'CA Form 568 due date follows the LLC return calendar in the demo rule pack.', 'ca_568', '2026-05-02', 0.95, NULL, 'rules-mvp', CAST(unixepoch('2026-05-01 09:00:00') * 1000 AS INTEGER), 'mock_user_manager_miguel', CAST(unixepoch('2026-05-01 09:21:00') * 1000 AS INTEGER), 'mock_user_manager_miguel'),
  ('52000000-0000-4000-8000-000000000003', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000003', NULL, 'default_inference_by_entity_state', 'default-matrix-v1', NULL, 'S corp federal return inferred; county missing blocks automatic Pulse apply.', 's_corp / CA / county missing', 'federal_1120s / 2026-05-15', 0.86, NULL, 'default-matrix-v1.0', NULL, NULL, CAST(unixepoch('2026-05-01 09:22:00') * 1000 AS INTEGER), 'mock_user_preparer_avery'),
  ('52000000-0000-4000-8000-000000000004', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000001', 'ai_normalizer', '30000000-0000-4000-8000-000000000001', NULL, 'NY CT-3-S normalized from imported tax type.', 'NY CT-3-S', 'ny_ct3s', 0.93, 'openai/gpt-5-mini', NULL, CAST(unixepoch('2026-05-01 09:09:00') * 1000 AS INTEGER), 'mock_user_preparer_avery', CAST(unixepoch('2026-05-01 09:24:00') * 1000 AS INTEGER), 'mock_user_preparer_avery'),
  ('52000000-0000-4000-8000-000000000005', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000005', NULL, 'ai_mapper', '30000000-0000-4000-8000-000000000001', NULL, 'Tax types column mapped to TX franchise report.', 'TX Franchise', 'tx_franchise_report', 0.95, 'openai/gpt-5-mini', NULL, CAST(unixepoch('2026-05-01 09:07:00') * 1000 AS INTEGER), 'mock_user_preparer_avery', CAST(unixepoch('2026-05-01 09:25:00') * 1000 AS INTEGER), 'mock_user_preparer_avery'),
  ('52000000-0000-4000-8000-000000000006', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000009', NULL, 'default_inference_by_entity_state', '30000000-0000-4000-8000-000000000001', NULL, 'Partnership default matrix generated federal 1065 obligation.', 'partnership / MA / imported', 'federal_1065 / 2026-05-01', 1.0, NULL, 'default-matrix-v1.0', CAST(unixepoch('2026-05-01 09:15:00') * 1000 AS INTEGER), 'mock_user_preparer_avery', CAST(unixepoch('2026-05-01 09:26:00') * 1000 AS INTEGER), 'mock_user_preparer_avery'),
  ('52000000-0000-4000-8000-000000000007', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000010', NULL, 'pulse_apply', '40000000-0000-4000-8000-000000000002', 'https://www.ftb.ca.gov/about-ftb/newsroom/index.html', 'The Franchise Tax Board extends the LLC payment deadline to May 30, 2026 for San Diego County taxpayers.', '2026-04-30', '2026-05-30', 0.92, 'openai/gpt-5-mini', NULL, CAST(unixepoch('2026-05-01 09:30:00') * 1000 AS INTEGER), 'mock_user_manager_miguel', CAST(unixepoch('2026-05-01 09:30:00') * 1000 AS INTEGER), 'mock_user_manager_miguel'),
  ('52000000-0000-4000-8000-000000000008', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000007', NULL, 'user_override', 'mock_user_preparer_avery', NULL, 'Preparer marked the trust return complete after client signoff.', 'review', 'done', 1.0, NULL, NULL, CAST(unixepoch('2026-05-01 09:32:00') * 1000 AS INTEGER), 'mock_user_preparer_avery', CAST(unixepoch('2026-05-01 09:32:00') * 1000 AS INTEGER), 'mock_user_preparer_avery');

INSERT INTO audit_event
  (id, firm_id, actor_id, entity_type, entity_id, action, before_json, after_json, reason, ip_hash, user_agent_hash, created_at)
VALUES
  ('60000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'mock_user_preparer_avery', 'migration_batch', '30000000-0000-4000-8000-000000000001', 'migration.batch.created', NULL, '{"source":"preset_karbon","rowCount":4}', NULL, 'iphash_demo_1', 'uahash_demo_1', CAST(unixepoch('2026-05-01 09:00:00') * 1000 AS INTEGER)),
  ('60000000-0000-4000-8000-000000000002', 'mock_firm_brightline', 'mock_user_preparer_avery', 'migration_batch', '30000000-0000-4000-8000-000000000001', 'migration.imported', NULL, '{"successCount":3,"skippedCount":1}', NULL, 'iphash_demo_1', 'uahash_demo_1', CAST(unixepoch('2026-05-01 09:20:00') * 1000 AS INTEGER)),
  ('60000000-0000-4000-8000-000000000003', 'mock_firm_brightline', 'mock_user_preparer_avery', 'client_batch', '10000000-0000-4000-8000-000000000003', 'client.batch_created', NULL, '{"count":3}', NULL, 'iphash_demo_1', 'uahash_demo_1', CAST(unixepoch('2026-05-01 09:21:00') * 1000 AS INTEGER)),
  ('60000000-0000-4000-8000-000000000004', 'mock_firm_brightline', 'mock_user_preparer_avery', 'obligation_instance', '20000000-0000-4000-8000-000000000002', 'obligation.status.updated', '{"status":"pending"}', '{"status":"in_progress"}', 'Started CA return prep during demo.', 'iphash_demo_2', 'uahash_demo_2', CAST(unixepoch('2026-05-01 09:28:00') * 1000 AS INTEGER)),
  ('60000000-0000-4000-8000-000000000005', 'mock_firm_brightline', 'mock_user_manager_miguel', 'pulse', '40000000-0000-4000-8000-000000000002', 'pulse.apply', '{"dueDate":"2026-04-30"}', '{"dueDate":"2026-05-30","appliedCount":1}', 'Applied verified CA FTB overlay.', 'iphash_demo_3', 'uahash_demo_3', CAST(unixepoch('2026-05-01 09:30:00') * 1000 AS INTEGER)),
  ('60000000-0000-4000-8000-000000000006', 'mock_firm_brightline', 'mock_user_owner_sarah', 'client', '10000000-0000-4000-8000-000000000007', 'penalty.override', '{"estimatedTaxLiabilityCents":15000000}', '{"estimatedTaxLiabilityCents":18500000}', 'Updated from partner-provided K-1 workpaper.', 'iphash_demo_4', 'uahash_demo_4', CAST(unixepoch('2026-05-01 09:35:00') * 1000 AS INTEGER)),
  ('60000000-0000-4000-8000-000000000007', 'mock_firm_brightline', 'mock_user_owner_sarah', 'member_invitation', 'mock_invitation_pending_ops', 'member.invited', NULL, '{"email":"ops.lead@duedatehq.test","role":"manager"}', NULL, 'iphash_demo_4', 'uahash_demo_4', CAST(unixepoch('2026-05-01 09:40:00') * 1000 AS INTEGER)),
  ('60000000-0000-4000-8000-000000000008', 'mock_firm_brightline', 'mock_user_owner_sarah', 'audit_evidence_package', '61000000-0000-4000-8000-000000000001', 'export.audit_package.ready', NULL, '{"scope":"firm","fileCount":4}', NULL, 'iphash_demo_4', 'uahash_demo_4', CAST(unixepoch('2026-05-01 09:58:00') * 1000 AS INTEGER)),
  ('60000000-0000-4000-8000-000000000009', 'mock_firm_brightline', 'mock_user_coordinator_jules', 'auth', 'mock_user_coordinator_jules', 'auth.denied', NULL, '{"attemptedAction":"billing.update","allowedRoles":["owner"],"actualRole":"coordinator"}', 'Coordinator attempted owner-only billing action in demo.', 'iphash_demo_5', 'uahash_demo_5', CAST(unixepoch('2026-05-01 10:00:00') * 1000 AS INTEGER)),
  ('60000000-0000-4000-8000-000000000010', 'mock_firm_solo', 'mock_user_owner_sarah', 'firm', 'mock_firm_solo', 'firm.switched', NULL, NULL, NULL, 'iphash_demo_4', 'uahash_demo_4', CAST(unixepoch('2026-05-01 08:55:00') * 1000 AS INTEGER));

INSERT INTO audit_evidence_package
  (id, firm_id, exported_by_user_id, scope, scope_entity_id, range_start, range_end, file_count, file_manifest_json, sha256_hash, r2_key, status, expires_at, failure_reason, created_at, updated_at)
VALUES
  ('61000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'mock_user_owner_sarah', 'firm', NULL, CAST(unixepoch('2026-04-24 00:00:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 10:00:00') * 1000 AS INTEGER), 4, '[{"path":"audit/events.json","bytes":4200},{"path":"evidence/links.json","bytes":3600},{"path":"pulse/applications.json","bytes":2200},{"path":"manifest.json","bytes":900}]', 'mocksha256auditpackage', 'mock/audit/brightline-may-preview.zip', 'ready', CAST(unixepoch('2026-05-08 10:00:00') * 1000 AS INTEGER), NULL, CAST(unixepoch('2026-05-01 09:57:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:58:00') * 1000 AS INTEGER));

INSERT INTO email_outbox
  (id, firm_id, external_id, type, status, payload_json, created_at, sent_at, failed_at, failure_reason)
VALUES
  ('62000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'mock-email-pulse-digest-2026-05-01', 'pulse_digest', 'sent', '{"subject":"Pulse relief applied","alertId":"41000000-0000-4000-8000-000000000002","recipientCount":3}', CAST(unixepoch('2026-05-01 09:31:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:32:00') * 1000 AS INTEGER), NULL, NULL),
  ('62000000-0000-4000-8000-000000000002', 'mock_firm_brightline', 'mock-email-client-reminder-cascade-2026-05-01', 'client_deadline_reminder', 'pending', '{"clientId":"10000000-0000-4000-8000-000000000005","obligationId":"20000000-0000-4000-8000-000000000006"}', CAST(unixepoch('2026-05-01 09:33:00') * 1000 AS INTEGER), NULL, NULL, NULL);

INSERT INTO in_app_notification
  (id, firm_id, user_id, type, entity_type, entity_id, title, body, href, metadata_json, read_at, created_at)
VALUES
  ('63000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'mock_user_owner_sarah', 'deadline_reminder', 'obligation_instance', '20000000-0000-4000-8000-000000000009', 'Lakeview deadline is due today', 'Federal 1065 is due today and carries the highest exposure in the demo queue.', '/workboard?search=Lakeview', '{"severity":"critical"}', NULL, CAST(unixepoch('2026-05-01 09:50:00') * 1000 AS INTEGER)),
  ('63000000-0000-4000-8000-000000000002', 'mock_firm_brightline', 'mock_user_owner_sarah', 'overdue', 'obligation_instance', '20000000-0000-4000-8000-000000000006', 'Cascade is overdue', 'Add liability inputs or assign an owner before sending the reminder.', '/workboard?search=Cascade', '{"severity":"critical"}', NULL, CAST(unixepoch('2026-05-01 09:49:00') * 1000 AS INTEGER)),
  ('63000000-0000-4000-8000-000000000003', 'mock_firm_brightline', 'mock_user_owner_sarah', 'audit_package_ready', 'audit_evidence_package', '61000000-0000-4000-8000-000000000001', 'Audit package is ready', 'The May preview evidence package is ready for owner review.', '/audit', '{"fileCount":4}', CAST(unixepoch('2026-05-01 10:05:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 09:48:00') * 1000 AS INTEGER)),
  ('63000000-0000-4000-8000-000000000004', 'mock_firm_brightline', 'mock_user_preparer_avery', 'client_reminder', 'client', '10000000-0000-4000-8000-000000000005', 'Cascade needs owner assignment', 'This client is unassigned and appears in workload risk.', '/clients?client=10000000-0000-4000-8000-000000000005', '{"assignee":null}', NULL, CAST(unixepoch('2026-05-01 09:47:00') * 1000 AS INTEGER));

INSERT INTO notification_preference
  (id, firm_id, user_id, email_enabled, in_app_enabled, reminders_enabled, pulse_enabled, unassigned_reminders_enabled, created_at, updated_at)
VALUES
  ('64000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'mock_user_owner_sarah', 1, 1, 1, 1, 1, CAST(unixepoch('2026-05-01 08:30:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:30:00') * 1000 AS INTEGER)),
  ('64000000-0000-4000-8000-000000000002', 'mock_firm_brightline', 'mock_user_preparer_avery', 1, 1, 1, 1, 1, CAST(unixepoch('2026-05-01 08:31:00') * 1000 AS INTEGER), CAST(unixepoch('2026-05-01 08:31:00') * 1000 AS INTEGER));

INSERT INTO reminder
  (id, firm_id, obligation_instance_id, client_id, recipient_kind, recipient_user_id, recipient_email, channel, offset_days, scheduled_for, status, email_outbox_id, notification_id, dedupe_key, sent_at, clicked_at, failure_reason, created_at)
VALUES
  ('65000000-0000-4000-8000-000000000001', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000007', 'member', 'mock_user_owner_sarah', NULL, 'in_app', 0, '2026-05-01', 'sent', NULL, '63000000-0000-4000-8000-000000000001', 'mock_firm_brightline:20000000-0000-4000-8000-000000000009:owner:0:in_app', CAST(unixepoch('2026-05-01 09:50:00') * 1000 AS INTEGER), NULL, NULL, CAST(unixepoch('2026-05-01 09:45:00') * 1000 AS INTEGER)),
  ('65000000-0000-4000-8000-000000000002', 'mock_firm_brightline', '20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', 'client', NULL, 'owner@cascadeflorist.test', 'email', 1, '2026-04-28', 'queued', '62000000-0000-4000-8000-000000000002', NULL, 'mock_firm_brightline:20000000-0000-4000-8000-000000000006:client:1:email', NULL, NULL, NULL, CAST(unixepoch('2026-05-01 09:44:00') * 1000 AS INTEGER));

INSERT INTO client_email_suppression
  (id, firm_id, email, token_hash, reason, created_at)
VALUES
  ('66000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'old-contact@cascadeflorist.test', 'mock_token_hash_old_client', 'manual', CAST(unixepoch('2026-05-01 08:35:00') * 1000 AS INTEGER));

INSERT INTO llm_log
  (id, firm_id, user_id, prompt_version, model, input_hash, input_tokens, output_tokens, latency_ms, cost_usd, guard_result, refusal_code, success, error_msg, created_at)
VALUES
  ('67000000-0000-4000-8000-000000000001', 'mock_firm_brightline', 'mock_user_owner_sarah', 'dashboard-brief@v1', 'openai/gpt-5-mini', 'mockhash-dashboard-2026-05-01', 1840, 188, 1180, 0.014, 'allowed', NULL, 1, NULL, CAST(unixepoch('2026-05-01 09:55:00') * 1000 AS INTEGER)),
  ('67000000-0000-4000-8000-000000000002', 'mock_firm_brightline', 'mock_user_manager_miguel', 'pulse-extract@v1', 'openai/gpt-5-mini', 'mockhash-pulse-extract', 1210, 144, 940, 0.009, 'allowed', NULL, 1, NULL, CAST(unixepoch('2026-05-01 07:44:00') * 1000 AS INTEGER));

COMMIT;
