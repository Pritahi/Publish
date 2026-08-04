// =============================================================================
// NotaryPro - Template-Based Email Parser
// =============================================================================
// Parses signing appointment emails from 16+ known title/signing platforms.
// Uses regex templates with verified/assumed sender classification.
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

  const borrowerMatch = body.match(/(?:Borrower|Signer)[:\s]*(.+)/i)
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

  const borrowerMatch = body.match(/(?:Borrower|Signer|Customer)[:\s]*(.+)/i)
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

  // Generic: try to extract common fields from any signing email
  const dateMatch = body.match(/(?:Date|Signing\s*Date|Appointment\s*Date|Closing\s*Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  if (dateMatch) data.signingDate = dateMatch[1]

  const timeMatch = body.match(/(?:Time|Signing\s*Time|Appointment\s*Time|Closing\s*Time)[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
  if (timeMatch) data.signingTime = timeMatch[1]

  const locMatch = body.match(/(?:Location|Address|Signing\s*Location|Where)[:\s]*(.+?)(?:\n|$)/i)
  if (locMatch) data.location = locMatch[1].trim()

  const feeMatch = body.match(/(?:Fee|Notary\s*Fee|Signing\s*Fee|Travel\s*Fee|Pay)[:\s]*\$?([\d,.]+)/i)
  if (feeMatch) data.fee = parseFloat(feeMatch[1].replace(',', ''))

  const borrowerMatch = body.match(/(?:Borrower|Signer|Customer|Client)[:\s]*(.+)/i)
  if (borrowerMatch) data.signerName = borrowerMatch[1].trim()

  // Try subject for signer name
  if (!data.signerName) {
    const subjectNameMatch = subject.match(/[-–:]\s*([A-Z][a-z]+ [A-Z][a-z]+)/)
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

// ── Main Parsing Function ──

/**
 * Parse a signing appointment email.
 * Tries template match → generic keywords → raw fallback.
 */
export function parseSigningEmail(from: string, subject: string, body: string): ParsedSigning {
  // Extract domain from "From" address
  const domainMatch = from.match(/@([\w.-]+)/)
  if (!domainMatch) {
    return parseGenericSigning(subject, body)
  }
  const senderDomain = domainMatch[1].toLowerCase()

  // Find matching template
  const template = SENDER_TEMPLATES.find((t) =>
    senderDomain.includes(t.domain) || t.domain.includes(senderDomain)
  )

  if (template) {
    const parser = PARSER_MAP[template.parseFunction]
    const result = parser(subject, body)
    result.source = template.name
    result.verified = template.verified
    return result
  }

  // No template match — try generic signing keywords
  if (isSigningRelatedEmail(subject, body)) {
    return parseGenericSigning(subject, body)
  }

  // Not a signing email
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
    rawData: { from, subject },
  }
}

/**
 * Check if an email is likely a signing-related email based on keywords
 */
function isSigningRelatedEmail(subject: string, body: string): boolean {
  const signingKeywords = [
    /signing/i, /notary/i, /closing/i, /appointment/i,
    /loan\s+doc/i, /refinance/i, /heloc/i, /purchase/i,
    /assignment/i, /borrower/i, /signer/i,
  ]
  const text = `${subject} ${body}`
  return signingKeywords.some((regex) => regex.test(text))
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
