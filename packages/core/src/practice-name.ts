/**
 * Pure helpers for deriving the user-visible practice name + slug shown on
 * the first-login onboarding page.
 *
 * Naming layer (PRD §3.6.1.0):
 *   - Engineering identifier:  firmId / organization.id / firm_profile.id (unchanged)
 *   - User-visible default EN: "Practice"
 *   - User-visible mgmt EN:    "Firm"
 *   - User-visible ZH:         事务所 (unified)
 *
 * Function naming follows the user-visible default ("practice") because the
 * string this module produces shows up directly in the onboarding form.
 *
 * No runtime / infrastructure deps — packages/core is pure TS.
 */

const PUBLIC_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'qq.com',
  '163.com',
  '126.com',
  'foxmail.com',
  'sina.com',
  'sina.cn',
])

/** Tokens that should stay all-caps after Title-Casing (CPA, LLC, ...). */
const ACRONYM_UPPERCASE: ReadonlySet<string> = new Set([
  'cpa',
  'ea',
  'llp',
  'llc',
  'pllc',
  'inc',
  'pc',
  'pa',
  'sc',
])

/**
 * Strip the conventional public TLD tail. Handles common compound TLDs like
 * `.co.uk` and `.com.cn`. Anything more exotic falls through and gets
 * Title-Cased as-is, which is acceptable for an editable default.
 */
function stripPublicTld(domainRoot: string): string {
  return domainRoot.replace(
    /\.(?:com|net|org|io|co|us|cn|uk|ca|au|nz|de|fr|jp|in)(?:\.[a-z]{2})?$/i,
    '',
  )
}

function titleCaseToken(token: string): string {
  if (!token) return token
  if (ACRONYM_UPPERCASE.has(token.toLowerCase())) return token.toUpperCase()
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
}

function titleCase(input: string): string {
  return input
    .split(/[\s\-_.]+/)
    .filter(Boolean)
    .map(titleCaseToken)
    .join(' ')
}

export interface DerivePracticeNameInput {
  name?: string | null
  email?: string | null
}

/**
 * Returns a non-empty, submittable name for the onboarding form.
 *
 * Resolution order:
 *   1. Custom domain → Title-Cased domain root with acronym uppercase
 *      (e.g. `bright-cpa.com` → `Bright CPA`).
 *   2. Display name from the OAuth profile (e.g. `Alex Chen`).
 *      Intentionally NO `'s Practice` / `'s Firm` suffix — the system-
 *      cobbled tone is what the reviewer flagged.
 *   3. Caller-injected `fallback` (i18n localized, e.g. `My Practice` /
 *      `我的事务所`). Required so the function never returns an empty
 *      string the user could submit and trip `organization.name notNull`.
 */
export function derivePracticeName(input: DerivePracticeNameInput, fallback: string): string {
  const domain = input.email?.split('@')[1]?.toLowerCase().trim()
  if (domain && !PUBLIC_EMAIL_DOMAINS.has(domain)) {
    const root = stripPublicTld(domain)
    if (root.length >= 3) {
      const cased = titleCase(root)
      if (cased.length > 0) return cased
    }
  }
  const display = input.name?.trim()
  if (display) return display
  return fallback
}

/**
 * URL-safe slug + 6-char random suffix to dodge organization.slug uniqueness
 * collisions across users without a DB pre-check round-trip.
 *
 * Suffix uses a base-32 subset stripped of visually ambiguous chars
 * (0/O/1/I/L) so support copy-paste stays unambiguous.
 *
 * Collision math: 28^6 ≈ 4.8e8 — safe given organizationLimit:1 (one slug
 * per user per family). The onboarding submit catches the rare slug-clash
 * (DB unique violation) and retries once with a fresh suffix.
 */
const SUFFIX_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // 31 chars, sans 0/o/1/i/l
const SUFFIX_LEN = 6

function randomSuffix(): string {
  // crypto.getRandomValues is a Web standard available in Workers, browsers,
  // and Node ≥ 19. Avoiding Math.random keeps the suffix uniformly distributed.
  const bytes = new Uint8Array(SUFFIX_LEN)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const byte of bytes) {
    out += SUFFIX_ALPHABET[byte % SUFFIX_ALPHABET.length]
  }
  return out
}

function slugifyBody(name: string): string {
  const lower = name
    .normalize('NFKD')
    // Drop combining marks (accents) — standard slug normalization.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return lower
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) // bound the body so the final slug stays readable
}

export function slugifyPracticeName(name: string): string {
  const body = slugifyBody(name) || 'practice'
  return `${body}-${randomSuffix()}`
}
