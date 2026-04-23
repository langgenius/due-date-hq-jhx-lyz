import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { AlertTriangleIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected route error'
}

export function RouteErrorBoundary() {
  const error = useRouteError()

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas p-6">
      <div className="flex w-full max-w-[560px] flex-col gap-4">
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Route failed</AlertTitle>
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
        <Button render={<Link to="/" />}>Return to dashboard</Button>
      </div>
    </div>
  )
}
