import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { parseSigningEmail, isAutoConfirmable } from '@/lib/email-parser'

/**
 * POST /api/email-parsing/test
 * Dry-run parser: accepts from/subject/body, returns what the parser would
 * extract WITHOUT saving anything to the database. Used by the in-app
 * "Test Parser" feature on the Email Parsing page.
 *
 * Body: { from: string, subject: string, body: string }
 * Returns: { parsed: ParsedSigning, autoConfirmable: boolean, detected: boolean, explanation: string }
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()
    const { from, subject, body: emailBody } = body

    if (!from || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: from, subject, body' },
        { status: 400 }
      )
    }

    const parsed = parseSigningEmail(from, subject, emailBody)
    const autoConfirmable = isAutoConfirmable(parsed)

    // Helpful explanation for the user
    let explanation = ''
    const detected = parsed.source !== 'unknown'

    if (!detected) {
      const reason = (parsed.rawData as { skipReason?: string })?.skipReason
      if (reason === 'sender_blocklisted') {
        explanation =
          'Sender domain is on the blocklist (newsletter / marketing / social). Not classified as a signing.'
      } else if (reason === 'weak_signals') {
        explanation =
          'Sender is unknown and the email did not contain enough strong signing keywords. Add phrases like "notary signing", "loan signing", "borrower name", "signing appointment", plus a date and a fee.'
      } else if (reason === 'strong_signals_no_data') {
        explanation =
          'Email had strong signing keywords but no structured data (date, fee, or borrower name) could be extracted. Make sure to include "Signing Date: MM/DD/YYYY" and "Fee: $XXX".'
      } else if (reason === 'insufficient_extracted_fields') {
        explanation =
          'Sender is unknown and only one field was extracted. For unknown senders, at least 2 fields (name + date, date + fee, etc.) are required.'
      } else if (reason === 'known_sender_no_data') {
        explanation =
          'Sender is a known signing service, but no structured data (date, fee, borrower) was extracted. Check that the email follows the typical signing-request format.'
      } else {
        explanation = 'Not classified as a signing.'
      }
    } else {
      explanation = `Detected as a signing from ${parsed.source}. ${
        autoConfirmable
          ? 'Auto-confirmed because all required fields were extracted from a verified sender.'
          : 'Pending review — confirm manually from the Detected Signings list.'
      }`
    }

    return NextResponse.json({
      parsed,
      autoConfirmable,
      detected,
      explanation,
    })
  } catch (error) {
    console.error('POST /api/email-parsing/test error:', error)
    return NextResponse.json({ error: 'Failed to test parser' }, { status: 500 })
  }
}
