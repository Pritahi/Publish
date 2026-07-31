import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Get the authenticated user's ID from the session.
 * Returns null if no session exists.
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return (session.user as { id?: string }).id ?? null
}

/**
 * Require authentication in an API route handler.
 * Returns the userId if authenticated, or a 401 NextResponse if not.
 */
export async function requireAuth(): Promise<{ userId: string } | NextResponse> {
  const userId = await getAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  return { userId }
}

/**
 * Require admin role in an API route handler.
 * Returns the userId and role if admin, or a 403 NextResponse if not.
 */
export async function requireAdmin(): Promise<{ userId: string; role: string } | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const role = (session.user as { role?: string }).role ?? 'user'
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  return { userId: (session.user as { id?: string }).id!, role }
}
