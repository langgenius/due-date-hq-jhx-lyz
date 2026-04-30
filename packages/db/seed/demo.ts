import { spawnSync } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const NOW = '2026-04-29T00:00:00.000Z'
const USER_ID = 'seed_user_sarah'
const FIRM_ID = 'seed_firm_sarah'
const PULSE_MATCHED_ID = '11111111-1111-4111-8111-111111111111'
const PULSE_APPLIED_ID = '22222222-2222-4222-8222-222222222222'
const ALERT_MATCHED_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ALERT_APPLIED_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const CLIENT_ARBOR_ID = '33333333-3333-4333-8333-333333333333'
const CLIENT_BRIGHT_ID = '44444444-4444-4444-8444-444444444444'
const CLIENT_APPLIED_ID = '55555555-5555-4555-8555-555555555555'
const OBLIGATION_ARBOR_ID = '66666666-6666-4666-8666-666666666666'
const OBLIGATION_BRIGHT_ID = '77777777-7777-4777-8777-777777777777'
const OBLIGATION_APPLIED_ID = '88888888-8888-4888-8888-888888888888'
const APPLICATION_ID = '99999999-9999-4999-8999-999999999999'
const EXCEPTION_RULE_ID = '12121212-1212-4121-8121-121212121212'
const EXCEPTION_APPLICATION_ID = '34343434-3434-4343-8343-343434343434'

function ms(iso: string): number {
  return new Date(iso).getTime()
}

function json(value: unknown): string {
  return sql(JSON.stringify(value))
}

function sql(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function statement(strings: TemplateStringsArray, ...values: Array<string | number>): string {
  let out = ''
  for (let i = 0; i < strings.length; i += 1) {
    out += strings[i]
    const value = values[i]
    if (value !== undefined) out += String(value)
  }
  return out.trim()
}

const sqlText = [
  statement`INSERT OR IGNORE INTO user (id, name, email, email_verified, image, created_at, updated_at)
    VALUES (${sql(USER_ID)}, 'Sarah Demo', 'sarah.demo@duedatehq.test', 1, NULL, ${ms(NOW)}, ${ms(NOW)});`,
  statement`INSERT OR IGNORE INTO organization (id, name, slug, logo, created_at, metadata)
    VALUES (${sql(FIRM_ID)}, 'Sarah Demo CPA', 'sarah-demo-cpa', NULL, ${ms(NOW)}, NULL);`,
  statement`INSERT OR IGNORE INTO member (id, organization_id, user_id, role, created_at, status)
    VALUES ('seed_member_sarah', ${sql(FIRM_ID)}, ${sql(USER_ID)}, 'owner', ${ms(NOW)}, 'active');`,
  statement`INSERT OR IGNORE INTO firm_profile
    (id, name, plan, seat_limit, timezone, owner_user_id, status, created_at, updated_at, deleted_at)
    VALUES (${sql(FIRM_ID)}, 'Sarah Demo CPA', 'firm', 10, 'America/New_York', ${sql(USER_ID)}, 'active', ${ms(NOW)}, ${ms(NOW)}, NULL);`,
  statement`INSERT OR IGNORE INTO client
    (id, firm_id, name, ein, state, county, entity_type, email, notes, assignee_name, migration_batch_id, created_at, updated_at, deleted_at)
    VALUES
    (${sql(CLIENT_ARBOR_ID)}, ${sql(FIRM_ID)}, 'Arbor & Vale LLC', '12-3456789', 'CA', 'Los Angeles', 'llc', NULL, NULL, 'M. Chen', NULL, ${ms(NOW)}, ${ms(NOW)}, NULL),
    (${sql(CLIENT_BRIGHT_ID)}, ${sql(FIRM_ID)}, 'Bright Studio S-Corp', '21-2222222', 'CA', NULL, 's_corp', NULL, NULL, 'A. Rivera', NULL, ${ms(NOW)}, ${ms(NOW)}, NULL),
    (${sql(CLIENT_APPLIED_ID)}, ${sql(FIRM_ID)}, 'Northgate Holdings LLC', '45-3333333', 'CA', 'Alameda', 'llc', NULL, NULL, 'M. Chen', NULL, ${ms(NOW)}, ${ms(NOW)}, NULL);`,
  statement`INSERT OR IGNORE INTO obligation_instance
    (id, firm_id, client_id, tax_type, tax_year, base_due_date, current_due_date, status, migration_batch_id, created_at, updated_at)
    VALUES
    (${sql(OBLIGATION_ARBOR_ID)}, ${sql(FIRM_ID)}, ${sql(CLIENT_ARBOR_ID)}, 'federal_1065', 2026, ${ms('2026-03-15T00:00:00.000Z')}, ${ms('2026-03-15T00:00:00.000Z')}, 'pending', NULL, ${ms(NOW)}, ${ms(NOW)}),
    (${sql(OBLIGATION_BRIGHT_ID)}, ${sql(FIRM_ID)}, ${sql(CLIENT_BRIGHT_ID)}, 'federal_1120s', 2026, ${ms('2026-03-15T00:00:00.000Z')}, ${ms('2026-03-15T00:00:00.000Z')}, 'review', NULL, ${ms(NOW)}, ${ms(NOW)}),
    (${sql(OBLIGATION_APPLIED_ID)}, ${sql(FIRM_ID)}, ${sql(CLIENT_APPLIED_ID)}, 'ca_llc_franchise_min_800', 2026, ${ms('2026-04-15T00:00:00.000Z')}, ${ms('2026-04-15T00:00:00.000Z')}, 'pending', NULL, ${ms(NOW)}, ${ms(NOW)});`,
  statement`INSERT OR IGNORE INTO pulse
    (id, source, source_url, raw_r2_key, published_at, ai_summary, verbatim_quote, parsed_jurisdiction, parsed_counties, parsed_forms, parsed_entity_types, parsed_original_due_date, parsed_new_due_date, parsed_effective_from, confidence, status, reviewed_by, reviewed_at, requires_human_review, is_sample, created_at, updated_at)
    VALUES
    (${sql(PULSE_MATCHED_ID)}, 'IRS Disaster Relief', 'https://www.irs.gov/newsroom/tax-relief-in-disaster-situations', 'demo/pulse/irs-ca-storm-relief.html', ${ms('2026-04-15T17:00:00.000Z')}, 'IRS CA storm relief extends selected filing deadlines for Los Angeles County.', 'Individuals and businesses in Los Angeles County have until October 15, 2026 to file various federal returns.', 'CA', ${json(['Los Angeles'])}, ${json(['federal_1065', 'federal_1120s'])}, ${json(['llc', 's_corp'])}, ${ms('2026-03-15T00:00:00.000Z')}, ${ms('2026-10-15T00:00:00.000Z')}, ${ms('2026-04-15T17:00:00.000Z')}, 0.94, 'approved', ${sql(USER_ID)}, ${ms('2026-04-15T18:00:00.000Z')}, 1, 1, ${ms(NOW)}, ${ms(NOW)}),
    (${sql(PULSE_APPLIED_ID)}, 'CA FTB', 'https://www.ftb.ca.gov/about-ftb/newsroom/index.html', 'demo/pulse/ca-ftb-relief.html', ${ms('2026-04-15T18:00:00.000Z')}, 'CA FTB extends franchise-tax payment deadline for selected counties.', 'The Franchise Tax Board extends the franchise-tax payment due date by 30 days.', 'CA', ${json(['Alameda'])}, ${json(['ca_llc_franchise_min_800'])}, ${json(['llc'])}, ${ms('2026-04-15T00:00:00.000Z')}, ${ms('2026-05-15T00:00:00.000Z')}, ${ms('2026-04-15T18:00:00.000Z')}, 0.92, 'approved', ${sql(USER_ID)}, ${ms('2026-04-15T19:00:00.000Z')}, 1, 1, ${ms(NOW)}, ${ms(NOW)});`,
  statement`INSERT OR IGNORE INTO pulse_firm_alert
    (id, pulse_id, firm_id, status, matched_count, needs_review_count, dismissed_by, dismissed_at, snoozed_until, created_at, updated_at)
    VALUES
    (${sql(ALERT_MATCHED_ID)}, ${sql(PULSE_MATCHED_ID)}, ${sql(FIRM_ID)}, 'matched', 1, 1, NULL, NULL, NULL, ${ms(NOW)}, ${ms(NOW)}),
    (${sql(ALERT_APPLIED_ID)}, ${sql(PULSE_APPLIED_ID)}, ${sql(FIRM_ID)}, 'partially_applied', 0, 0, NULL, NULL, NULL, ${ms(NOW)}, ${ms(NOW)});`,
  statement`INSERT OR IGNORE INTO pulse_application
    (id, pulse_id, obligation_instance_id, client_id, firm_id, applied_by, applied_at, reverted_by, reverted_at, before_due_date, after_due_date)
    VALUES (${sql(APPLICATION_ID)}, ${sql(PULSE_APPLIED_ID)}, ${sql(OBLIGATION_APPLIED_ID)}, ${sql(CLIENT_APPLIED_ID)}, ${sql(FIRM_ID)}, ${sql(USER_ID)}, ${ms(NOW)}, NULL, NULL, ${ms('2026-04-15T00:00:00.000Z')}, ${ms('2026-05-15T00:00:00.000Z')});`,
  statement`INSERT OR IGNORE INTO exception_rule
    (id, firm_id, source_pulse_id, jurisdiction, counties, affected_forms, affected_entity_types, override_type, override_value_json, override_due_date, effective_from, effective_until, status, source_url, verbatim_quote, created_at, updated_at)
    VALUES (${sql(EXCEPTION_RULE_ID)}, ${sql(FIRM_ID)}, ${sql(PULSE_APPLIED_ID)}, 'CA', ${json(['Alameda'])}, ${json(['ca_llc_franchise_min_800'])}, ${json(['llc'])}, 'extend_due_date', ${json({ originalDueDate: '2026-04-15', newDueDate: '2026-05-15' })}, ${ms('2026-05-15T00:00:00.000Z')}, ${ms('2026-04-15T18:00:00.000Z')}, NULL, 'applied', 'https://www.ftb.ca.gov/about-ftb/newsroom/index.html', 'The Franchise Tax Board extends the franchise-tax payment due date by 30 days.', ${ms(NOW)}, ${ms(NOW)});`,
  statement`INSERT OR IGNORE INTO obligation_exception_application
    (id, firm_id, obligation_instance_id, exception_rule_id, applied_at, applied_by_user_id, reverted_at, reverted_by_user_id)
    VALUES (${sql(EXCEPTION_APPLICATION_ID)}, ${sql(FIRM_ID)}, ${sql(OBLIGATION_APPLIED_ID)}, ${sql(EXCEPTION_RULE_ID)}, ${ms(NOW)}, ${sql(USER_ID)}, NULL, NULL);`,
].join('\n')

const result = spawnSync(
  'pnpm',
  [
    '--dir',
    '../../apps/server',
    'exec',
    'wrangler',
    'd1',
    'execute',
    'DB',
    '--local',
    '--config',
    'wrangler.toml',
    '--command',
    sqlText,
  ],
  { cwd: dirname(fileURLToPath(import.meta.url)), stdio: 'inherit' },
)

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log('[seed:demo] Sarah Demo CPA + 2 sample Pulse alerts seeded')
