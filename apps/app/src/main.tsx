import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@duedatehq/ui/components/ui/sonner'
import { TooltipProvider } from '@duedatehq/ui/components/ui/tooltip'
import { bootstrapI18n } from '@/i18n/bootstrap'
import { AppI18nProvider } from '@/i18n/provider'
import { createAppRouter } from './router'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false },
  },
})

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

bootstrapI18n()
const router = createAppRouter()

createRoot(rootEl).render(
  <StrictMode>
    <AppI18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AppI18nProvider>
  </StrictMode>,
)

// PWA / Service Worker / Web Push intentionally omitted for Phase 0
// (docs/dev-file/00 §7 · /05 §8).
