import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'

import { i18n } from '@/i18n/i18n'

// Stable server error codes that the web surfaces back to users. These strings
// are part of the API contract — keep the keys identical to the literals
// returned by apps/server/src/middleware/*.
const ERROR_MESSAGES: Record<string, MessageDescriptor> = {
  UNAUTHORIZED: msg`You need to sign in to continue.`,
  FORBIDDEN: msg`You don't have permission to perform this action.`,
  RATE_LIMITED: msg`Too many requests. Please try again in a moment.`,
  TENANT_MISSING: msg`Your account isn't linked to a practice yet.`,
  TENANT_MISMATCH: msg`That resource belongs to a different practice.`,
  TENANT_SUSPENDED: msg`Your practice is suspended. Contact support to restore access.`,
  FIRM_FORBIDDEN: msg`You don't have permission to use this practice feature.`,
  MEMBER_FORBIDDEN: msg`Your current role doesn't include this permission.`,
  NOT_FOUND: msg`We couldn't find what you were looking for.`,
  INVALID_REQUEST: msg`The request was invalid. Please review your input and try again.`,
  CONFLICT: msg`This action conflicts with the current state. Refresh and try again.`,
  INTERNAL_SERVER_ERROR: msg`Something went wrong on our side. Please try again shortly.`,
}

// Look up a translated message for a known server error code.
// Returns null for unknown codes so the caller can fall back to the raw text.
export function translateServerErrorCode(code: string | null | undefined): string | null {
  if (!code) return null
  const descriptor = ERROR_MESSAGES[code]
  if (!descriptor) return null
  return i18n._(descriptor)
}
