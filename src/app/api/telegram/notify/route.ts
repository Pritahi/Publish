import { NextRequest, NextResponse } from 'next/server'

// Telegram Bot Token — must be set via TELEGRAM_BOT_TOKEN env variable
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

// POST /api/telegram/notify
// This API sends a Telegram message.
// Uses server bot token by default, fallback to client-provided botToken
// Body: { chatId: string, message: string, botToken?: string, parseMode?: 'HTML' | 'Markdown' }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chatId, message, botToken: clientBotToken, parseMode = 'HTML' } = body

    // Use server bot token by default, fallback to client-provided token
    const botToken = clientBotToken || BOT_TOKEN

    if (!botToken) {
      return NextResponse.json(
        { error: 'No bot token configured. Set TELEGRAM_BOT_TOKEN in .env or provide botToken in request.' },
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
      // Log notification for history
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
// Validates a bot token by calling getMe
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') || BOT_TOKEN

    if (!token) {
      return NextResponse.json({ valid: false, error: 'No token provided' })
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
