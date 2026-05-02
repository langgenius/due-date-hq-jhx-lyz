import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Loader2Icon, ShieldCheckIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import { Input } from '@duedatehq/ui/components/ui/input'
import { Label } from '@duedatehq/ui/components/ui/label'
import { verifySignInTwoFactor } from '@/lib/auth'

export function TwoFactorRoute() {
  const { t } = useLingui()
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      await verifySignInTwoFactor(code.trim())
      toast.success(t`Two-factor verification complete`)
      await navigate(search.get('redirectTo') || '/', { replace: true })
    } catch (err) {
      toast.error(t`Could not verify the code`, {
        description: err instanceof Error ? err.message : t`Please try again.`,
      })
      setPending(false)
    }
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4" aria-hidden />
            <Trans>Two-factor verification</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Enter the code from your authenticator app.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="two-factor-code">
                <Trans>Verification code</Trans>
              </Label>
              <Input
                id="two-factor-code"
                value={code}
                inputMode="numeric"
                autoComplete="one-time-code"
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={pending || code.trim().length < 6}>
              {pending ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              <Trans>Verify</Trans>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
