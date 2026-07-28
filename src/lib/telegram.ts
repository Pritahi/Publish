// Telegram notification system
// Supports server env token or user-provided token (fallback)

export type NotificationType =
  | 'new_signing'
  | 'signing_completed'
  | 'signing_cancelled'
  | 'signing_reminder'
  | 'invoice_created'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'expense_added'
  | 'weekly_summary'
  | 'custom'

export interface TelegramNotificationPayload {
  type: NotificationType
  data: {
    clientName?: string
    serviceType?: string
    date?: string
    time?: string
    location?: string
    fee?: number
    invoiceNo?: string
    amount?: number
    description?: string
    category?: string
    customMessage?: string
    weeklyData?: {
      totalRevenue: number
      totalExpenses: number
      signingsCompleted: number
      totalMileage: number
    }
  }
}

export interface NotificationLog {
  id: string
  type: NotificationType
  message: string
  sentAt: string
  success: boolean
  error?: string
}

export interface NotificationPreferences {
  new_signing: boolean
  signing_completed: boolean
  signing_cancelled: boolean
  signing_reminder: boolean
  invoice_created: boolean
  invoice_paid: boolean
  invoice_overdue: boolean
  expense_added: boolean
  weekly_summary: boolean
}

export const defaultPreferences: NotificationPreferences = {
  new_signing: true,
  signing_completed: true,
  signing_cancelled: false,
  signing_reminder: true,
  invoice_created: true,
  invoice_paid: true,
  invoice_overdue: true,
  expense_added: false,
  weekly_summary: true,
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

function buildMessage(payload: TelegramNotificationPayload): string {
  const { type, data } = payload

  switch (type) {
    case 'new_signing':
      return `📅 <b>New Signing Scheduled</b>\n\n` +
        `👤 Client: <b>${data.clientName || 'N/A'}</b>\n` +
        `📋 Service: ${data.serviceType || 'N/A'}\n` +
        `🗓️ Date: ${data.date ? formatDate(data.date) : 'N/A'}${data.time ? ` at ${formatTime(data.time)}` : ''}\n` +
        `📍 Location: ${data.location || 'N/A'}\n` +
        `💰 Fee: ${data.fee ? formatCurrency(data.fee) : 'N/A'}`

    case 'signing_completed':
      return `✅ <b>Signing Completed</b>\n\n` +
        `👤 Client: <b>${data.clientName || 'N/A'}</b>\n` +
        `📋 Service: ${data.serviceType || 'N/A'}\n` +
        `🗓️ Date: ${data.date ? formatDate(data.date) : 'N/A'}\n` +
        `💰 Fee: ${data.fee ? formatCurrency(data.fee) : 'N/A'}`

    case 'signing_cancelled':
      return `❌ <b>Signing Cancelled</b>\n\n` +
        `👤 Client: <b>${data.clientName || 'N/A'}</b>\n` +
        `📋 Service: ${data.serviceType || 'N/A'}\n` +
        `🗓️ Date: ${data.date ? formatDate(data.date) : 'N/A'}`

    case 'signing_reminder':
      return `⏰ <b>Signing Reminder</b>\n\n` +
        `👤 Client: <b>${data.clientName || 'N/A'}</b>\n` +
        `📋 Service: ${data.serviceType || 'N/A'}\n` +
        `🗓️ Date: ${data.date ? formatDate(data.date) : 'N/A'}${data.time ? ` at ${formatTime(data.time)}` : ''}\n` +
        `📍 ${data.location || 'N/A'}\n\n` +
        `🔔 This signing is coming up soon!`

    case 'invoice_created':
      return `🧾 <b>New Invoice Created</b>\n\n` +
        `🧾 Invoice: <b>${data.invoiceNo || 'N/A'}</b>\n` +
        `👤 Client: ${data.clientName || 'N/A'}\n` +
        `💵 Amount: <b>${data.amount ? formatCurrency(data.amount) : 'N/A'}</b>`

    case 'invoice_paid':
      return `💚 <b>Payment Received!</b>\n\n` +
        `🧾 Invoice: <b>${data.invoiceNo || 'N/A'}</b>\n` +
        `👤 Client: ${data.clientName || 'N/A'}\n` +
        `💵 Amount: <b>${data.amount ? formatCurrency(data.amount) : 'N/A'}</b>\n` +
        `📅 Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`

    case 'invoice_overdue':
      return `⚠️ <b>Overdue Invoice Alert</b>\n\n` +
        `🧾 Invoice: <b>${data.invoiceNo || 'N/A'}</b>\n` +
        `👤 Client: ${data.clientName || 'N/A'}\n` +
        `💵 Amount: <b>${data.amount ? formatCurrency(data.amount) : 'N/A'}</b>\n` +
        `❗ Action required — please follow up with the client.`

    case 'expense_added':
      return `💳 <b>Expense Recorded</b>\n\n` +
        `📋 ${data.description || 'N/A'}\n` +
        `📁 Category: ${data.category || 'N/A'}\n` +
        `💵 Amount: ${data.amount ? formatCurrency(data.amount) : 'N/A'}\n` +
        `📅 Date: ${data.date ? formatDate(data.date) : new Date().toLocaleDateString('en-US')}`

    case 'weekly_summary':
      if (data.weeklyData) {
        const d = data.weeklyData
        const profit = d.totalRevenue - d.totalExpenses
        return `📊 <b>Weekly Business Summary</b>\n\n` +
          `✅ Signings Completed: <b>${d.signingsCompleted}</b>\n` +
          `💰 Revenue: <b>${formatCurrency(d.totalRevenue)}</b>\n` +
          `💸 Expenses: ${formatCurrency(d.totalExpenses)}\n` +
          `📈 Net Profit: <b>${formatCurrency(profit)}</b>\n` +
          `🚗 Total Mileage: ${d.totalMileage} miles\n\n` +
          `Keep up the great work! 💪`
      }
      return '📊 Weekly Summary'

    case 'custom':
      return data.customMessage || 'Notification'

    default:
      return 'Notification from NotaryPro'
  }
}

// Get notification type label for display
export function getNotificationLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    new_signing: 'New Signing',
    signing_completed: 'Signing Completed',
    signing_cancelled: 'Signing Cancelled',
    signing_reminder: 'Signing Reminder',
    invoice_created: 'Invoice Created',
    invoice_paid: 'Payment Received',
    invoice_overdue: 'Overdue Alert',
    expense_added: 'Expense Added',
    weekly_summary: 'Weekly Summary',
    custom: 'Custom',
  }
  return labels[type] || type
}

// Get notification type emoji
export function getNotificationEmoji(type: NotificationType): string {
  const emojis: Record<NotificationType, string> = {
    new_signing: '📅',
    signing_completed: '✅',
    signing_cancelled: '❌',
    signing_reminder: '⏰',
    invoice_created: '🧾',
    invoice_paid: '💚',
    invoice_overdue: '⚠️',
    expense_added: '💳',
    weekly_summary: '📊',
    custom: '📢',
  }
  return emojis[type] || '📢'
}

// Log a notification to localStorage history
function logNotification(type: NotificationType, message: string, success: boolean, error?: string) {
  try {
    const key = 'notarypro-notification-log'
    const existing: NotificationLog[] = JSON.parse(localStorage.getItem(key) || '[]')
    const entry: NotificationLog = {
      id: crypto.randomUUID(),
      type,
      message,
      sentAt: new Date().toISOString(),
      success,
      error,
    }
    // Keep last 100 notifications
    const updated = [entry, ...existing].slice(0, 100)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch {
    // Silently fail
  }
}

// Get notification history from localStorage
export function getNotificationHistory(): NotificationLog[] {
  try {
    const key = 'notarypro-notification-log'
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

// Clear notification history
export function clearNotificationHistory() {
  try {
    localStorage.removeItem('notarypro-notification-log')
  } catch {}
}

// Send a Telegram notification
// Reads config from localStorage on the client side
export async function sendTelegramNotification(payload: TelegramNotificationPayload): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    const stored = localStorage.getItem('notarypro-telegram')
    if (!stored) return false

    const config = JSON.parse(stored)
    if (!config.enabled || !config.chatId) return false

    // Check if this notification type is enabled in preferences
    const prefs: NotificationPreferences = JSON.parse(
      localStorage.getItem('notarypro-notification-prefs') || JSON.stringify(defaultPreferences)
    )
    if (!prefs[payload.type]) return false

    const message = buildMessage(payload)

    const res = await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: config.chatId,
        // Only send botToken if user has a custom one (no server token)
        botToken: config.botToken || undefined,
        message,
      }),
    })

    const data = await res.json()
    const success = data.success === true
    logNotification(payload.type, message, success, !success ? (data.error || 'Unknown error') : undefined)
    return success
  } catch (error) {
    logNotification(payload.type, buildMessage(payload), false, String(error))
    return false
  }
}

// Validate a bot token by calling the API
export async function validateBotToken(token: string): Promise<{ valid: boolean; bot?: { name: string; username: string }; error?: string }> {
  try {
    const res = await fetch(`/api/telegram/notify?token=${encodeURIComponent(token)}`)
    const data = await res.json()
    if (data.valid && data.bot) {
      return { valid: true, bot: { name: data.bot.name, username: data.bot.username } }
    }
    return { valid: false, error: data.error || 'Invalid token' }
  } catch {
    return { valid: false, error: 'Failed to validate' }
  }
}
