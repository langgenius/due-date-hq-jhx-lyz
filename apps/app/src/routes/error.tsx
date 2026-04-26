import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { AlertTriangleIcon } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'

import { Alert, AlertDescription, AlertTitle } from '@duedatehq/ui/components/ui/alert'
import { Button } from '@duedatehq/ui/components/ui/button'
import { translateServerErrorCode } from '@/lib/i18n-error'

function useErrorCopy(error: unknown): { title: string; message: string } {
  const { t } = useLingui()

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        title: t`Page not found`,
        message: t`We couldn't find what you were looking for.`,
      }
    }

    const translated = translateServerErrorCode(error.statusText)
    return {
      title: t`Route failed`,
      message: `${error.status} ${translated ?? error.statusText}`,
    }
  }

  if (error instanceof Error) {
    const translated = translateServerErrorCode(error.message)
    return {
      title: t`Route failed`,
      message: translated ?? error.message,
    }
  }

  return {
    title: t`Route failed`,
    message: t`Unexpected route error`,
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const { title, message } = useErrorCopy(error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-body p-6">
      <div className="flex w-full max-w-[560px] flex-col gap-4">
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button render={<Link to="/" />}>
          <Trans>Return to dashboard</Trans>
        </Button>
      </div>
    </div>
  )
}
