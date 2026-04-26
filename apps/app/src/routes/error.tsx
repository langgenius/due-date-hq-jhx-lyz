import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { AlertTriangleIcon } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'

import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Button } from '@duedatehq/ui/components/ui/button'
import { translateServerErrorCode } from '@/lib/i18n-error'

function useErrorMessage(error: unknown): string {
  const { t } = useLingui()

  if (isRouteErrorResponse(error)) {
    const translated = translateServerErrorCode(error.statusText)
    return `${error.status} ${translated ?? error.statusText}`
  }

  if (error instanceof Error) {
    const translated = translateServerErrorCode(error.message)
    return translated ?? error.message
  }

  return t`Unexpected route error`
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const message = useErrorMessage(error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-body p-6">
      <div className="flex w-full max-w-[560px] flex-col gap-4">
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>
            <Trans>Route failed</Trans>
          </AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button render={<Link to="/" />}>
          <Trans>Return to dashboard</Trans>
        </Button>
      </div>
    </div>
  )
}
