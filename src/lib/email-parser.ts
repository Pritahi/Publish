// =============================================================================
// NotaryPro - Template-Based Email Parser
// =============================================================================
// Parses signing appointment emails from 16+ known title/signing platforms.
// Uses regex templates with verified/assumed sender classification.
//
// STRICT MODE: Unknown senders are only considered a "signing" if the email
// contains STRONG multi-keyword signals AND extracted structured data
// (date + fee, or borrower name + date). Generic newsletters / digests
// from daily.dev, github, linkedin, etc. are explicitly skipped.
// =============================================================================

export interface SenderTemplate {
  domain: string
  name: string
  verified: boolean
  parseFunction: 'parseSnapDocs' | 'parseSigningOrder' | 'parseSignatureClosers' | 'parseAmrock' | 'parseGenericSigning'
}

export interface ParsedSigning {
  clientName: string | null
  signingDate: string | null
  signingTime: string | null
  location: string | null
  serviceType: string | null
  fee: number | null
  signerName: string | null
  source: string
  verified: boolean
  rawData: Record<string, unknown>
}

// ── Sender Templates (16 platforms) ──

const SENDER_TEMPLATES: SenderTemplate[] = [
  // Verified senders (we have tested parsers for these)
  { domain: 'signatureclosers.com', name: 'Signature Closers', verified: true, parseFunction: 'parseSignatureClosers' },
  { domain: 'c2csignings.com', name: 'C2C Signings', verified: true, parseFunction: 'parseSignatureClosers' },
  { domain: 'amrock.com', name: 'Amrock (Title Source)', verified: true, parseFunction: 'parseAmrock' },
  { domain: 'bancserv.net', name: 'BancServ', verified: true, parseFunction: 'parseGenericSigning' },
  { domain: 'notaryassist.com', name: 'NotaryAssist', verified: true, parseFunction: 'parseGenericSigning' },

  // Assumed senders (likely work but not tested)
  { domain: 'snapdocs.com', name: 'SnapDocs', verified: false, parseFunction: 'parseSnapDocs' },
  { domain: 'signingorder.com', name: 'SigningOrder', verified: false, parseFunction: 'parseSigningOrder' },
  { domain: 'servicelink.com', name: 'ServiceLink', verified: false, parseFunction: 'parseGenericSigning' },
  { domain: 'firstam.com', name: 'First American', verified: false, parseFunction: 'parseGenericSigning' },
  { domain: 'notarygo.com', name: 'NotaryGo', verified: false, parseFunction: 'parseGenericSigning' },
  { domain: 'pavaso.com', name: 'Pavaso', verified: false, parseFunction: 'parseGenericSigning' },
  { domain: 'titleresources.com', name: 'Title Resources', verified: false, parseFunction: 'parseGenericSigning' },
  { domain: 'guarantytitle.com', name: 'Guaranty Title', verified: false, parseFunction: 'parseGenericSigning' },
  { domain: 'northwesttitles.com', name: 'Northwest Title', verified: false, parseFunction: 'parseGenericSigning' },
  { domain: 'inspectoramericas.com', name: 'Inspector Americas', verified: false, parseFunction: 'parseGenericSigning' },
  { domain: 'lsi.visionnet.com', name: 'LSI/VisionNet', verified: false, parseFunction: 'parseGenericSigning' },
]

// ── Blocklist: known newsletter / marketing / social senders ──
// Emails from these domains are NEVER classified as signing emails.
const SENDER_BLOCKLIST = [
  'daily.dev',
  'github.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'reddit.com',
  'medium.com',
  'dev.to',
  'hashnode.com',
  'substack.com',
  'mailchimp.com',
  'sendgrid.net',
  'newsletter',
  'noreply',
  'no-reply',
  'notifications',
  'updates@',
  'news@',
  'digest@',
  'team@',
  'hello@',
  'welcome@',
  'info@',
  'support@',
  'admin@',
  'billing@',
  'amazon.com',
  'aws.amazon.com',
  'google.com',
  'microsoft.com',
  'apple.com',
  'stripe.com',
  'paypal.com',
  'vercel.com',
  'netlify.com',
  'cloudflare.com',
  'heroku.com',
  'digitalocean.com',
  'aliexpress.com',
  'amazon.in',
  'flipkart.com',
  'myntra.com',
  'swiggy.com',
  'zomato.com',
  'paytm.com',
  'phonepe.com',
  'razorpay.com',
  'cricbuzz.com',
  'hotstar.com',
  'netflix.com',
  'spotify.com',
  'youtube.com',
  'quora.com',
  'pinterest.com',
  'tumblr.com',
  'discord.com',
  'slack.com',
  'zoom.us',
  'teams.microsoft.com',
  'atlassian.com',
  'trello.com',
  'asana.com',
  'notion.so',
  'figma.com',
]

// ── Platform-Specific Parsers ──

function parseSnapDocs(subject: string, body: string): ParsedSigning {
  const data: Record<string, unknown> = {}

  // SnapDocs: "New Signing Request - [Borrower Name] - [Address]"
  const subjectMatch = subject.match(/New Signing Request\s*[-–]\s*(.+?)\s*[-–]\s*(.+)/i)
  if (subjectMatch) {
    data.signerName = subjectMatch[1].trim()
    data.location = subjectMatch[2].trim()
  }

  // Date patterns: "Signing Date: MM/DD/YYYY" or "Appointment: ..."
  const dateMatch = body.match(/(?:Signing\s*Date|Appointment\s*Date|Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  if (dateMatch) data.signingDate = dateMatch[1]

  const timeMatch = body.match(/(?:Signing\s*Time|Appointment\s*Time|Time)[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  if (timeMatch) data.signingTime = timeMatch[1]

  const feeMatch = body.match(/(?:Notary\s*Fee|Signing\s*Fee|Fee|Travel\s*Fee)[:\s]*\$?([\d,.]+)/i)
  if (feeMatch) data.fee = parseFloat(feeMatch[1].replace(',', ''))

  const borrowerMatch = body.match(/(?:Borrower|Signer)[:\s]*([A-Z][a-z]+ [A-Z][a-z]+)/)
  if (borrowerMatch && !data.signerName) data.signerName = borrowerMatch[1].trim()

  return {
    clientName: (data.signerName as string) || null,
    signingDate: (data.signingDate as string) || null,
    signingTime: (data.signingTime as string) || null,
    location: (data.location as string) || null,
    serviceType: 'Loan Signing',
    fee: (data.fee as number) || null,
    signerName: (data.signerName as string) || null,
    source: 'snapdocs',
    verified: false,
    rawData: data,
  }
}

function parseSigningOrder(subject: string, body: string): ParsedSigning {
  const data: Record<string, unknown> = {}

  // SigningOrder: "Signing Appointment - [Borrower] - [Date]"
  const subjectMatch = subject.match(/Signing\s+Appointment\s*[-–]\s*(.+?)(?:\s*[-–]\s*(.+))?$/i)
  if (subjectMatch) {
    data.signerName = subjectMatch[1].trim()
    if (subjectMatch[2]) data.signingDate = subjectMatch[2].trim()
  }

  const dateMatch = body.match(/(?:Date|Signing\s*Date|Appt\.?\s*Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  if (dateMatch) data.signingDate = dateMatch[1]

  const timeMatch = body.match(/(?:Time|Signing\s*Time|Appt\.?\s*Time)[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  if (timeMatch) data.signingTime = timeMatch[1]

  const locMatch = body.match(/(?:Location|Address|Signing\s*Location)[:\s]*(.+?)(?:\n|$)/i)
  if (locMatch) data.location = locMatch[1].trim()

  const feeMatch = body.match(/(?:Fee|Notary\s*Fee|Signing\s*Fee)[:\s]*\$?([\d,.]+)/i)
  if (feeMatch) data.fee = parseFloat(feeMatch[1].replace(',', ''))

  return {
    clientName: (data.signerName as string) || null,
    signingDate: (data.signingDate as string) || null,
    signingTime: (data.signingTime as string) || null,
    location: (data.location as string) || null,
    serviceType: 'Loan Signing',
    fee: (data.fee as number) || null,
    signerName: (data.signerName as string) || null,
    source: 'signingorder',
    verified: false,
    rawData: data,
  }
}

function parseSignatureClosers(subject: string, body: string): ParsedSigning {
  const data: Record<string, unknown> = {}

  // Signature Closers / C2C: "Assignment: [Borrower] - [Type]"
  const subjectMatch = subject.match(/Assignment[:\s]*(.+?)(?:\s*[-–]\s*(.+))?$/i)
  if (subjectMatch) {
    data.signerName = subjectMatch[1].trim()
    if (subjectMatch[2]) data.serviceType = subjectMatch[2].trim()
  }

  const dateMatch = body.match(/(?:Appointment|Signing|Closing)\s*Date[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  if (dateMatch) data.signingDate = dateMatch[1]

  const timeMatch = body.match(/(?:Appointment|Signing|Closing)\s*Time[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  if (timeMatch) data.signingTime = timeMatch[1]

  const locMatch = body.match(/(?:Signing\s*Location|Address|Where)[:\s]*(.+?)(?:\n|$)/i)
  if (locMatch) data.location = locMatch[1].trim()

  const feeMatch = body.match(/(?:Notary\s*Fee|Signing\s*Fee|Fee)[:\s]*\$?([\d,.]+)/i)
  if (feeMatch) data.fee = parseFloat(feeMatch[1].replace(',', ''))

  const borrowerMatch = body.match(/(?:Borrower|Signer|Customer)[:\s]*([A-Z][a-z]+ [A-Z][a-z]+)/)
  if (borrowerMatch && !data.signerName) data.signerName = borrowerMatch[1].trim()

  return {
    clientName: (data.signerName as string) || null,
    signingDate: (data.signingDate as string) || null,
    signingTime: (data.signingTime as string) || null,
    location: (data.location as string) || null,
    serviceType: (data.serviceType as string) || 'Loan Signing',
    fee: (data.fee as number) || null,
    signerName: (data.signerName as string) || null,
    source: 'signatureclosers',
    verified: true,
    rawData: data,
  }
}

function parseAmrock(subject: string, body: string): ParsedSigning {
  const data: Record<string, unknown> = {}

  // Amrock: "Closing Assignment - [Borrower]" or "Notary Assignment"
  const subjectMatch = subject.match(/(?:Closing|Notary)\s*Assignment\s*[-–:]\s*(.+)/i)
  if (subjectMatch) data.signerName = subjectMatch[1].trim()

  const dateMatch = body.match(/(?:Closing|Signing|Appointment)\s*Date[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  if (dateMatch) data.signingDate = dateMatch[1]

  const timeMatch = body.match(/(?:Closing|Signing|Appointment)\s*Time[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  if (timeMatch) data.signingTime = timeMatch[1]

  const locMatch = body.match(/(?:Closing|Signing)\s*(?:Location|Address)[:\s]*(.+?)(?:\n|$)/i)
  if (locMatch) data.location = locMatch[1].trim()

  const feeMatch = body.match(/(?:Notary|Signing|Travel)\s*Fee[:\s]*\$?([\d,.]+)/i)
  if (feeMatch) data.fee = parseFloat(feeMatch[1].replace(',', ''))

  return {
    clientName: (data.signerName as string) || null,
    signingDate: (data.signingDate as string) || null,
    signingTime: (data.signingTime as string) || null,
    location: (data.location as string) || null,
    serviceType: 'Real Estate Closing',
    fee: (data.fee as number) || null,
    signerName: (data.signerName as string) || null,
    source: 'amrock',
    verified: true,
    rawData: data,
  }
}

function parseGenericSigning(subject: string, body: string): ParsedSigning {
  const data: Record<string, unknown> = {}

  // Generic: try to extract common fields from any signing email.
  // NOTE: This parser is only invoked when caller has already confirmed
  // the email is signing-related (known domain OR strong keyword signals).
  const dateMatch = body.match(/(?:Date|Signing\s*Date|Appointment\s*Date|Closing\s*Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  if (dateMatch) data.signingDate = dateMatch[1]

  const timeMatch = body.match(/(?:Time|Signing\s*Time|Appointment\s*Time|Closing\s*Time)[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  if (timeMatch) data.signingTime = timeMatch[1]

  const locMatch = body.match(/(?:Location|Address|Signing\s*Location|Where)[:\s]*(.+?)(?:\n|$)/i)
  if (locMatch) data.location = locMatch[1].trim()

  const feeMatch = body.match(/(?:Fee|Notary\s*Fee|Signing\s*Fee|Travel\s*Fee|Pay)[:\s]*\$?([\d,.]+)/i)
  if (feeMatch) data.fee = parseFloat(feeMatch[1].replace(',', ''))

  // Only accept a borrower name if it looks like a real human name
  // (two capitalized words, no URLs, no special chars)
  const borrowerMatch = body.match(/(?:Borrower|Signer|Customer|Client)\s*[:\-]\s*([A-Z][a-z]+ [A-Z][a-z]+)(?!\S)/)
  if (borrowerMatch) data.signerName = borrowerMatch[1].trim()

  // Try subject for signer name (only if subject is short and looks like a name)
  if (!data.signerName) {
    const subjectNameMatch = subject.match(/[-–:]\s*([A-Z][a-z]+ [A-Z][a-z]+)\s*$/)
    if (subjectNameMatch) data.signerName = subjectNameMatch[1].trim()
  }

  return {
    clientName: (data.signerName as string) || null,
    signingDate: (data.signingDate as string) || null,
    signingTime: (data.signingTime as string) || null,
    location: (data.location as string) || null,
    serviceType: 'General Notary',
    fee: (data.fee as number) || null,
    signerName: (data.signerName as string) || null,
    source: 'generic',
    verified: false,
    rawData: data,
  }
}

// ── Parser Lookup ──

const PARSER_MAP: Record<string, (subject: string, body: string) => ParsedSigning> = {
  parseSnapDocs,
  parseSigningOrder,
  parseSignatureClosers,
  parseAmrock,
  parseGenericSigning,
}

// ── Helper: extract domain from "From" header ──

function extractDomain(from: string): string | null {
  const m = from.match(/@([\w.-]+)/)
  return m ? m[1].toLowerCase() : null
}

// ── Helper: check sender against blocklist ──

function isSenderBlocklisted(from: string): boolean {
  const fromLower = from.toLowerCase()
  // Check email substrings
  for (const blocked of SENDER_BLOCKLIST) {
    if (blocked.includes('@')) {
      if (fromLower.includes(blocked)) return true
    } else if (blocked.includes('.')) {
      // Domain — check if it appears after @
      const domain = extractDomain(from)
      if (domain && (domain === blocked || domain.endsWith(`.${blocked}`))) return true
    } else {
      // Keyword — check if it appears in the local part (before @)
      const localMatch = fromLower.match(/^"?([a-z0-9._+-]+)"?\s*<:/)
      const localPart = fromLower.split('@')[0]
      if (localPart && localPart.includes(blocked)) return true
    }
  }
  return false
}

// ── Main Parsing Function ──

/**
 * Parse a signing appointment email.
 *
 * Decision tree (STRICT):
 * 1. If sender is on blocklist (newsletter / marketing / social) → NOT a signing.
 * 2. If sender matches a known notary/title template → parse with that template.
 * 3. If sender is unknown → require STRONG multi-signal match:
 *    - At least 2 specific signing keywords (notary + signing, or closing + borrower, etc.)
 *    - AND structured data extracted (date OR fee)
 *    Otherwise → NOT a signing.
 */
export function parseSigningEmail(from: string, subject: string, body: string): ParsedSigning {
  const senderDomain = extractDomain(from)

  // ── Step 1: Blocklist check ──
  if (isSenderBlocklisted(from)) {
    return notASigning(from, subject, 'sender_blocklisted')
  }

  // ── Step 2: Known notary/title template match ──
  if (senderDomain) {
    const template = SENDER_TEMPLATES.find((t) =>
      senderDomain.includes(t.domain) || t.domain.includes(senderDomain)
    )
    if (template) {
      const parser = PARSER_MAP[template.parseFunction]
      const result = parser(subject, body)
      result.source = template.name
      result.verified = template.verified
      // Even for known senders, require at least one extracted field
      if (!result.clientName && !result.signingDate && !result.fee) {
        return notASigning(from, subject, 'known_sender_no_data')
      }
      return result
    }
  }

  // ── Step 3: Unknown sender — require STRONG multi-signal match ──
  const signalScore = scoreSigningSignals(subject, body)
  if (signalScore < 3) {
    return notASigning(from, subject, 'weak_signals')
  }

  // Strong signal match — parse generically, but require extracted data
  const parsed = parseGenericSigning(subject, body)
  if (!parsed.clientName && !parsed.signingDate && !parsed.fee) {
    return notASigning(from, subject, 'strong_signals_no_data')
  }

  // Require at least 2 extracted fields for unknown senders
  const extractedCount = [
    parsed.clientName,
    parsed.signingDate,
    parsed.signingTime,
    parsed.location,
    parsed.fee,
  ].filter(Boolean).length
  if (extractedCount < 2) {
    return notASigning(from, subject, 'insufficient_extracted_fields')
  }

  parsed.source = 'generic'
  parsed.verified = false
  return parsed
}

// ── Empty / "not a signing" result ──

function notASigning(from: string, subject: string, reason: string): ParsedSigning {
  return {
    clientName: null,
    signingDate: null,
    signingTime: null,
    location: null,
    serviceType: null,
    fee: null,
    signerName: null,
    source: 'unknown',
    verified: false,
    rawData: { from, subject, skipReason: reason },
  }
}

/**
 * Score how strongly an email looks like a notary signing.
 *
 * Strong keywords (2 points each):
 *   - "notary signing", "loan signing", "closing appointment"
 *   - "borrower name", "signer name"
 *   - "title company", "title source"
 *   - "refinance closing", "heloc closing"
 *
 * Weak keywords (1 point each):
 *   - "signing", "notary", "closing", "appointment", "borrower", "signer"
 *
 * Date/fee patterns (1 point each, capped at 2):
 *   - "MM/DD/YYYY" date pattern
 *   - "$XX" fee pattern
 *
 * Threshold: 3+ points to be considered a signing email.
 */
function scoreSigningSignals(subject: string, body: string): number {
  const text = `${subject}\n${body}`.toLowerCase()
  let score = 0

  // Strong multi-word phrases (2 points each)
  const strongPhrases = [
    'notary signing', 'loan signing', 'closing appointment',
    'signing appointment', 'closing assignment', 'notary assignment',
    'borrower name', 'signer name', 'title company', 'title source',
    'refinance closing', 'heloc closing', 'loan document signing',
    'notary fee', 'signing fee', 'closing fee', 'travel fee',
    'signing service', 'notary service', 'signing request',
    'closing disclosure', 'loan estimate', 'deed of trust',
    'promissory note', 'hud settlement',
  ]
  for (const phrase of strongPhrases) {
    if (text.includes(phrase)) score += 2
  }

  // Weak single keywords (1 point each, max 2 from this category)
  const weakKeywords = ['signing', 'notary', 'closing', 'borrower', 'signer', 'refinance', 'heloc']
  let weakCount = 0
  for (const kw of weakKeywords) {
    if (text.includes(kw)) weakCount++
  }
  score += Math.min(weakCount, 2)

  // Date pattern (1 point)
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) score += 1
  // Fee pattern (1 point)
  if (/\$\s*\d{2,3}/.test(text)) score += 1

  return score
}

/**
 * Check if a parsed signing has enough data to auto-create a signing entry
 */
export function isAutoConfirmable(parsed: ParsedSigning): boolean {
  return !!(
    parsed.clientName &&
    parsed.signingDate &&
    parsed.location &&
    parsed.verified
  )
}

/**
 * Check if a sender address is from a verified template
 */
export function isSenderVerified(from: string): boolean {
  const domainMatch = from.match(/@([\w.-]+)/)
  if (!domainMatch) return false
  const senderDomain = domainMatch[1].toLowerCase()
  const template = SENDER_TEMPLATES.find((t) =>
    senderDomain.includes(t.domain) || t.domain.includes(senderDomain)
  )
  return template?.verified ?? false
}

/**
 * Get all known sender information for UI display
 */
export function getKnownSenders(): SenderTemplate[] {
  return SENDER_TEMPLATES
}
