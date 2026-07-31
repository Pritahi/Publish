import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'

// Telegram Bot Token — must be set via TELEGRAM_BOT_TOKEN env variable
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

// POST /api/telegram/notify
// This API sends a Telegram message.
// Requires authentication. Uses server bot token by default, fallback to user-provided botToken.
// Body: { chatId: string, message: string, botToken?: string, parseMode?: 'HTML' | 'Markdown' }
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request, { windowMs: 60_000, maxRequests: 10 })
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()
    const { chatId, message, botToken: clientBotToken, parseMode = 'HTML' } = body

    // Only allow server bot token; ignore client-provided token to prevent abuse
    const botToken = BOT_TOKEN

    if (!botToken) {
      return NextResponse.json(
        { error: 'No server bot token configured. Set TELEGRAM_BOT_TOKEN in .env.' },
        { status: 400 }
      )
    }

    if (!chatId || !message) {
      return NextResponse.json({ error: 'chatId and message are required' }, { status: 400 })
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      }),
    })

    const data = await response.json()

    if (data.ok) {
      return NextResponse.json({
        success: true,
        messageId: data.result?.message_id,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        { error: data.description || 'Telegram API error', errorCode: data.error_code },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Telegram notify error:', error)
    return NextResponse.json({ error: 'Failed to send Telegram message' }, { status: 500 })
  }
}

// GET /api/telegram/notify?token=<bot_token>
// Validates the server bot token by calling getMe
// Requires authentication
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const token = BOT_TOKEN

    if (!token) {
      return NextResponse.json({ valid: false, error: 'No server bot token configured' })
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const data = await response.json()

    if (data.ok) {
      return NextResponse.json({
        valid: true,
        bot: {
          id: data.result.id,
          name: data.result.first_name,
          username: data.result.username,
        },
      })
    } else {
      return NextResponse.json({ valid: false, error: data.description })
    }
  } catch {
    return NextResponse.json({ valid: false, error: 'Failed to validate token' })
  }
}
