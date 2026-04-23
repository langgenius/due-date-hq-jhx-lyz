import { createBrowserRouter } from 'react-router'

// React Router 7 — library/data mode (NOT framework mode).
// Route files land under src/routes/*.tsx in Phase 0. This empty skeleton keeps the
// boot path valid so `pnpm dev` renders.
export const router = createBrowserRouter([
  {
    path: '/',
    Component: () => null,
  },
])
