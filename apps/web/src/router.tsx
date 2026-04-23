import { createBrowserRouter } from 'react-router'

import { RootLayout } from '@/routes/_layout'
import { RouteErrorBoundary } from '@/routes/error'
import { RouteHydrateFallback } from '@/routes/fallback'

export const router = createBrowserRouter([
  {
    path: '/login',
    HydrateFallback: RouteHydrateFallback,
    ErrorBoundary: RouteErrorBoundary,
    lazy: async () => {
      const { LoginRoute } = await import('@/routes/login')

      return { Component: LoginRoute }
    },
  },
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        index: true,
        HydrateFallback: RouteHydrateFallback,
        lazy: async () => {
          const { DashboardRoute } = await import('@/routes/dashboard')

          return { Component: DashboardRoute }
        },
      },
      {
        path: 'workboard',
        HydrateFallback: RouteHydrateFallback,
        lazy: async () => {
          const { WorkboardRoute } = await import('@/routes/workboard')

          return { Component: WorkboardRoute }
        },
      },
      {
        path: 'settings',
        HydrateFallback: RouteHydrateFallback,
        lazy: async () => {
          const { SettingsRoute } = await import('@/routes/settings')

          return { Component: SettingsRoute }
        },
      },
    ],
  },
])
