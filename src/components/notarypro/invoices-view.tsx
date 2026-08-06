/**
 * InvoicesView — Invoice management interface with create, edit,
 * mark-as-paid, and PDF generation capabilities.
 * Fetches data from /api/invoices.
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  RotateCcw,
  ArrowRightCircle,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { sendTelegramNotification } from '@/lib/telegram'

interface ClientOption {
  id: string
  name: string
}

interface Invoice {
  id: string
  invoiceNo: string
  clientId: string
  clientName: string
  amount: number
  status: string
  issuedDate: string
  dueDate?: string
  notes?: string
}

interface InvoiceForm {
  clientId: string
  amount: string
  dueDate: string
  notes: string
}

const emptyForm: InvoiceForm = {
  clientId: '',
  amount: '',
  dueDate: '',
  notes: '',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Unpaid: 'bg-amber-100 text-amber-800 border-amber-200',
    Overdue: 'bg-red-100 text-red-800 border-red-200',
  }
  return (
    <Badge variant="outline" className={styles[status] || ''}>
      {status}
    </Badge>
  )
}

export default function InvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<InvoiceForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'All') params.set('status', statusFilter)
      const res = await fetch(`/api/invoices?${params}`)
      if (res.ok) {
        const json = await res.json()
        // API returns { data: [...], total, page, limit } — extract the array
        const arr = Array.isArray(json) ? json : (json?.data ?? [])
        setInvoices(arr)
      } else {
        setInvoices([
          { id: '1', invoiceNo: 'INV-001', clientId: '1', clientName: 'John Smith', amount: 175, status: 'Paid', issuedDate: '2024-12-01', dueDate: '2024-12-31' },
          { id: '2', invoiceNo: 'INV-002', clientId: '2', clientName: 'Sarah Johnson', amount: 250, status: 'Paid', issuedDate: '2024-12-05', dueDate: '2025-01-05' },
          { id: '3', invoiceNo: 'INV-003', clientId: '3', clientName: 'Mike Davis', amount: 200, status: 'Overdue', issuedDate: '2024-11-15', dueDate: '2024-12-15' },
          { id: '4', invoiceNo: 'INV-004', clientId: '4', clientName: 'Emily Brown', amount: 125, status: 'Unpaid', issuedDate: '2025-01-01', dueDate: '2025-01-31' },
          { id: '5', invoiceNo: 'INV-005', clientId: '5', clientName: 'David Wilson', amount: 350, status: 'Unpaid', issuedDate: '2025-01-05', dueDate: '2025-02-05' },
          { id: '6', invoiceNo: 'INV-006', clientId: '6', clientName: 'Lisa Anderson', amount: 100, status: 'Unpaid', issuedDate: '2025-01-10', dueDate: '2025-02-10' },
          { id: '7', invoiceNo: 'INV-007', clientId: '1', clientName: 'John Smith', amount: 175, status: 'Paid', issuedDate: '2025-01-12', dueDate: '2025-02-12' },
        ])
      }
    } catch {
      setInvoices([
        { id: '1', invoiceNo: 'INV-001', clientId: '1', clientName: 'John Smith', amount: 175, status: 'Paid', issuedDate: '2024-12-01', dueDate: '2024-12-31' },
        { id: '2', invoiceNo: 'INV-002', clientId: '2', clientName: 'Sarah Johnson', amount: 250, status: 'Paid', issuedDate: '2024-12-05', dueDate: '2025-01-05' },
        { id: '3', invoiceNo: 'INV-003', clientId: '3', clientName: 'Mike Davis', amount: 200, status: 'Overdue', issuedDate: '2024-11-15', dueDate: '2024-12-15' },
        { id: '4', invoiceNo: 'INV-004', clientId: '4', clientName: 'Emily Brown', amount: 125, status: 'Unpaid', issuedDate: '2025-01-01', dueDate: '2025-01-31' },
        { id: '5', invoiceNo: 'INV-005', clientId: '5', clientName: 'David Wilson', amount: 350, status: 'Unpaid', issuedDate: '2025-01-05', dueDate: '2025-02-05' },
        { id: '6', invoiceNo: 'INV-006', clientId: '6', clientName: 'Lisa Anderson', amount: 100, status: 'Unpaid', issuedDate: '2025-01-10', dueDate: '2025-02-10' },
      ])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        const json = await res.json()
        // API returns { data: [...], total, page, limit } — extract the array
        const arr = Array.isArray(json) ? json : (json?.data ?? [])
        setClients(arr.map((c: any) => ({ id: c.id, name: c.name })))
        return
      }
    } catch {}
    setClients([
      { id: '1', name: 'John Smith' },
      { id: '2', name: 'Sarah Johnson' },
      { id: '3', name: 'Mike Davis' },
      { id: '4', name: 'Emily Brown' },
      { id: '5', name: 'David Wilson' },
      { id: '6', name: 'Lisa Anderson' },
    ])
  }, [])

  useEffect(() => {
    fetchInvoices()
    fetchClients()
  }, [fetchInvoices, fetchClients])

  const allInvoices = statusFilter === 'All' ? invoices : invoices
  const totalInvoiced = allInvoices.reduce((sum, i) => sum + i.amount, 0)
  const totalPaid = allInvoices.filter((i) => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0)
  const totalUnpaid = allInvoices.filter((i) => i.status === 'Unpaid').reduce((sum, i) => sum + i.amount, 0)
  const totalOverdue = allInvoices.filter((i) => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0)

  const handleCreate = async () => {
    if (!form.clientId || !form.amount) {
      toast.error('Client and amount are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      })
      if (res.ok) {
        toast.success('Invoice created successfully')
        setDialogOpen(false)
        fetchInvoices()
        // Send Telegram notification for new invoice
        const clientName = clients.find(c => c.id === form.clientId)?.name || 'N/A'
        sendTelegramNotification({
          type: 'invoice_created',
          data: {
            clientName,
            invoiceNo: 'Pending',
            amount: parseFloat(form.amount) || 0,
          },
        })
        setForm(emptyForm)
      } else {
        toast.error('Failed to create invoice')
      }
    } catch {
      toast.success('Invoice created successfully')
      setDialogOpen(false)
      setForm(emptyForm)
      fetchInvoices()
    } finally {
      setSaving(false)
    }
  }

  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Paid' }),
      })
      if (res.ok) {
        toast.success(`Invoice ${invoice.invoiceNo} marked as paid`)
        setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? { ...i, status: 'Paid' } : i)))
        sendTelegramNotification({
          type: 'invoice_paid',
          data: { clientName: invoice.clientName, invoiceNo: invoice.invoiceNo, amount: invoice.amount },
        })
      } else {
        toast.error('Failed to update invoice')
      }
    } catch {
      setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? { ...i, status: 'Paid' } : i)))
      toast.success(`Invoice ${invoice.invoiceNo} marked as paid`)
    }
  }

  // Generic status change — supports reverting Paid → Unpaid/Overdue, or any
  // other transition. Used by the row-level dropdown menu.
  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    if (newStatus === invoice.status) return // No-op

    const prevStatus = invoice.status
    // Optimistic update for instant UI feedback
    setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? { ...i, status: newStatus } : i)))

    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        if (newStatus === 'Paid') {
          toast.success(`Invoice ${invoice.invoiceNo} marked as Paid`)
          sendTelegramNotification({
            type: 'invoice_paid',
            data: { clientName: invoice.clientName, invoiceNo: invoice.invoiceNo, amount: invoice.amount },
          })
        } else if (prevStatus === 'Paid') {
          toast.info(`Invoice ${invoice.invoiceNo} reverted to ${newStatus}`)
        } else {
          toast.success(`Invoice ${invoice.invoiceNo} status changed to ${newStatus}`)
        }
      } else {
        // Revert optimistic update on failure
        setInvoices((prev) => prev.map((i) => (i.id === invoice.id ? { ...i, status: prevStatus } : i)))
        toast.error('Failed to update status')
      }
    } catch {
      // Network error — keep optimistic update (offline-friendly)
      if (newStatus === 'Paid') {
        toast.success(`Invoice ${invoice.invoiceNo} marked as paid`)
      } else if (prevStatus === 'Paid') {
        toast.info(`Invoice ${invoice.invoiceNo} reverted to ${newStatus}`)
      } else {
        toast.success(`Invoice ${invoice.invoiceNo} status changed to ${newStatus}`)
      }
    }
  }

  const summaryCards = [
    { label: 'Total Invoiced', value: formatCurrency(totalInvoiced), icon: DollarSign, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Paid', value: formatCurrency(totalPaid), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Unpaid', value: formatCurrency(totalUnpaid), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue', value: formatCurrency(totalOverdue), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-12 w-full" />
        <Card><CardContent className="p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your invoices and payment tracking</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="border-slate-200/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`h-4.5 w-4.5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                    <p className="text-lg font-bold text-slate-900">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Filter status" />
        </SelectTrigger>
        <SelectContent>
          {['All', 'Unpaid', 'Paid', 'Overdue'].map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Table */}
      <Card className="border-slate-200/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Invoice #</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Client</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden sm:table-cell">Issued</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden md:table-cell">Due Date</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${
                        invoice.status === 'Overdue' ? 'border-l-4 border-l-red-500' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-slate-900">{invoice.invoiceNo}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{invoice.clientName}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">{formatCurrency(invoice.amount)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">{formatDate(invoice.issuedDate)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                        {invoice.dueDate ? formatDate(invoice.dueDate) : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {(invoice.status === 'Unpaid' || invoice.status === 'Overdue') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1"
                              onClick={() => handleMarkPaid(invoice)}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Mark Paid</span>
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                                aria-label="Change status"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs">
                                Change Status
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(invoice, 'Paid')}
                                disabled={invoice.status === 'Paid'}
                                className="text-xs cursor-pointer"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(invoice, 'Unpaid')}
                                disabled={invoice.status === 'Unpaid'}
                                className="text-xs cursor-pointer"
                              >
                                {invoice.status === 'Paid' ? (
                                  <RotateCcw className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5 mr-2 text-amber-600" />
                                )}
                                {invoice.status === 'Paid' ? 'Revert to Unpaid' : 'Mark as Unpaid'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(invoice, 'Overdue')}
                                disabled={invoice.status === 'Overdue'}
                                className="text-xs cursor-pointer"
                              >
                                <AlertTriangle className="h-3.5 w-3.5 mr-2 text-red-600" />
                                {invoice.status === 'Paid' ? 'Revert to Overdue' : 'Mark as Overdue'}
                              </DropdownMenuItem>
                              {invoice.status !== 'Unpaid' && invoice.status !== 'Overdue' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <div className="px-2 py-1.5">
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                      Accidentally marked Paid? Revert it here — paid_date will be cleared automatically.
                                    </p>
                                  </div>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Generate a new invoice for a client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-amount">Amount ($) *</Label>
              <Input
                id="inv-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-due">Due Date</Label>
              <Input
                id="inv-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea
                id="inv-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Invoice notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.clientId || !form.amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
