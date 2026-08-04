import { NextRequest, NextResponse } from 'next/server'
import { getGmailAuthUrl } from '@/lib/gmail'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'

/**
 * GET /api/auth/gmail
 * Initiate Gmail OAuth flow — returns the Google consent URL
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const authUrl = getGmailAuthUrl(userId)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('GET /api/auth/gmail error:', error)
    return NextResponse.json({ error: 'Failed to initiate Gmail auth' }, { status: 500 })
  }
}
