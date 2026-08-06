import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`

export interface GmailEmail {
  id: string
  threadId: string
  from: string
  subject: string
  date: string
  body: string
  snippet: string
}

/**
 * Create an OAuth2 client with the configured credentials
 */
export function getGmailOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI)
}

/**
 * Generate the Google OAuth consent URL
 */
export function getGmailAuthUrl(state: string): string {
  const oauth2Client = getGmailOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
    ],
    prompt: 'consent',
    state,
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function getGmailTokens(code: string) {
  const oauth2Client = getGmailOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Get an authenticated Gmail client using stored tokens
 */
export function getGmailClient(accessToken: string, refreshToken: string): OAuth2Client {
  const oauth2Client = getGmailOAuth2Client()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  return oauth2Client
}

/**
 * Fetch unread emails from inbox.
 *
 * We deliberately fetch from INBOX (not PROMOTIONS/SOCIAL) and exclude
 * common newsletter categories so the parser doesn't waste effort on
 * daily.dev digests, GitHub notifications, etc.
 *
 * The Gmail `q` parameter uses Gmail search syntax. We:
 *   - include `is:unread` (only unread)
 *   - exclude category:promotions, category:social, category:updates,
 *     category:forums, category:reservations
 *   - exclude common newsletter from: addresses
 */
export async function fetchUnreadEmails(
  accessToken: string,
  refreshToken: string,
  maxResults = 20
): Promise<GmailEmail[]> {
  const auth = getGmailClient(accessToken, refreshToken)
  const gmail = google.gmail({ version: 'v1', auth })

  // Build a Gmail search query that excludes obvious newsletters / marketing / social.
  // We still keep the INBOX label so genuine signing emails from title companies
  // (which usually land in the primary inbox) are captured.
  const query = [
    'is:unread',
    'in:inbox',
    '-category:promotions',
    '-category:social',
    '-category:forums',
    '-category:reservations',
    // Exclude common newsletter senders
    '-from:newsletter@',
    '-from:no-reply@',
    '-from:noreply@',
    '-from:daily.dev',
    '-from:github.com',
    '-from:linkedin.com',
    '-from:notifications@',
    '-from:updates@',
  ].join(' ')

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    q: query,
    maxResults,
  })

  if (!listRes.data.messages || listRes.data.messages.length === 0) {
    return []
  }

  const emails: GmailEmail[] = []

  for (const msg of listRes.data.messages) {
    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      })

      const headers = detail.data.payload?.headers || []
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

      // Extract body (prefer text/plain, fall back to text/html)
      let body = ''
      const parts = detail.data.payload?.parts || []
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8')
          break
        }
      }
      if (!body) {
        for (const part of parts) {
          if (part.mimeType === 'text/html' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8')
            break
          }
        }
      }
      if (!body && detail.data.payload?.body?.data) {
        body = Buffer.from(detail.data.payload.body.data, 'base64').toString('utf-8')
      }

      emails.push({
        id: detail.data.id || '',
        threadId: detail.data.threadId || '',
        from: getHeader('From'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        body: body.slice(0, 10000), // Limit body size
        snippet: detail.data.snippet || '',
      })
    } catch (err) {
      console.error(`Failed to fetch email ${msg.id}:`, err)
    }
  }

  return emails
}

/**
 * Mark an email as read
 */
export async function markEmailAsRead(
  accessToken: string,
  refreshToken: string,
  messageId: string
): Promise<void> {
  const auth = getGmailClient(accessToken, refreshToken)
  const gmail = google.gmail({ version: 'v1', auth })

  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  })
}
