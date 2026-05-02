import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trans, useLingui } from '@lingui/react/macro'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  ClientCreateInputSchema,
  type ClientCreateInput,
  type MemberAssigneeOption,
} from '@duedatehq/contracts'
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@duedatehq/ui/components/ui/field'
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

import { orpc } from '@/lib/rpc'

import { CLIENT_ENTITY_TYPES, isClientEntityType, type ClientEntityType } from './client-readiness'

const UNASSIGNED_ASSIGNEE_VALUE = '__unassigned__'

type ClientFormValues = {
  name: string
  entityType: ClientEntityType
  ein: string
  state: string
  county: string
  email: string
  assigneeId: string
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
  assigneeId: '',
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
    assigneeId: z
      .string()
      .trim()
      .max(200, t`Owner selection is invalid`),
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
    assigneeId: nullableText(values.assigneeId),
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
    case 'assigneeId':
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
  const assigneeId = form.watch('assigneeId')
  const assigneesQuery = useQuery({
    ...orpc.members.listAssignable.queryOptions({ input: undefined }),
    enabled: open,
  })
  const assignees = assigneesQuery.data ?? []
  const selectedAssignee = assignees.find((assignee) => assignee.assigneeId === assigneeId) ?? null
  const assigneeSelectValue = assigneeId || UNASSIGNED_ASSIGNEE_VALUE
  const assigneeSelectLabel = selectedAssignee?.name ?? t`Unassigned`

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
            <Trans>Add a manual client record to the active practice directory.</Trans>
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
                <FieldLabel htmlFor="client-assignee-trigger">
                  <Trans>Owner</Trans>
                </FieldLabel>
                <Select
                  value={assigneeSelectValue}
                  onValueChange={(value) => {
                    const nextAssigneeId = value && value !== UNASSIGNED_ASSIGNEE_VALUE ? value : ''
                    form.setValue('assigneeId', nextAssigneeId, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  disabled={assigneesQuery.isLoading || assigneesQuery.isError}
                >
                  <SelectTrigger
                    id="client-assignee-trigger"
                    className="w-full"
                    aria-invalid={Boolean(form.formState.errors.assigneeId)}
                  >
                    <SelectValue>{assigneeSelectLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value={UNASSIGNED_ASSIGNEE_VALUE}>
                        <Trans>Unassigned</Trans>
                      </SelectItem>
                      {assignees.map((assignee) => (
                        <AssigneeSelectItem key={assignee.assigneeId} assignee={assignee} />
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.assigneeId]} />
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

function AssigneeSelectItem({ assignee }: { assignee: MemberAssigneeOption }) {
  return (
    <SelectItem value={assignee.assigneeId}>
      <span className="truncate">{assignee.name}</span>
      <span className="truncate text-xs text-text-tertiary">{assignee.email}</span>
    </SelectItem>
  )
}
