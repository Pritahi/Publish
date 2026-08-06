import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toCamelCaseArr } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { fetchUnreadEmails, markEmailAsRead } from '@/lib/gmail'
import { parseSigningEmail, isAutoConfirmable } from '@/lib/email-parser'

/**
 * GET /api/email-parsing
 * List all parsed signings for the user
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const db = getDb()

    let query = db
      .from('parsed_signings')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to fetch parsed signings:', error)
      return NextResponse.json({ error: 'Failed to fetch parsed signings' }, { status: 500 })
    }

    const result = toCamelCaseArr(data || [])

    return NextResponse.json({ data: result, total: count || 0, page, limit })
  } catch (error) {
    console.error('GET /api/email-parsing error:', error)
    return NextResponse.json({ error: 'Failed to fetch parsed signings' }, { status: 500 })
  }
}

/**
 * POST /api/email-parsing
 * Sync emails and parse new signings
 * Body: { action: 'sync' } | { action: 'confirm', id: string, signingData: {...} }
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const body = await request.json()
    const action = body.action || 'sync'

    const db = getDb()

    if (action === 'sync') {
      // ── Sync: Fetch unread emails, parse, and store ──
      // Get active email connection
      const { data: connection, error: connError } = await db
        .from('email_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (connError || !connection) {
        return NextResponse.json(
          { error: 'No active email connection. Please connect your Gmail first.' },
          { status: 400 }
        )
      }

      // Fetch unread emails
      const emails = await fetchUnreadEmails(
        connection.access_token,
        connection.refresh_token,
        20
      )

      const parsedResults = []

      for (const email of emails) {
        // Parse the email (strict — returns source='unknown' with null fields
        // for emails that don't look like notary signings)
        const parsed = parseSigningEmail(email.from, email.subject, email.body)

        // Skip emails that the parser classified as "not a signing".
        // `source === 'unknown'` means it was either blocklisted or failed
        // the strong-signal threshold.
        if (parsed.source === 'unknown') {
          continue
        }

        // Defensive double-check: require at least one extracted field
        if (!parsed.clientName && !parsed.signingDate && !parsed.fee) {
          continue
        }

        // Check if we already parsed this email
        const { data: existing } = await db
          .from('parsed_signings')
          .select('id')
          .eq('email_id', email.id)
          .eq('user_id', userId)
          .single()

        if (existing) continue // Already parsed

        // Store the parsed signing
        const insertData = {
          user_id: userId,
          email_id: email.id,
          email_from: email.from,
          email_subject: email.subject,
          email_date: new Date(email.date).toISOString(),
          client_name: parsed.clientName,
          signing_date: parsed.signingDate,
          signing_time: parsed.signingTime,
          location: parsed.location,
          service_type: parsed.serviceType,
          fee: parsed.fee,
          status: isAutoConfirmable(parsed) ? 'Auto-Confirmed' : 'Pending',
          source: parsed.source,
          verified: parsed.verified,
          raw_data: parsed.rawData,
        }

        const { data: newParsed, error: insertError } = await db
          .from('parsed_signings')
          .insert(insertData)
          .select()
          .single()

        if (insertError) {
          console.error('Failed to insert parsed signing:', insertError)
          continue
        }

        parsedResults.push(toCamelCaseObj(newParsed))

        // Mark email as read in Gmail
        try {
          await markEmailAsRead(connection.access_token, connection.refresh_token, email.id)
        } catch (e) {
          console.error('Failed to mark email as read:', e)
        }
      }

      // Update last_sync_at
      await db
        .from('email_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connection.id)

      return NextResponse.json({
        success: true,
        synced: parsedResults.length,
        data: parsedResults,
      })
    }

    if (action === 'confirm') {
      // ── Confirm: Convert a parsed signing into an actual signing ──
      const { id } = body
      if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 })
      }

      // Get the parsed signing
      const { data: parsedSigning, error: psError } = await db
        .from('parsed_signings')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (psError || !parsedSigning) {
        return NextResponse.json({ error: 'Parsed signing not found' }, { status: 404 })
      }

      const signingData = body.signingData || {}

      // Find or create the client
      const clientName = signingData.clientName || parsedSigning.client_name
      let clientId = signingData.clientId

      if (!clientId && clientName) {
        // Try to find existing client by name
        const { data: existingClient } = await db
          .from('clients')
          .select('id')
          .eq('user_id', userId)
          .ilike('name', clientName)
          .limit(1)
          .single()

        if (existingClient) {
          clientId = existingClient.id
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await db
            .from('clients')
            .insert({ user_id: userId, name: clientName })
            .select('id')
            .single()

          if (clientError || !newClient) {
            return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
          }
          clientId = newClient.id
        }
      }

      if (!clientId) {
        return NextResponse.json({ error: 'Client is required' }, { status: 400 })
      }

      // Create the signing
      const { data: signing, error: signingError } = await db
        .from('signings')
        .insert({
          user_id: userId,
          client_id: clientId,
          date: signingData.signingDate || parsedSigning.signing_date || new Date().toISOString(),
          time: signingData.signingTime || parsedSigning.signing_time || null,
          location: signingData.location || parsedSigning.location || 'TBD',
          service_type: signingData.serviceType || parsedSigning.service_type || 'General Notary',
          fee: signingData.fee || parsedSigning.fee || 0,
          status: 'Scheduled',
          notes: `From email: ${parsedSigning.email_subject}`,
        })
        .select('*, clients(id, name, email, phone)')
        .single()

      if (signingError || !signing) {
        return NextResponse.json({ error: 'Failed to create signing' }, { status: 500 })
      }

      // Update parsed signing status
      await db
        .from('parsed_signings')
        .update({
          status: 'Confirmed',
          signing_id: signing.id,
        })
        .eq('id', id)

      return NextResponse.json({
        success: true,
        signing: toCamelCaseObj(signing),
      })
    }

    if (action === 'dismiss') {
      // ── Dismiss: Mark a parsed signing as dismissed ──
      const { id } = body
      if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 })
      }

      const { error } = await db
        .from('parsed_signings')
        .update({ status: 'Dismissed' })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        return NextResponse.json({ error: 'Failed to dismiss' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action. Use: sync, confirm, dismiss' }, { status: 400 })
  } catch (error) {
    console.error('POST /api/email-parsing error:', error)
    return NextResponse.json({ error: 'Failed to process email parsing' }, { status: 500 })
  }
}
