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

    // Store the email connection
    const { error } = await db.from('email_connections').upsert(
      {
        user_id: state,
        provider: 'gmail',
        email_address: tokens.id_token ? 'gmail' : 'gmail', // We'll get the actual email from the token
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        is_active: true,
        last_sync_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      console.error('Failed to store Gmail connection:', error)
      return NextResponse.redirect(new URL('/login?error=gmail_save_failed', request.url))
    }

    // Redirect back to the app settings page
    return NextResponse.redirect(new URL('/?page=settings&gmail=connected', request.url))
  } catch (error) {
    console.error('Gmail callback error:', error)
    return NextResponse.redirect(new URL('/login?error=gmail_callback_failed', request.url))
  }
}
