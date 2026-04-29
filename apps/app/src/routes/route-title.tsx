import { useMatches } from 'react-router'
import { useLingui } from '@lingui/react/macro'

import { formatDocumentTitle, getRouteSummaryMessages } from '@/routes/route-summary'

export function RouteDocumentTitle() {
  const { i18n } = useLingui()
  const matches = useMatches()
  const routeMessages = getRouteSummaryMessages(matches)

  return <title>{formatDocumentTitle(i18n._(routeMessages.title))}</title>
}
