'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Plus, BookOpen, Trash2, PenTool, Eye, Search, FileText, Stamp, Calendar, User, ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import SignatureCanvas from 'react-signature-canvas'

// --- Types ---

interface JournalEntry {
  id: string
  signerName: string
  idType: string
  idNumber: string
  idExpiry: string
  documentType: string
  documentDescription: string
  pageCount: number
  fee: number
  date: string
  time: string
  state: string
  county: string
  notaryActType: string
  notes: string
  signature: string
  status: 'Recorded' | 'Draft'
  createdAt: string
}

interface EntryForm {
  signerName: string
  idType: string
  idNumber: string
  idExpiry: string
  documentType: string
  documentDescription: string
  pageCount: string
  fee: string
  date: string
  time: string
  state: string
  county: string
  notaryActType: string
  notes: string
}

// --- Constants ---

const STORAGE_KEY = 'notarypro-ejournal'

const ID_TYPES = ["Driver's License", 'State ID', 'Passport', 'Military ID']

const DOC_TYPES = [
  'Affidavit',
  'Power of Attorney',
  'Loan Documents',
  'Deed',
  'Will',
  'Contract',
  'I-9 Form',
  'Other',
]

const NOTARY_ACT_TYPES = [
  'Acknowledgment',
  'Jurat',
  'Copy Certification',
  'Oath/Affirmation',
]

const emptyForm: EntryForm = {
  signerName: '',
  idType: '',
  idNumber: '',
  idExpiry: '',
  documentType: '',
  documentDescription: '',
  pageCount: '',
  fee: '',
  date: '',
  time: '',
  state: '',
  county: '',
  notaryActType: '',
  notes: '',
}

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function generateId(): string {
  return 'ej_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function getCurrentTime(): string {
  const now = new Date()
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// --- Component ---

export default function EJournalView() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null)
  const [form, setForm] = useState<EntryForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const sigCanvas = useRef<SignatureCanvas>(null)

  // --- localStorage ---

  const loadEntries = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setEntries(JSON.parse(raw))
      }
    } catch {
      // ignore parse errors
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const persistEntries = useCallback((updated: JournalEntry[]) => {
    setEntries(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // ignore storage errors
    }
  }, [])

  // --- Filtering ---

  const filtered = entries.filter((entry) => {
    const q = search.toLowerCase()
    const matchesSearch = entry.signerName.toLowerCase().includes(q)
    const matchesMonth = monthFilter
      ? entry.date.startsWith(monthFilter)
      : true
    return matchesSearch && matchesMonth
  })

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  // --- Stats ---

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthlyEntries = entries.filter((e) => e.date.startsWith(currentMonth))
  const monthlyFees = monthlyEntries.reduce((sum, e) => sum + e.fee, 0)

  const docTypeCount: Record<string, number> = {}
  entries.forEach((e) => {
    docTypeCount[e.documentType] = (docTypeCount[e.documentType] || 0) + 1
  })
  const mostCommonDocType = Object.entries(docTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  // --- Handlers ---

  const handleOpenCreate = () => {
    setForm({
      ...emptyForm,
      date: getTodayDate(),
      time: getCurrentTime(),
    })
    setTimeout(() => {
      sigCanvas.current?.clear()
    }, 100)
    setDialogOpen(true)
  }

  const handleOpenView = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    setViewOpen(true)
  }

  const handleDeleteClick = (entry: JournalEntry) => {
    setDeleteTarget(entry)
    setDeleteOpen(true)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const updated = entries.filter((e) => e.id !== deleteTarget.id)
    persistEntries(updated)
    toast.success('Journal entry deleted')
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  const handleClearSignature = () => {
    sigCanvas.current?.clear()
  }

  const handleSave = () => {
    if (!form.signerName.trim()) {
      toast.error('Signer name is required')
      return
    }
    if (!form.idNumber.trim()) {
      toast.error('ID number is required')
      return
    }

    const signatureData = sigCanvas.current?.toDataURL() || ''

    const newEntry: JournalEntry = {
      id: generateId(),
      signerName: form.signerName.trim(),
      idType: form.idType,
      idNumber: form.idNumber.trim(),
      idExpiry: form.idExpiry,
      documentType: form.documentType,
      documentDescription: form.documentDescription.trim(),
      pageCount: parseInt(form.pageCount) || 0,
      fee: parseFloat(form.fee) || 0,
      date: form.date,
      time: form.time,
      state: form.state.trim(),
      county: form.county.trim(),
      notaryActType: form.notaryActType,
      notes: form.notes.trim(),
      signature: signatureData,
      status: 'Recorded',
      createdAt: new Date().toISOString(),
    }

    const updated = [...entries, newEntry]
    persistEntries(updated)
    toast.success('Journal entry recorded successfully')
    setDialogOpen(false)
    sigCanvas.current?.clear()
  }

  const handlePrint = () => {
    window.print()
  }

  // --- Loading state ---

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">E-Journal</h1>
            <p className="text-sm text-slate-500 mt-0.5">Digital notarial act records</p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Entries This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{monthlyEntries.length}</p>
            <p className="text-sm text-slate-500 mt-1">
              Total of {entries.length} entries
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Stamp className="h-4 w-4 text-emerald-600" />
              Fees Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(monthlyFees)}</p>
            <p className="text-sm text-slate-500 mt-1">
              This month&apos;s revenue
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Most Common Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-slate-900">{mostCommonDocType}</p>
            <p className="text-sm text-slate-500 mt-1">
              Top document type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by signer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-full sm:w-[200px]"
        />
      </div>

      {/* Journal Entries Table */}
      <Card className="border-slate-200/60">
        <CardContent className="p-0">
          {sorted.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Date &amp; Time</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Signer Name</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden md:table-cell">Document Type</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden lg:table-cell">ID Type</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden lg:table-cell">ID Number</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden sm:table-cell">Fee</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">
                          {formatDate(entry.date)}
                        </div>
                        <div className="text-xs text-slate-500">{entry.time}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-slate-900">
                          {entry.signerName}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-slate-700">{entry.documentType || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-slate-700">{entry.idType || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-slate-600 font-mono">{entry.idNumber}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm font-semibold text-emerald-600">
                          {formatCurrency(entry.fee)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`text-[10px] font-medium ${
                            entry.status === 'Recorded'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-emerald-700"
                            onClick={() => handleOpenView(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                            onClick={() => handleDeleteClick(entry)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 px-4 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                No journal entries yet
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Start recording your notarial acts in your digital journal.
              </p>
              <Button
                onClick={handleOpenCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Create your first entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-emerald-600" />
              New Journal Entry
            </DialogTitle>
            <DialogDescription>
              Record a new notarial act in your digital journal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* 1. Signer Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                Signer Information
              </h3>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="signerName">Signer Full Name *</Label>
                <Input
                  id="signerName"
                  value={form.signerName}
                  onChange={(e) => setForm({ ...form, signerName: e.target.value })}
                  placeholder="Enter signer's full name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type</Label>
                  <Select value={form.idType} onValueChange={(v) => setForm({ ...form, idType: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input
                    id="idNumber"
                    value={form.idNumber}
                    onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                    placeholder="ID number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idExpiry">ID Expiration Date</Label>
                <Input
                  id="idExpiry"
                  type="date"
                  value={form.idExpiry}
                  onChange={(e) => setForm({ ...form, idExpiry: e.target.value })}
                />
              </div>
            </div>

            {/* 2. Document Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Document Details
              </h3>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select value={form.documentType} onValueChange={(v) => setForm({ ...form, documentType: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentDescription">Document Description</Label>
                <Textarea
                  id="documentDescription"
                  value={form.documentDescription}
                  onChange={(e) => setForm({ ...form, documentDescription: e.target.value })}
                  placeholder="Brief description of the document..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageCount">Number of Pages</Label>
                  <Input
                    id="pageCount"
                    type="number"
                    min="0"
                    value={form.pageCount}
                    onChange={(e) => setForm({ ...form, pageCount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">Fee Charged ($)</Label>
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* 3. Notarial Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Stamp className="h-4 w-4 text-emerald-600" />
                Notarial Details
              </h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entryDate">Date</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryTime">Time</Label>
                  <Input
                    id="entryTime"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    placeholder="e.g. 02:30 PM"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="e.g. CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    value={form.county}
                    onChange={(e) => setForm({ ...form, county: e.target.value })}
                    placeholder="e.g. Los Angeles"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notaryActType">Notary Act Type</Label>
                <Select value={form.notaryActType} onValueChange={(v) => setForm({ ...form, notaryActType: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select act type" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTARY_ACT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes about this notarial act..."
                  rows={2}
                />
              </div>
            </div>

            {/* 4. Digital Signature Pad */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <PenTool className="h-4 w-4 text-emerald-600" />
                Digital Signature
              </h3>
              <Separator />
              <div className="relative">
                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{
                    className: 'w-full border-2 border-dashed border-slate-300 rounded-lg cursor-crosshair',
                    style: { height: '300px' },
                  }}
                />
                {!sigCanvas.current?.isEmpty() === false && (
                  <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
                    Sign here...
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearSignature}
                className="gap-2"
              >
                <PenTool className="h-3 w-3" />
                Clear Signature
              </Button>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.signerName.trim() || !form.idNumber.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-emerald-600" />
                  Journal Entry Details
                </DialogTitle>
                <DialogDescription>
                  View the full record of this notarial act.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Signer Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    Signer Information
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Full Name</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedEntry.signerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ID Type</p>
                      <p className="text-sm text-slate-900">{selectedEntry.idType || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ID Number</p>
                      <p className="text-sm text-slate-900 font-mono">{selectedEntry.idNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ID Expiration</p>
                      <p className="text-sm text-slate-900">{selectedEntry.idExpiry ? formatDate(selectedEntry.idExpiry) : '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Document Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Document Details
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Document Type</p>
                      <p className="text-sm text-slate-900">{selectedEntry.documentType || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Pages</p>
                      <p className="text-sm text-slate-900">{selectedEntry.pageCount || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Fee</p>
                      <p className="text-sm font-semibold text-emerald-600">{formatCurrency(selectedEntry.fee)}</p>
                    </div>
                  </div>
                  {selectedEntry.documentDescription && (
                    <div>
                      <p className="text-xs text-slate-500">Description</p>
                      <p className="text-sm text-slate-700">{selectedEntry.documentDescription}</p>
                    </div>
                  )}
                </div>

                {/* Notarial Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Stamp className="h-4 w-4 text-emerald-600" />
                    Notarial Details
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Date</p>
                      <p className="text-sm text-slate-900">{formatDate(selectedEntry.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Time</p>
                      <p className="text-sm text-slate-900">{selectedEntry.time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <Badge
                        className={`text-[10px] font-medium ${
                          selectedEntry.status === 'Recorded'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        {selectedEntry.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">State</p>
                      <p className="text-sm text-slate-900">{selectedEntry.state || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">County</p>
                      <p className="text-sm text-slate-900">{selectedEntry.county || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Act Type</p>
                      <p className="text-sm text-slate-900">{selectedEntry.notaryActType || '—'}</p>
                    </div>
                  </div>
                  {selectedEntry.notes && (
                    <div>
                      <p className="text-xs text-slate-500">Notes</p>
                      <p className="text-sm text-slate-700">{selectedEntry.notes}</p>
                    </div>
                  )}
                </div>

                {/* Signature */}
                {selectedEntry.signature && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-emerald-600" />
                      Signature
                    </h3>
                    <Separator />
                    <div className="border-2 border-slate-200 rounded-lg p-2 bg-white">
                      <img
                        src={selectedEntry.signature}
                        alt="Signer signature"
                        className="w-full h-auto max-h-[200px] object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Print
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the entry for{' '}
              <strong>{deleteTarget?.signerName}</strong>? This action cannot be undone
              and the record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
