import { NextRequest, NextResponse } from 'next/server'
import { getGmailTokens } from '@/lib/gmail'
import { getDb } from '@/lib/db'

/**
 * GET /api/auth/gmail/callback
 * Gmail OAuth callback — exchanges code for tokens and stores them.
 *
 * UX rules:
 *  - This route runs AFTER the user is already authenticated (the `state`
 *    param carries their userId). So on any failure we MUST send them back
 *    to /email-parsing (where they started the connection), NOT /login.
 *  - We never expose internal error codes (e.g. `gmail_save_failed`) in the
 *    URL. We use a single opaque flag `?gmail=failed` and let the page show
 *    a friendly toast.
 *  - The real error is logged server-side with full context for debugging.
 *  - The only case where we send the user to /login is when there is no
 *    `state` (userId) at all — i.e. they somehow hit this URL without ever
 *    being signed in. In that case we go to /login with NO error param.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const emailParsingUrl = new URL('/email-parsing', requestUrl.origin)
  const loginUrl = new URL('/login', requestUrl.origin)

  try {
    const { searchParams } = requestUrl
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId

    // No session ever existed — go to login silently (no internal code in URL).
    if (!state) {
      console.warn('[gmail/callback] missing state (userId) — redirecting to login')
      return NextResponse.redirect(loginUrl)
    }

    // User was signed in but Google didn't return a code.
    if (!code) {
      console.warn('[gmail/callback] missing OAuth code', { hasState: !!state })
      emailParsingUrl.searchParams.set('gmail', 'failed')
      return NextResponse.redirect(emailParsingUrl)
    }

    // Exchange code for tokens. May throw if Google rejects the code.
    let tokens
    try {
      tokens = await getGmailTokens(code)
    } catch (err) {
      console.error('[gmail/callback] token exchange failed:', err)
      emailParsingUrl.searchParams.set('gmail', 'failed')
      return NextResponse.redirect(emailParsingUrl)
    }

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('[gmail/callback] Google returned incomplete tokens', {
        hasAccess: !!tokens.access_token,
        hasRefresh: !!tokens.refresh_token,
      })
      emailParsingUrl.searchParams.set('gmail', 'failed')
      return NextResponse.redirect(emailParsingUrl)
    }

    const db = getDb()

    const connectionData = {
      user_id: state,
      provider: 'gmail',
      email_address: 'gmail',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      is_active: true,
      last_sync_at: new Date().toISOString(),
    }

    // Delete any existing connection for this user, then insert fresh
    // (avoids PostgREST onConflict cache issues with unique constraint)
    await db.from('email_connections').delete().eq('user_id', state)
    const { error } = await db.from('email_connections').insert(connectionData)

    if (error) {
      // ❗ Gmail save failed — but the user is STILL authenticated.
      //    Do NOT send them to /login. Send them to /email-parsing with
      //    a friendly failure flag. Real error stays in server logs only.
      console.error('[gmail/callback] Supabase insert failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId: state,
      })
      emailParsingUrl.searchParams.set('gmail', 'failed')
      return NextResponse.redirect(emailParsingUrl)
    }

    // Success
    emailParsingUrl.searchParams.set('gmail', 'connected')
    return NextResponse.redirect(emailParsingUrl)
  } catch (error) {
    // Catch-all — never expose internals to the user.
    console.error('[gmail/callback] unexpected error:', error)
    emailParsingUrl.searchParams.set('gmail', 'failed')
    return NextResponse.redirect(emailParsingUrl)
  }
}
