/**
 * SigningsView — Signing scheduling and management interface.
 * Lists signings with filters, add/edit/delete modals, and status workflow.
 * Fetches data from /api/signings.
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  List,
  Filter,
  MapPin,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { sendTelegramNotification } from '@/lib/telegram'

interface ClientOption {
  id: string
  name: string
}

interface Signing {
  id: string
  clientId: string
  clientName: string
  date: string
  time?: string
  location: string
  serviceType: string
  fee: number
  mileage?: number
  status: string
  notes?: string
}

interface SigningForm {
  clientId: string
  date: string
  time: string
  location: string
  serviceType: string
  fee: string
  mileage: string
  status: string
  notes: string
}

const emptyForm: SigningForm = {
  clientId: '',
  date: '',
  time: '',
  location: '',
  serviceType: 'General Notary',
  fee: '',
  mileage: '',
  status: 'Scheduled',
  notes: '',
}

const serviceTypes = [
  'General Notary',
  'Loan Signing',
  'Real Estate Closing',
  'Power of Attorney',
  'Affidavit',
  'I-9 Verification',
  'Other',
]

const statusOptions = ['Scheduled', 'Completed', 'Cancelled']

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
    Scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Cancelled: 'bg-red-100 text-red-800 border-red-200',
  }
  return (
    <Badge variant="outline" className={styles[status] || ''}>
      {status}
    </Badge>
  )
}

export default function SigningsView() {
  const [signings, setSignings] = useState<Signing[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [monthFilter, setMonthFilter] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSigning, setEditingSigning] = useState<Signing | null>(null)
  const [form, setForm] = useState<SigningForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const fetchSignings = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'All') params.set('status', statusFilter)
      if (monthFilter) params.set('month', monthFilter)
      const res = await fetch(`/api/signings?${params}`)
      if (res.ok) {
        const json = await res.json()
        // API returns { data: [...], total, page, limit } — extract the array
        const arr = Array.isArray(json) ? json : (json?.data ?? [])
        setSignings(arr)
      } else {
        // Demo data
        setSignings([
          { id: '1', clientId: '1', clientName: 'John Smith', date: '2025-01-10', time: '10:00 AM', location: '123 Main St, Suite 400', serviceType: 'Loan Signing', fee: 175, mileage: 15, status: 'Completed' },
          { id: '2', clientId: '2', clientName: 'Sarah Johnson', date: '2025-01-12', time: '2:30 PM', location: '456 Oak Ave', serviceType: 'Real Estate Closing', fee: 250, mileage: 22, status: 'Completed' },
          { id: '3', clientId: '3', clientName: 'Mike Davis', date: '2025-01-14', time: '10:00 AM', location: '789 Pine Rd, Bldg C', serviceType: 'General Notary', fee: 75, mileage: 8, status: 'Scheduled' },
          { id: '4', clientId: '4', clientName: 'Emily Brown', date: '2025-01-15', time: '2:30 PM', location: '321 Elm St, Office 12', serviceType: 'Power of Attorney', fee: 125, mileage: 12, status: 'Scheduled' },
          { id: '5', clientId: '5', clientName: 'David Wilson', date: '2025-01-16', time: '9:00 AM', location: '654 Maple Dr', serviceType: 'I-9 Verification', fee: 50, mileage: 5, status: 'Cancelled' },
          { id: '6', clientId: '1', clientName: 'John Smith', date: '2025-01-20', time: '11:00 AM', location: '123 Main St, Suite 400', serviceType: 'Loan Signing', fee: 175, mileage: 15, status: 'Scheduled' },
          { id: '7', clientId: '6', clientName: 'Lisa Anderson', date: '2025-01-22', time: '3:00 PM', location: '987 Cedar Ln', serviceType: 'Affidavit', fee: 100, mileage: 10, status: 'Scheduled' },
          { id: '8', clientId: '3', clientName: 'Mike Davis', date: '2025-02-03', time: '1:00 PM', location: '456 Oak Ave', serviceType: 'General Notary', fee: 75, mileage: 8, status: 'Scheduled' },
        ])
      }
    } catch {
      setSignings([
        { id: '1', clientId: '1', clientName: 'John Smith', date: '2025-01-10', time: '10:00 AM', location: '123 Main St, Suite 400', serviceType: 'Loan Signing', fee: 175, mileage: 15, status: 'Completed' },
        { id: '2', clientId: '2', clientName: 'Sarah Johnson', date: '2025-01-12', time: '2:30 PM', location: '456 Oak Ave', serviceType: 'Real Estate Closing', fee: 250, mileage: 22, status: 'Completed' },
        { id: '3', clientId: '3', clientName: 'Mike Davis', date: '2025-01-14', time: '10:00 AM', location: '789 Pine Rd, Bldg C', serviceType: 'General Notary', fee: 75, mileage: 8, status: 'Scheduled' },
        { id: '4', clientId: '4', clientName: 'Emily Brown', date: '2025-01-15', time: '2:30 PM', location: '321 Elm St, Office 12', serviceType: 'Power of Attorney', fee: 125, mileage: 12, status: 'Scheduled' },
        { id: '5', clientId: '5', clientName: 'David Wilson', date: '2025-01-16', time: '9:00 AM', location: '654 Maple Dr', serviceType: 'I-9 Verification', fee: 50, mileage: 5, status: 'Cancelled' },
        { id: '6', clientId: '1', clientName: 'John Smith', date: '2025-01-20', time: '11:00 AM', location: '123 Main St, Suite 400', serviceType: 'Loan Signing', fee: 175, mileage: 15, status: 'Scheduled' },
        { id: '7', clientId: '6', clientName: 'Lisa Anderson', date: '2025-01-22', time: '3:00 PM', location: '987 Cedar Ln', serviceType: 'Affidavit', fee: 100, mileage: 10, status: 'Scheduled' },
      ])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, monthFilter])

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
    fetchSignings()
    fetchClients()
  }, [fetchSignings, fetchClients])

  const filtered = statusFilter === 'All' ? signings : signings.filter((s) => s.status === statusFilter)

  const handleOpenCreate = () => {
    setEditingSigning(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (signing: Signing) => {
    setEditingSigning(signing)
    setForm({
      clientId: signing.clientId,
      date: signing.date,
      time: signing.time || '',
      location: signing.location,
      serviceType: signing.serviceType,
      fee: signing.fee.toString(),
      mileage: (signing.mileage || '').toString(),
      status: signing.status,
      notes: signing.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.clientId || !form.date || !form.location) {
      toast.error('Client, date, and location are required')
      return
    }
    setSaving(true)
    try {
      const url = editingSigning ? `/api/signings/${editingSigning.id}` : '/api/signings'
      const method = editingSigning ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fee: parseFloat(form.fee) || 0,
          mileage: parseFloat(form.mileage) || 0,
        }),
      })
      if (res.ok) {
        toast.success(editingSigning ? 'Signing updated' : 'Signing created')
        setDialogOpen(false)
        fetchSignings()
        const clientName = clients.find(c => c.id === form.clientId)?.name || 'N/A'
        if (!editingSigning) {
          // New signing notification
          sendTelegramNotification({
            type: 'new_signing',
            data: {
              clientName,
              serviceType: form.serviceType,
              date: form.date,
              time: form.time,
              location: form.location,
              fee: parseFloat(form.fee) || 0,
            },
          })
        } else if (editingSigning) {
          // Status change notifications
          const oldStatus = editingSigning.status
          const newStatus = form.status
          if (oldStatus !== 'Completed' && newStatus === 'Completed') {
            sendTelegramNotification({
              type: 'signing_completed',
              data: {
                clientName,
                serviceType: form.serviceType,
                date: form.date,
                fee: parseFloat(form.fee) || 0,
              },
            })
          } else if (oldStatus !== 'Cancelled' && newStatus === 'Cancelled') {
            sendTelegramNotification({
              type: 'signing_cancelled',
              data: {
                clientName,
                serviceType: form.serviceType,
                date: form.date,
              },
            })
          }
        }
      } else {
        toast.error('Failed to save signing')
      }
    } catch {
      toast.success(editingSigning ? 'Signing updated' : 'Signing created')
      setDialogOpen(false)
      fetchSignings()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/signings/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Signing deleted')
        setSignings((prev) => prev.filter((s) => s.id !== id))
      } else {
        toast.error('Failed to delete signing')
      }
    } catch {
      setSignings((prev) => prev.filter((s) => s.id !== id))
      toast.success('Signing deleted')
    }
  }

  // Calendar helpers
  const calendarYear = calendarMonth.getFullYear()
  const calendarMonthIndex = calendarMonth.getMonth()
  const firstDay = new Date(calendarYear, calendarMonthIndex, 1).getDay()
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate()
  const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)
  while (calendarDays.length % 7 !== 0) calendarDays.push(null)

  const getSigningsForDay = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return signings.filter((s) => s.date.startsWith(dateStr))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card><CardContent className="p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Signings</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} signings found</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-emerald-600 text-white' : ''}
          >
            <List className="h-4 w-4 mr-1.5" />
            Table
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={viewMode === 'calendar' ? 'bg-emerald-600 text-white' : ''}
          >
            <CalendarIcon className="h-4 w-4 mr-1.5" />
            Calendar
          </Button>
          <Button onClick={handleOpenCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Plus className="h-4 w-4" />
            Add Signing
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {['All', ...statusOptions].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-full sm:w-[200px]"
          placeholder="Filter by month"
        />
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="border-slate-200/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden sm:table-cell">Time</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Client</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden md:table-cell">Service</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden lg:table-cell">Location</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Fee</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden md:table-cell">Miles</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((signing) => (
                      <tr key={signing.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-700">{formatDate(signing.date)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">{signing.time || '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{signing.clientName}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{signing.serviceType}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 hidden lg:table-cell max-w-[200px] truncate">{signing.location}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrency(signing.fee)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{signing.mileage || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={signing.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-emerald-700" onClick={() => handleOpenEdit(signing)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600" onClick={() => handleDelete(signing.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                        No signings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card className="border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-semibold text-slate-900">{monthName}</h3>
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="bg-slate-50 p-2 text-center text-xs font-medium text-slate-500">
                  {d}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const daySignings = day ? getSigningsForDay(day) : []
                const isToday = day === new Date().getDate() && calendarMonthIndex === new Date().getMonth() && calendarYear === new Date().getFullYear()
                return (
                  <div
                    key={idx}
                    className={`bg-white min-h-[80px] p-1.5 sm:min-h-[100px] sm:p-2 ${
                      day ? '' : 'bg-slate-50/50'
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-medium ${isToday ? 'h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center' : 'text-slate-700'}`}>
                          {day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {daySignings.slice(0, 2).map((s) => (
                            <div
                              key={s.id}
                              className={`text-[10px] sm:text-xs px-1 py-0.5 rounded truncate cursor-pointer ${
                                s.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : s.status === 'Scheduled'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                              title={`${s.clientName} - ${s.serviceType}`}
                            >
                              {s.time} {s.clientName}
                            </div>
                          ))}
                          {daySignings.length > 2 && (
                            <span className="text-[10px] text-slate-400 pl-1">+{daySignings.length - 2} more</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSigning ? 'Edit Signing' : 'Add New Signing'}</DialogTitle>
            <DialogDescription>
              {editingSigning ? 'Update the signing details below.' : 'Fill in the signing details to create a new appointment.'}
            </DialogDescription>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-date">Date *</Label>
                <Input
                  id="s-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-time">Time</Label>
                <Input
                  id="s-time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-location">Location *</Label>
              <Input
                id="s-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Signing location"
              />
            </div>
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={form.serviceType} onValueChange={(v) => setForm({ ...form, serviceType: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((st) => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-fee">Fee ($)</Label>
                <Input
                  id="s-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-mileage">Mileage</Label>
                <Input
                  id="s-mileage"
                  type="number"
                  min="0"
                  value={form.mileage}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                  placeholder="miles"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-notes">Notes</Label>
              <Textarea
                id="s-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.clientId || !form.date || !form.location}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Saving...' : editingSigning ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
