import { Trans, useLingui } from '@lingui/react/macro'

import { Checkbox } from '@duedatehq/ui/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@duedatehq/ui/components/ui/field'
import { Input } from '@duedatehq/ui/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@duedatehq/ui/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'
import { Switch } from '@duedatehq/ui/components/ui/switch'

export function SettingsRoute() {
  const { t } = useLingui()
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          <Trans>Settings</Trans>
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold leading-tight text-text-primary">
            <Trans>Firm settings</Trans>
          </h1>
          <p className="max-w-[720px] text-md text-text-secondary">
            <Trans>
              Basic controls are in place so form-heavy pages can be composed from the existing UI
              set.
            </Trans>
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>
            <Trans>Practice profile</Trans>
          </CardTitle>
          <CardDescription>
            <Trans>These demo fields are local-only until auth and organization data land.</Trans>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="practice-name">
                <Trans>Practice name</Trans>
              </FieldLabel>
              {/* TODO: wire to organization.update + firm_profile read; see plan §6 / §10.1 */}
              <Input id="practice-name" defaultValue="FileInTime Demo LLP" />
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

      <Card>
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
