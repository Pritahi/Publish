import { NextRequest, NextResponse } from 'next/server'
import { getGmailTokens } from '@/lib/gmail'
import { getDb } from '@/lib/db'

/**
 * GET /api/auth/gmail/callback
 * Gmail OAuth callback — exchanges code for tokens and stores them
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId

    if (!code || !state) {
      return NextResponse.redirect(new URL('/login?error=gmail_auth_failed', request.url))
    }

    const tokens = await getGmailTokens(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL('/login?error=gmail_no_tokens', request.url))
    }

    const db = getDb()

    const connectionData = {
      user_id: state,
      provider: 'gmail',
      email_address: 'gmail',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      is_active: true,
      last_sync_at: new Date().toISOString(),
    }

    // Delete any existing connection for this user, then insert fresh
    // (avoids PostgREST onConflict cache issues with unique constraint)
    await db.from('email_connections').delete().eq('user_id', state)
    const { error } = await db.from('email_connections').insert(connectionData)

    if (error) {
      console.error('Failed to store Gmail connection:', error)
      return NextResponse.redirect(new URL('/login?error=gmail_save_failed', request.url))
    }

    // Redirect back to the app email-parsing page with success indicator
    return NextResponse.redirect(new URL('/email-parsing?gmail=connected', request.url))
  } catch (error) {
    console.error('Gmail callback error:', error)
    return NextResponse.redirect(new URL('/login?error=gmail_callback_failed', request.url))
  }
}
