'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
} from 'lucide-react'

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

  useEffect(() => {
    loadData()
  }, [])

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
          <Button variant="outline" onClick={handleConnectGmail}>
            <Plus className="h-4 w-4 mr-2" />Connect Gmail
          </Button>
        </div>
      </div>

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
