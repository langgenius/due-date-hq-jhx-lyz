import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trans, useLingui } from '@lingui/react/macro'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { ClientCreateInputSchema, type ClientCreateInput } from '@duedatehq/contracts'
import { Button } from '@duedatehq/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@duedatehq/ui/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@duedatehq/ui/components/ui/field'
import { Input } from '@duedatehq/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@duedatehq/ui/components/ui/select'
import { Textarea } from '@duedatehq/ui/components/ui/textarea'

import { CLIENT_ENTITY_TYPES, isClientEntityType, type ClientEntityType } from './client-readiness'

type ClientFormValues = {
  name: string
  entityType: ClientEntityType
  ein: string
  state: string
  county: string
  email: string
  assigneeName: string
  notes: string
}

type ClientFormField = keyof ClientFormValues

const defaultClientFormValues: ClientFormValues = {
  name: '',
  entityType: 'llc',
  ein: '',
  state: '',
  county: '',
  email: '',
  assigneeName: '',
  notes: '',
}

function createClientFormSchema(t: ReturnType<typeof useLingui>['t']) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t`Client name is required`),
    entityType: z.enum(CLIENT_ENTITY_TYPES),
    ein: z
      .string()
      .trim()
      .refine((value) => value === '' || /^\d{2}-\d{7}$/.test(value), {
        message: t`Use EIN format ##-#######`,
      }),
    state: z
      .string()
      .trim()
      .refine((value) => value === '' || /^[A-Za-z]{2}$/.test(value), {
        message: t`Use a 2-letter state code`,
      }),
    county: z
      .string()
      .trim()
      .max(120, t`County must be 120 characters or fewer`),
    email: z
      .string()
      .trim()
      .refine((value) => value === '' || z.email().safeParse(value).success, {
        message: t`Enter a valid email address`,
      }),
    assigneeName: z
      .string()
      .trim()
      .max(200, t`Owner must be 200 characters or fewer`),
    notes: z
      .string()
      .trim()
      .max(5000, t`Notes must be 5000 characters or fewer`),
  })
}

function nullableText(value: string): string | null {
  const next = value.trim()
  return next ? next : null
}

function formValuesToInput(values: ClientFormValues): ClientCreateInput {
  return {
    name: values.name.trim(),
    entityType: values.entityType,
    ein: nullableText(values.ein),
    state: nullableText(values.state)?.toUpperCase() ?? null,
    county: nullableText(values.county),
    email: nullableText(values.email),
    assigneeName: nullableText(values.assigneeName),
    notes: nullableText(values.notes),
  }
}

function contractPathToFormField(path: PropertyKey[]): ClientFormField | null {
  const [field] = path
  switch (field) {
    case 'name':
    case 'entityType':
    case 'ein':
    case 'state':
    case 'county':
    case 'email':
    case 'assigneeName':
    case 'notes':
      return field
    default:
      return null
  }
}

export function CreateClientDialog({
  entityLabels,
  isPending,
  onCreate,
}: {
  entityLabels: Record<ClientEntityType, string>
  isPending: boolean
  onCreate: (input: ClientCreateInput, callbacks: { onSuccess: () => void }) => void
}) {
  const { t } = useLingui()
  const [open, setOpen] = useState(false)
  const clientFormSchema = useMemo(() => createClientFormSchema(t), [t])
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultClientFormValues,
  })
  const entityType = form.watch('entityType')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        <PlusIcon data-icon="inline-start" />
        <Trans>New client</Trans>
      </DialogTrigger>
      <DialogContent className="w-[640px] max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>
            <Trans>Create client</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>Add a manual client record to the active firm directory.</Trans>
          </DialogDescription>
        </DialogHeader>
        <form
          className="contents"
          onSubmit={form.handleSubmit((values) => {
            const parsed = ClientCreateInputSchema.safeParse(formValuesToInput(values))
            if (!parsed.success) {
              parsed.error.issues.forEach((issue) => {
                const field = contractPathToFormField(issue.path)
                if (field) form.setError(field, { message: issue.message, type: 'validate' })
              })
              return
            }

            onCreate(parsed.data, {
              onSuccess: () => {
                form.reset(defaultClientFormValues)
                setOpen(false)
              },
            })
          })}
        >
          <FieldGroup className="gap-4">
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <Field>
                <FieldLabel htmlFor="client-name">
                  <Trans>Client name</Trans>
                </FieldLabel>
                <Input
                  id="client-name"
                  aria-invalid={Boolean(form.formState.errors.name)}
                  {...form.register('name')}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>
              <Field>
                <FieldLabel>
                  <Trans>Entity type</Trans>
                </FieldLabel>
                <Select
                  value={entityType}
                  onValueChange={(value) => {
                    if (value && isClientEntityType(value)) {
                      form.setValue('entityType', value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{entityLabels[entityType]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CLIENT_ENTITY_TYPES.map((entity) => (
                        <SelectItem key={entity} value={entity}>
                          {entityLabels[entity]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="client-ein">
                  <Trans>EIN</Trans>
                </FieldLabel>
                <Input
                  id="client-ein"
                  className="font-mono tabular-nums"
                  placeholder="12-3456789"
                  aria-invalid={Boolean(form.formState.errors.ein)}
                  {...form.register('ein')}
                />
                <FieldError errors={[form.formState.errors.ein]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-state">
                  <Trans>State</Trans>
                </FieldLabel>
                <Input
                  id="client-state"
                  className="font-mono uppercase tabular-nums"
                  placeholder="CA"
                  maxLength={2}
                  aria-invalid={Boolean(form.formState.errors.state)}
                  {...form.register('state')}
                />
                <FieldError errors={[form.formState.errors.state]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-county">
                  <Trans>County</Trans>
                </FieldLabel>
                <Input id="client-county" {...form.register('county')} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="client-email">
                  <Trans>Email</Trans>
                </FieldLabel>
                <Input
                  id="client-email"
                  type="email"
                  aria-invalid={Boolean(form.formState.errors.email)}
                  {...form.register('email')}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="client-assignee">
                  <Trans>Owner</Trans>
                </FieldLabel>
                <Input id="client-assignee" {...form.register('assigneeName')} />
                <FieldDescription>
                  <Trans>Free-text for now; Team members wire in Phase 1.</Trans>
                </FieldDescription>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="client-notes">
                <Trans>Notes</Trans>
              </FieldLabel>
              <Textarea id="client-notes" rows={3} {...form.register('notes')} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              <Trans>Cancel</Trans>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t`Creating...` : t`Create client`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
