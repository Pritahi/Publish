'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

/**
 * Client-side NextAuth SessionProvider.
 *
 * Required so that `useSession()` works in any client component
 * (e.g. the login page's "already logged in?" redirect, the sidebar's
 * logout button, etc.).
 *
 * Mounted once at the root layout level.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
