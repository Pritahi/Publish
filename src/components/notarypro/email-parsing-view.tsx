'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Mail,
  MailOpen,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ShieldCheck,
  Zap,
  Loader2,
  ExternalLink,
  Trash2,
  Plus,
  FlaskConical,
  Copy,
  CheckCheck,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface ParsedSigning {
  id: string
  emailId: string
  emailFrom: string
  emailSubject: string
  emailDate: string
  clientName: string | null
  signingDate: string | null
  signingTime: string | null
  location: string | null
  serviceType: string | null
  fee: number | null
  status: string
  source: string
  verified: boolean
  signingId: string | null
}

interface EmailConnection {
  id: string
  provider: string
  emailAddress: string
  isActive: boolean
  lastSyncAt: string | null
  hasConnection: boolean
}

export default function EmailParsingView() {
  const [parsedSignings, setParsedSignings] = useState<ParsedSigning[]>([])
  const [connections, setConnections] = useState<EmailConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [testOpen, setTestOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  // Show a friendly toast based on the ?gmail= URL flag set by the OAuth
  // callback. We then strip the param from the URL so a refresh doesn't
  // re-show the toast. No internal error codes are ever read here.
  useEffect(() => {
    const gmailStatus = searchParams.get('gmail')
    if (!gmailStatus) return

    if (gmailStatus === 'connected') {
      toast.success('Gmail connected successfully', {
        description: 'Your signing emails will now be auto-parsed.',
      })
    } else if (gmailStatus === 'failed') {
      toast.error("We couldn't connect your Gmail", {
        description:
          'Something went wrong on our end. You can try again from the Email Parsing page later.',
      })
    }

    // Clean the URL so refresh / back-button doesn't repeat the toast.
    const cleanUrl = new URL(window.location.href)
    cleanUrl.searchParams.delete('gmail')
    router.replace(cleanUrl.pathname + cleanUrl.search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function loadData() {
    setLoading(true)
    try {
      const [parsedRes, connRes] = await Promise.all([
        fetch('/api/email-parsing'),
        fetch('/api/email-connections'),
      ])

      if (parsedRes.ok) {
        const parsedData = await parsedRes.json()
        setParsedSignings(parsedData.data || [])
      }

      if (connRes.ok) {
        const connData = await connRes.json()
        setConnections(connData.data || [])
      }
    } catch (err) {
      console.error('Failed to load email parsing data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/email-parsing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      })

      if (res.ok) {
        const data = await res.json()
        await loadData() // Refresh the list
      }
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }

  async function handleConfirm(parsedSigning: ParsedSigning) {
    setConfirming(parsedSigning.id)
    try {
      const res = await fetch('/api/email-parsing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          id: parsedSigning.id,
          signingData: {
            clientName: parsedSigning.clientName,
            signingDate: parsedSigning.signingDate,
            signingTime: parsedSigning.signingTime,
            location: parsedSigning.location,
            serviceType: parsedSigning.serviceType,
            fee: parsedSigning.fee,
          },
        }),
      })

      if (res.ok) {
        await loadData()
      }
    } catch (err) {
      console.error('Confirm failed:', err)
    } finally {
      setConfirming(null)
    }
  }

  async function handleDismiss(id: string) {
    try {
      const res = await fetch('/api/email-parsing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', id }),
      })

      if (res.ok) {
        await loadData()
      }
    } catch (err) {
      console.error('Dismiss failed:', err)
    }
  }

  async function handleConnectGmail() {
    try {
      const res = await fetch('/api/auth/gmail')
      if (res.ok) {
        const data = await res.json()
        window.open(data.authUrl, '_blank')
      }
    } catch (err) {
      console.error('Gmail connect failed:', err)
    }
  }

  async function handleDisconnect(id: string) {
    try {
      const res = await fetch('/api/email-connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        await loadData()
      }
    } catch (err) {
      console.error('Disconnect failed:', err)
    }
  }

  const filteredSignings = parsedSignings.filter((s) => {
    if (filter === 'all') return true
    if (filter === 'pending') return s.status === 'Pending'
    if (filter === 'confirmed') return s.status === 'Confirmed' || s.status === 'Auto-Confirmed'
    if (filter === 'dismissed') return s.status === 'Dismissed'
    return true
  })

  const pendingCount = parsedSignings.filter((s) => s.status === 'Pending').length

  function getStatusBadge(status: string) {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'Auto-Confirmed':
        return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50"><Zap className="h-3 w-3 mr-1" />Auto</Badge>
      case 'Confirmed':
        return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmed</Badge>
      case 'Dismissed':
        return <Badge variant="outline" className="text-slate-500 border-slate-300 bg-slate-50"><XCircle className="h-3 w-3 mr-1" />Dismissed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Email Parsing</h2>
          <p className="text-sm text-slate-500 mt-1">
            Automatically detect signing appointments from your inbox
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSync}
            disabled={syncing || connections.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {syncing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" />Sync Inbox</>
            )}
          </Button>
          <Button variant="outline" onClick={() => setTestOpen(true)}>
            <FlaskConical className="h-4 w-4 mr-2" />Test Parser
          </Button>
          <Button variant="outline" onClick={handleConnectGmail}>
            <Plus className="h-4 w-4 mr-2" />Connect Gmail
          </Button>
        </div>
      </div>

      {/* Test Parser Dialog */}
      <TestParserDialog open={testOpen} onOpenChange={setTestOpen} />

      {/* Email Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email Connections</CardTitle>
          <CardDescription>Connected email accounts for automatic signing detection</CardDescription>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Mail className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No email accounts connected</p>
              <p className="text-xs mt-1">Connect your Gmail to start detecting signing appointments</p>
              <Button onClick={handleConnectGmail} variant="outline" className="mt-4">
                <ExternalLink className="h-4 w-4 mr-2" />Connect Gmail
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-sm">{conn.emailAddress || 'Gmail'}</p>
                      <p className="text-xs text-slate-500">
                        Last sync: {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={conn.isActive ? 'default' : 'secondary'} className={conn.isActive ? 'bg-emerald-600' : ''}>
                      {conn.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleDisconnect(conn.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parsed Signings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Detected Signings</CardTitle>
              <CardDescription>
                {pendingCount > 0 ? `${pendingCount} pending review` : 'All caught up!'}
              </CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({parsedSignings.length})</SelectItem>
                <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSignings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MailOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No signings detected yet</p>
              <p className="text-xs mt-1">Sync your inbox to find signing appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSignings.map((ps) => (
                <div key={ps.id} className="p-4 rounded-lg border hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{ps.clientName || 'Unknown Client'}</h4>
                        {getStatusBadge(ps.status)}
                        {ps.verified ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                            <ShieldCheck className="h-3 w-3 mr-1" />Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400">
                            <Shield className="h-3 w-3 mr-1" />Assumed
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        From: {ps.emailFrom} | Source: {ps.source}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">Date:</span>{' '}
                          <span className="font-medium">{ps.signingDate || 'TBD'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Time:</span>{' '}
                          <span className="font-medium">{ps.signingTime || 'TBD'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Type:</span>{' '}
                          <span className="font-medium">{ps.serviceType || 'General'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Fee:</span>{' '}
                          <span className="font-medium">{ps.fee ? `$${ps.fee}` : 'TBD'}</span>
                        </div>
                      </div>
                      {ps.location && (
                        <p className="text-xs text-slate-500 mt-1">Location: {ps.location}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        Subject: {ps.emailSubject}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {ps.status === 'Pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleConfirm(ps)}
                            disabled={confirming === ps.id}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {confirming === ps.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismiss(ps.id)}
                          >
                            <XCircle className="h-3 w-3 text-slate-400" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TestParserDialog — lets users test the email parser without sending real
// emails. They can pick a sample template (or paste their own email content)
// and see what fields the parser would extract, plus a plain-English
// explanation of why it was/wasn't detected.
// ─────────────────────────────────────────────────────────────────────────────

interface SampleTemplate {
  id: string
  label: string
  description: string
  from: string
  subject: string
  body: string
}

const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'snapdocs',
    label: 'SnapDocs-style',
    description: 'Verified signing service — auto-detected from sender domain',
    from: 'notifications@snapdocs.com',
    subject: 'New Signing Request - John Smith - 123 Main St, Austin TX',
    body: `Hello,

You have a new signing request.

Borrower: John Smith
Signing Date: 12/15/2025
Signing Time: 2:00 PM
Location: 123 Main St, Austin, TX 78701
Notary Fee: $125.00

Please confirm availability.

Thanks,
SnapDocs Team`,
  },
  {
    id: 'signatureclosers',
    label: 'Signature Closers',
    description: 'Verified signing service — uses "Assignment:" subject format',
    from: 'scheduling@signatureclosers.com',
    subject: 'Assignment: Sarah Johnson - Refinance',
    body: `Hello Notary,

You have been assigned a signing.

Borrower: Sarah Johnson
Appointment Date: 12/20/2025
Appointment Time: 10:00 AM
Signing Location: 456 Oak Avenue, Dallas, TX 75201
Notary Fee: $150.00

Service Type: Refinance Closing

Please confirm.

Signature Closers`,
  },
  {
    id: 'generic-strong',
    label: 'Unknown sender — strong signals',
    description: 'From a random email but contains strong signing keywords + date + fee → should be detected',
    from: 'coordinator@randomtitleco.com',
    subject: 'Signing Appointment - Michael Brown',
    body: `Hi,

We'd like to schedule a notary signing appointment for our client.

Borrower Name: Michael Brown
Signing Date: 12/22/2025
Signing Time: 3:30 PM
Location: 789 Elm St, Houston, TX

Notary Fee: $100
Signing Service: Random Title Co

Please let us know if you're available.

Thanks!`,
  },
  {
    id: 'newsletter',
    label: 'Newsletter (should be IGNORED)',
    description: 'From daily.dev — blocklisted. Should NOT be detected as a signing.',
    from: 'digest@daily.dev',
    subject: 'Your daily dev news — 5 trending posts',
    body: `Hey dev!

Here are today's trending posts:
- 10 JavaScript tips
- Why TypeScript is winning
- Building a SaaS in 2025

Happy coding!
daily.dev team`,
  },
  {
    id: 'personal',
    label: 'Personal email (should be IGNORED)',
    description: 'From a friend, no signing keywords — should NOT be detected.',
    from: 'mom@gmail.com',
    subject: 'Dinner this weekend?',
    body: `Hey! Are you free for dinner this Saturday? Let me know!

Love,
Mom`,
  },
  {
    id: 'weak-unknown',
    label: 'Unknown sender — weak signals (IGNORED)',
    description: 'Has "signing" keyword but no date/fee/borrower — should NOT be detected.',
    from: 'someone@random.org',
    subject: 'Question about your services',
    body: `Hi,

I saw you offer notary services. Can you tell me about your signing process?

Thanks`,
  },
]

function TestParserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [from, setFrom] = useState(SAMPLE_TEMPLATES[0].from)
  const [subject, setSubject] = useState(SAMPLE_TEMPLATES[0].subject)
  const [body, setBody] = useState(SAMPLE_TEMPLATES[0].body)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function runTest() {
    setTesting(true)
    setResult(null)
    try {
      const res = await fetch('/api/email-parsing/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, subject, body }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
      } else {
        toast.error(data.error || 'Test failed')
      }
    } catch (err) {
      toast.error('Network error')
    } finally {
      setTesting(false)
    }
  }

  function loadTemplate(templateId: string) {
    const t = SAMPLE_TEMPLATES.find((s) => s.id === templateId)
    if (t) {
      setFrom(t.from)
      setSubject(t.subject)
      setBody(t.body)
      setResult(null)
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 1500)
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-emerald-600" />
            Test Email Parser
          </DialogTitle>
          <DialogDescription>
            Paste an email (or pick a sample) to see what the parser would extract — without sending
            a real email. Great for testing before connecting Gmail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sample templates */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quick Samples
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {SAMPLE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t.id)}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                >
                  <p className="text-xs font-semibold text-slate-800">{t.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Email input form */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="test-from" className="text-xs">From (sender email)</Label>
              <Input
                id="test-from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="notifications@snapdocs.com"
                className="mt-1 font-mono text-xs"
              />
            </div>
            <div>
              <Label htmlFor="test-subject" className="text-xs">Subject</Label>
              <Input
                id="test-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="New Signing Request - John Smith"
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="test-body" className="text-xs">Email Body</Label>
              <Textarea
                id="test-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Borrower: John Smith&#10;Signing Date: 12/15/2025..."
                className="mt-1 font-mono text-xs min-h-[160px]"
              />
            </div>
          </div>

          <Button
            onClick={runTest}
            disabled={testing || !from || !subject || !body}
            className="w-full bg-slate-900 hover:bg-slate-800"
          >
            {testing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing...</>
            ) : (
              <><FlaskConical className="h-4 w-4 mr-2" />Run Parser Test</>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <Separator />
              <div className={`rounded-lg p-3 border ${
                result.detected
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-2">
                  {result.detected ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${
                      result.detected ? 'text-emerald-700' : 'text-slate-700'
                    }`}>
                      {result.detected ? 'DETECTED as a signing' : 'NOT detected as a signing'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>
                </div>
              </div>

              {result.detected && result.parsed && (
                <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Extracted Fields
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <FieldRow label="Client Name" value={result.parsed.clientName} />
                    <FieldRow label="Signing Date" value={result.parsed.signingDate} />
                    <FieldRow label="Signing Time" value={result.parsed.signingTime} />
                    <FieldRow label="Location" value={result.parsed.location} />
                    <FieldRow label="Service Type" value={result.parsed.serviceType} />
                    <FieldRow label="Fee" value={result.parsed.fee ? `$${result.parsed.fee}` : null} />
                    <FieldRow label="Source" value={result.parsed.source} />
                    <FieldRow label="Verified" value={result.parsed.verified ? 'Yes' : 'No'} />
                  </div>
                  {result.autoConfirmable && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded p-2 mt-2">
                      <Zap className="h-3.5 w-3.5" />
                      <span>Would be auto-confirmed (all fields present + verified sender)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Copy as real email tip */}
              {result.detected && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Want to test the full pipeline?
                  </p>
                  <p className="text-xs text-blue-800 mb-2 leading-relaxed">
                    Copy the subject + body below, send it to your connected Gmail from any email
                    client, then come back here and click "Sync Inbox".
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`Subject: ${subject}\n\n${body}`, 'email')}
                      className="text-xs h-7"
                    >
                      {copied === 'email' ? (
                        <><CheckCheck className="h-3 w-3 mr-1" />Copied!</>
                      ) : (
                        <><Copy className="h-3 w-3 mr-1" />Copy email</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {!result.detected && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    How to make it detected
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1 ml-4 list-disc">
                    <li>Use a known signing service sender (snapdocs.com, signatureclosers.com, notarygo.com, etc.)</li>
                    <li>OR include strong phrases: "notary signing", "loan signing", "signing appointment", "borrower name"</li>
                    <li>Include a date like "Signing Date: 12/15/2025"</li>
                    <li>Include a fee like "Notary Fee: $125"</li>
                    <li>For unknown senders, at least 2 fields must be extractable</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`text-xs font-medium ${value ? 'text-slate-800' : 'text-slate-300 italic'}`}>
        {value || '—'}
      </span>
    </div>
  )
}

