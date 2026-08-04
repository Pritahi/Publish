import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toCamelCaseArr } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'

/**
 * GET /api/email-connections
 * List all email connections for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const db = getDb()
    const { data, error } = await db
      .from('email_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch email connections:', error)
      return NextResponse.json({ error: 'Failed to fetch email connections' }, { status: 500 })
    }

    // Don't expose tokens in the response
    const safeData = (data || []).map((conn) => {
      const camel = toCamelCaseObj(conn)
      return {
        ...camel,
        accessToken: undefined,
        refreshToken: undefined,
        hasConnection: true,
      }
    })

    return NextResponse.json({ data: safeData })
  } catch (error) {
    console.error('GET /api/email-connections error:', error)
    return NextResponse.json({ error: 'Failed to fetch email connections' }, { status: 500 })
  }
}

/**
 * DELETE /api/email-connections
 * Disconnect an email connection
 */
export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const db = getDb()

    // Verify ownership
    const { data: existing } = await db
      .from('email_connections')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const { error } = await db.from('email_connections').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete email connection:', error)
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/email-connections error:', error)
    return NextResponse.json({ error: 'Failed to delete email connection' }, { status: 500 })
  }
}
