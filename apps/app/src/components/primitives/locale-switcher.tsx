import { CheckIcon, GlobeIcon } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'

import { Button } from '@duedatehq/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@duedatehq/ui/components/ui/dropdown-menu'
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@duedatehq/i18n'
import { cn } from '@duedatehq/ui/lib/utils'

import { useLocaleSwitch } from '@/i18n/provider'

interface LocaleSwitcherProps {
  className?: string
  variant?: 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'icon'
  // When true, renders as a square icon button without a text label. Useful in
  // tight headers where space is at a premium.
  iconOnly?: boolean
  align?: 'start' | 'center' | 'end'
}

// Self-contained language picker: globe button → menu of supported locales with
// a check on the active one. Uses the shared `useLocaleSwitch` hook so the
// choice persists and active queries refetch in the new language.
export function LocaleSwitcher({
  className,
  variant = 'outline',
  size = 'sm',
  iconOnly = false,
  align = 'end',
}: LocaleSwitcherProps) {
  const { t } = useLingui()
  const { locale, switchLocale } = useLocaleSwitch()
  const triggerLabel = t`Language`
  const buttonSize = iconOnly ? 'icon' : size

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={variant}
            size={buttonSize}
            aria-label={triggerLabel}
            className={cn(iconOnly && 'rounded-full', className)}
          />
        }
      >
        <GlobeIcon data-icon={iconOnly ? undefined : 'inline-start'} />
        {iconOnly ? null : <span>{LOCALE_LABELS[locale]}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={8} className="w-44">
        {SUPPORTED_LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchLocale(code)}
            aria-checked={locale === code}
            className="flex items-center justify-between"
          >
            <span>{LOCALE_LABELS[code]}</span>
            {locale === code ? <CheckIcon className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
