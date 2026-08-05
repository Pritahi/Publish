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
 * Fetch unread emails from inbox
 */
export async function fetchUnreadEmails(
  accessToken: string,
  refreshToken: string,
  maxResults = 20
): Promise<GmailEmail[]> {
  const auth = getGmailClient(accessToken, refreshToken)
  const gmail = google.gmail({ version: 'v1', auth })

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    labelIds: ['INBOX'],
    q: 'is:unread',
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
