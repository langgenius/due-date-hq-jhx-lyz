import { Trans, useLingui } from '@lingui/react/macro'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export function SettingsRoute() {
  const { t } = useLingui()
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          <Trans>Settings</Trans>
        </span>
        <h1 className="text-2xl font-semibold">
          <Trans>Workspace defaults</Trans>
        </h1>
        <p className="text-sm text-text-secondary">
          <Trans>
            Basic controls are in place so form-heavy pages can be composed from the existing UI
            set.
          </Trans>
        </p>
      </div>

      <Card className="rounded-md shadow-none">
        <CardHeader>
          <CardTitle>
            <Trans>Firm profile</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>These demo fields are local-only until auth and organization data land.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="firm-name">
                <Trans>Firm name</Trans>
              </FieldLabel>
              <Input id="firm-name" defaultValue="FileInTime Demo LLP" />
            </Field>
            <Field>
              <FieldLabel htmlFor="region">
                <Trans>Default jurisdiction</Trans>
              </FieldLabel>
              <Select defaultValue="ny">
                <SelectTrigger id="region" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ny">New York</SelectItem>
                    <SelectItem value="ca">California</SelectItem>
                    <SelectItem value="tx">Texas</SelectItem>
                    <SelectItem value="multi">{t`Multi-state`}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal">
              <Switch defaultChecked aria-label={t`Enable evidence gate`} />
              <FieldContent>
                <FieldTitle>
                  <Trans>Evidence gate</Trans>
                </FieldTitle>
                <FieldDescription>
                  <Trans>Hide recommendations that do not include source metadata.</Trans>
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="rounded-md shadow-none">
        <CardHeader>
          <CardTitle>
            <Trans>Notification routing</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>Phase 0 uses email plus in-app toast instead of Web Push.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldLegend>
              <Trans>Channels</Trans>
            </FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal">
                <Checkbox defaultChecked aria-label={t`Email digest`} />
                <FieldContent>
                  <FieldTitle>
                    <Trans>Email digest</Trans>
                  </FieldTitle>
                  <FieldDescription>
                    <Trans>Daily deadline and Pulse summary for owners.</Trans>
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Field orientation="horizontal">
                <Checkbox defaultChecked aria-label={t`In-app toast`} />
                <FieldContent>
                  <FieldTitle>
                    <Trans>In-app toast</Trans>
                  </FieldTitle>
                  <FieldDescription>
                    <Trans>Immediate feedback for status changes and failed mutations.</Trans>
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Field orientation="horizontal" data-disabled="true">
                <Checkbox disabled aria-label={t`Web Push disabled`} />
                <FieldContent>
                  <FieldTitle>
                    <Trans>Web Push</Trans>
                  </FieldTitle>
                  <FieldDescription>
                    <Trans>Deferred until the product has a real-time notification need.</Trans>
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>
    </div>
  )
}
