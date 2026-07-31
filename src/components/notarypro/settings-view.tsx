/**
 * SettingsView — Application settings including Telegram notification
 * configuration, notification preferences, and data management.
 */
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Building2,
  Database,
  Info,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bell,
  Shield,
} from 'lucide-react'
import { DataBackup } from './data-backup'
import { toast } from 'sonner'
import {
  type NotificationPreferences,
  type NotificationLog,
  defaultPreferences,
  getNotificationLabel,
  getNotificationEmoji,
  getNotificationHistory,
  clearNotificationHistory,
  validateBotToken,
} from '@/lib/telegram'

interface ProfileData {
  businessName: string
  commissionNumber: string
  state: string
  phone: string
  email: string
  commissionExpiry: string
}

interface TelegramConfig {
  enabled: boolean
  chatId: string
  botToken: string // Optional - for custom bot (fallback)
  useCustomBot: boolean
}

const defaultProfile: ProfileData = {
  businessName: 'My Notary Business',
  commissionNumber: '',
  state: '',
  phone: '',
  email: '',
  commissionExpiry: '',
}

const defaultTelegram: TelegramConfig = {
  enabled: false,
  chatId: '',
  botToken: '',
  useCustomBot: false,
}

export default function SettingsView() {
  const [profile, setProfile] = useState<ProfileData>(() => {
    if (typeof window === 'undefined') return defaultProfile
    try {
      const stored = localStorage.getItem('notarypro-profile')
      if (stored) return JSON.parse(stored) as ProfileData
    } catch {}
    return defaultProfile
  })

  const [telegram, setTelegram] = useState<TelegramConfig>(() => {
    if (typeof window === 'undefined') return defaultTelegram
    try {
      const stored = localStorage.getItem('notarypro-telegram')
      if (stored) return { ...defaultTelegram, ...JSON.parse(stored) } as TelegramConfig
    } catch {}
    return defaultTelegram
  })

  const [prefs, setPrefs] = useState<NotificationPreferences>(() => {
    if (typeof window === 'undefined') return defaultPreferences
    try {
      const stored = localStorage.getItem('notarypro-notification-prefs')
      if (stored) return { ...defaultPreferences, ...JSON.parse(stored) }
    } catch {}
    return defaultPreferences
  })

  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [botInfo, setBotInfo] = useState<{ name: string; username: string } | null>(null)
  const [showCustomBot, setShowCustomBot] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [notifHistory, setNotifHistory] = useState<NotificationLog[]>([])

  const isConnected = telegram.enabled && telegram.chatId

  const handleSave = () => {
    localStorage.setItem('notarypro-profile', JSON.stringify(profile))
    localStorage.setItem('notarypro-telegram', JSON.stringify(telegram))
    localStorage.setItem('notarypro-notification-prefs', JSON.stringify(prefs))
    setSaved(true)
    toast.success('Settings saved')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setProfile(defaultProfile)
    setTelegram(defaultTelegram)
    setPrefs(defaultPreferences)
    setBotInfo(null)
    localStorage.removeItem('notarypro-profile')
    localStorage.removeItem('notarypro-telegram')
    localStorage.removeItem('notarypro-notification-prefs')
    toast.info('Settings reset to defaults')
  }

  const handleGetChatId = () => {
    // Copy the URL for the user to get their Chat ID
    const url = 'https://t.me/BotFather'
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
    }
    toast.success('Tip: Search @userinfobot on Telegram, send /start — it will show your Chat ID')
  }

  const handleValidateToken = async () => {
    if (!telegram.botToken) {
      toast.error('Enter a bot token first')
      return
    }
    setValidating(true)
    const result = await validateBotToken(telegram.botToken)
    if (result.valid && result.bot) {
      setBotInfo(result.bot)
      toast.success(`Connected to @${result.bot.username}`)
    } else {
      setBotInfo(null)
      toast.error(result.error || 'Invalid token')
    }
    setValidating(false)
  }

  const handleTestTelegram = async () => {
    if (!telegram.chatId) {
      toast.error('Chat ID is required')
      return
    }
    setTesting(true)
    try {
      const res = await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: telegram.chatId,
          botToken: telegram.useCustomBot ? telegram.botToken : undefined,
          message: `✅ <b>NotaryPro</b> — Telegram Connected!\n\n` +
            `🤖 Your bot is working correctly.\n` +
            `📅 ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n` +
            `You will now receive notifications for:\n` +
            `• New signings scheduled\n` +
            `• Signing completions\n` +
            `• Invoice created & payments\n` +
            `• Overdue invoice alerts\n` +
            `• Weekly business summary`,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Test message sent! Check your Telegram.')
      } else {
        toast.error(data.error || 'Failed to send. Check your Chat ID.')
      }
    } catch {
      toast.error('Failed to send test message')
    } finally {
      setTesting(false)
    }
  }

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleShowHistory = () => {
    setNotifHistory(getNotificationHistory())
    setShowHistory(!showHistory)
  }

  const handleClearHistory = () => {
    clearNotificationHistory()
    setNotifHistory([])
    toast.success('Notification history cleared')
  }

  const prefItems: { key: keyof NotificationPreferences; icon: string }[] = [
    { key: 'new_signing', icon: '📅' },
    { key: 'signing_completed', icon: '✅' },
    { key: 'signing_cancelled', icon: '❌' },
    { key: 'signing_reminder', icon: '⏰' },
    { key: 'invoice_created', icon: '🧾' },
    { key: 'invoice_paid', icon: '💚' },
    { key: 'invoice_overdue', icon: '⚠️' },
    { key: 'expense_added', icon: '💳' },
    { key: 'weekly_summary', icon: '📊' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your business profile and application preferences</p>
      </div>

      {/* Business Profile */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            Business Profile
          </CardTitle>
          <CardDescription>
            Your notary business information used across the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                placeholder="My Notary Business"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission-number">Commission Number</Label>
              <Input
                id="commission-number"
                value={profile.commissionNumber}
                onChange={(e) => setProfile({ ...profile, commissionNumber: e.target.value })}
                placeholder="Notary commission #"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                placeholder="e.g. California"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="notary@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission-expiry">Commission Expiry Date</Label>
              <Input
                id="commission-expiry"
                type="date"
                value={profile.commissionExpiry}
                onChange={(e) => setProfile({ ...profile, commissionExpiry: e.target.value })}
              />
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Save className="h-4 w-4" />
              Save All Settings
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            {saved && (
              <span className="text-xs text-emerald-600 font-medium">Saved!</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Telegram Notifications */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            Telegram Notifications
            <Badge variant={isConnected ? 'default' : 'outline'} className={
              isConnected
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]'
                : 'text-[10px]'
            }>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Get instant notifications on Telegram — completely free, no limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tg-enable" className="text-sm font-medium">Enable Notifications</Label>
              <p className="text-xs text-slate-500">Receive signing & invoice alerts on Telegram</p>
            </div>
            <Switch
              id="tg-enable"
              checked={telegram.enabled}
              onCheckedChange={(checked) => setTelegram({ ...telegram, enabled: checked })}
            />
          </div>

          {/* Setup Steps - Simplified */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Quick Setup (1 minute):
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <span className="bg-emerald-100 text-emerald-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Open Telegram, search <b>@userinfobot</b>, send <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">/start</code> — it will show your <b>Chat ID</b> (a number)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-emerald-100 text-emerald-700 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Paste your Chat ID below, enable notifications, and click <b>Test</b>!</span>
              </div>
            </div>
          </div>

          {/* Chat ID Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="chat-id">Your Chat ID</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600" onClick={handleGetChatId}>
                How to find it?
              </Button>
            </div>
            <Input
              id="chat-id"
              value={telegram.chatId}
              onChange={(e) => setTelegram({ ...telegram, chatId: e.target.value })}
              placeholder="e.g. 987654321"
              className="font-mono text-xs"
            />
            <p className="text-xs text-slate-400">Your Telegram user ID (numbers only)</p>
          </div>

          {/* Test Button */}
          <Button
            variant="outline"
            onClick={handleTestTelegram}
            disabled={testing || !telegram.chatId}
            className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Send className="h-4 w-4" />
            {testing ? 'Sending...' : 'Send Test Message'}
          </Button>

          {/* Status */}
          {isConnected && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">Telegram notifications active</span>
            </div>
          )}
          {!isConnected && telegram.enabled && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">Enter your Chat ID to activate notifications</span>
            </div>
          )}

          <Separator />

          {/* Advanced: Custom Bot Token */}
          <div>
            <button
              onClick={() => setShowCustomBot(!showCustomBot)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {showCustomBot ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Advanced: Use Your Own Bot Token
            </button>

            {showCustomBot && (
              <div className="mt-3 space-y-3 rounded-lg border border-dashed border-slate-300 p-4">
                <p className="text-xs text-slate-500">
                  By default, NotaryPro&apos;s built-in bot sends notifications. If you prefer to use your own Telegram bot, enter the token below.
                </p>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={telegram.useCustomBot}
                    onCheckedChange={(checked) => setTelegram({ ...telegram, useCustomBot: checked })}
                  />
                  <Label className="text-sm">Use custom bot</Label>
                </div>
                {telegram.useCustomBot && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bot-token">Bot Token</Label>
                      <div className="flex gap-2">
                        <Input
                          id="bot-token"
                          type="password"
                          value={telegram.botToken}
                          onChange={(e) => setTelegram({ ...telegram, botToken: e.target.value })}
                          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                          className="font-mono text-xs flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleValidateToken}
                          disabled={validating || !telegram.botToken}
                          className="shrink-0"
                        >
                          {validating ? '...' : 'Verify'}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400">From @BotFather — keep it secret!</p>
                      {botInfo && (
                        <div className="flex items-center gap-2 p-2 rounded bg-emerald-50 border border-emerald-200">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-xs text-emerald-700">
                            Verified: <b>{botInfo.name}</b> (@{botInfo.username})
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Notification Preferences */}
          <div>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-amber-500" />
              Notification Preferences
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {prefItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <span>{item.icon}</span>
                    {getNotificationLabel(item.key)}
                  </span>
                  <Switch
                    checked={prefs[item.key]}
                    onCheckedChange={() => handleTogglePref(item.key)}
                    className="scale-90"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notification History */}
          <div>
            <button
              onClick={handleShowHistory}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Notification History
            </button>

            {showHistory && (
              <div className="mt-3 space-y-2">
                {notifHistory.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{notifHistory.length} recent notifications</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-red-500 hover:text-red-700"
                        onClick={handleClearHistory}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-lg border border-slate-200 p-2">
                      {notifHistory.slice(0, 20).map((log) => (
                        <div
                          key={log.id}
                          className={`flex items-start gap-2 p-2 rounded text-xs ${
                            log.success
                              ? 'bg-emerald-50 border border-emerald-100'
                              : 'bg-red-50 border border-red-100'
                          }`}
                        >
                          <span className="shrink-0">{getNotificationEmoji(log.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700">{getNotificationLabel(log.type)}</span>
                              {log.success ? (
                                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px]">Sent</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-[9px]">Failed</Badge>
                              )}
                            </div>
                            <p className="text-slate-500 mt-0.5 truncate">
                              {new Date(log.sentAt).toLocaleString()}
                              {log.error && ` — ${log.error}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 py-2">No notifications sent yet.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-600" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export your data for backup or import from a previous backup file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataBackup />
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Application</span>
              <span className="text-sm font-medium text-slate-900">NotaryPro</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Version</span>
              <span className="text-sm font-mono text-slate-900">1.2.0</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Notifications</span>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-sm font-medium text-slate-900">Telegram (FREE)</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Monthly Cost</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                $0/month
              </Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-slate-600 mb-1">NotaryPro — Mobile Notary Business Manager</p>
              <p className="text-xs text-slate-400">Built for professional notaries and loan signing agents</p>
            </div>
            <div className="pt-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Production Ready
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
