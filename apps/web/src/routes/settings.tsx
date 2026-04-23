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
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Settings</span>
        <h1 className="text-2xl font-semibold">Workspace defaults</h1>
        <p className="text-sm text-text-secondary">
          Basic controls are in place so form-heavy pages can be composed from the existing UI set.
        </p>
      </div>

      <Card className="rounded-md shadow-none">
        <CardHeader>
          <CardTitle>Firm profile</CardTitle>
          <CardDescription>
            These demo fields are local-only until auth and organization data land.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="firm-name">Firm name</FieldLabel>
              <Input id="firm-name" defaultValue="FileInTime Demo LLP" />
            </Field>
            <Field>
              <FieldLabel htmlFor="region">Default jurisdiction</FieldLabel>
              <Select defaultValue="ny">
                <SelectTrigger id="region" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ny">New York</SelectItem>
                    <SelectItem value="ca">California</SelectItem>
                    <SelectItem value="tx">Texas</SelectItem>
                    <SelectItem value="multi">Multi-state</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal">
              <Switch defaultChecked aria-label="Enable evidence gate" />
              <FieldContent>
                <FieldTitle>Evidence gate</FieldTitle>
                <FieldDescription>
                  Hide recommendations that do not include source metadata.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="rounded-md shadow-none">
        <CardHeader>
          <CardTitle>Notification routing</CardTitle>
          <CardDescription>
            Phase 0 uses email plus in-app toast instead of Web Push.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldLegend>Channels</FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal">
                <Checkbox defaultChecked aria-label="Email digest" />
                <FieldContent>
                  <FieldTitle>Email digest</FieldTitle>
                  <FieldDescription>Daily deadline and Pulse summary for owners.</FieldDescription>
                </FieldContent>
              </Field>
              <Field orientation="horizontal">
                <Checkbox defaultChecked aria-label="In-app toast" />
                <FieldContent>
                  <FieldTitle>In-app toast</FieldTitle>
                  <FieldDescription>
                    Immediate feedback for status changes and failed mutations.
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Field orientation="horizontal" data-disabled="true">
                <Checkbox disabled aria-label="Web Push disabled" />
                <FieldContent>
                  <FieldTitle>Web Push</FieldTitle>
                  <FieldDescription>
                    Deferred until the product has a real-time notification need.
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
