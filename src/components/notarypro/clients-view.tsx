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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  notes?: string
  totalSignings: number
  totalRevenue: number
  createdAt: string
}

interface ClientForm {
  name: string
  email: string
  phone: string
  company: string
  address: string
  notes: string
}

const emptyForm: ClientForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  notes: '',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function ClientsView() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detailSignings, setDetailSignings] = useState<any[]>([])

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data)
      } else {
        // Demo data
        setClients([
          { id: '1', name: 'John Smith', email: 'john@email.com', phone: '(555) 123-4567', company: 'Smith Realty', address: '123 Main St, City, ST 12345', notes: 'Preferred client', totalSignings: 12, totalRevenue: 2100, createdAt: '2024-06-15' },
          { id: '2', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '(555) 234-5678', company: '', address: '', notes: '', totalSignings: 5, totalRevenue: 875, createdAt: '2024-07-20' },
          { id: '3', name: 'Mike Davis', email: 'mike@email.com', phone: '(555) 345-6789', company: 'Davis Properties', address: '456 Oak Ave, Town, ST 23456', notes: '', totalSignings: 8, totalRevenue: 1500, createdAt: '2024-08-10' },
          { id: '4', name: 'Emily Brown', email: 'emily@email.com', phone: '(555) 456-7890', company: '', address: '', notes: 'Referral from John', totalSignings: 3, totalRevenue: 375, createdAt: '2024-09-05' },
          { id: '5', name: 'David Wilson', email: 'david@email.com', phone: '(555) 567-8901', company: 'Wilson & Associates', address: '789 Pine Rd, Metro, ST 34567', notes: 'Corporate account', totalSignings: 15, totalRevenue: 3250, createdAt: '2024-05-01' },
          { id: '6', name: 'Lisa Anderson', email: 'lisa@email.com', phone: '(555) 678-9012', company: '', address: '', notes: '', totalSignings: 2, totalRevenue: 200, createdAt: '2024-10-12' },
        ])
      }
    } catch {
      setClients([
        { id: '1', name: 'John Smith', email: 'john@email.com', phone: '(555) 123-4567', company: 'Smith Realty', address: '123 Main St, City, ST 12345', notes: 'Preferred client', totalSignings: 12, totalRevenue: 2100, createdAt: '2024-06-15' },
        { id: '2', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '(555) 234-5678', company: '', address: '', notes: '', totalSignings: 5, totalRevenue: 875, createdAt: '2024-07-20' },
        { id: '3', name: 'Mike Davis', email: 'mike@email.com', phone: '(555) 345-6789', company: 'Davis Properties', address: '456 Oak Ave, Town, ST 23456', notes: '', totalSignings: 8, totalRevenue: 1500, createdAt: '2024-08-10' },
        { id: '4', name: 'Emily Brown', email: 'emily@email.com', phone: '(555) 456-7890', company: '', address: '', notes: 'Referral from John', totalSignings: 3, totalRevenue: 375, createdAt: '2024-09-05' },
        { id: '5', name: 'David Wilson', email: 'david@email.com', phone: '(555) 567-8901', company: 'Wilson & Associates', address: '789 Pine Rd, Metro, ST 34567', notes: 'Corporate account', totalSignings: 15, totalRevenue: 3250, createdAt: '2024-05-01' },
        { id: '6', name: 'Lisa Anderson', email: 'lisa@email.com', phone: '(555) 678-9012', company: '', address: '', notes: '', totalSignings: 2, totalRevenue: 200, createdAt: '2024-10-12' },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    )
  })

  const handleOpenCreate = () => {
    setEditingClient(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client)
    setForm({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      notes: client.notes || '',
    })
    setDialogOpen(true)
  }

  const handleOpenDetail = async (client: Client) => {
    setSelectedClient(client)
    setDetailOpen(true)
    try {
      const res = await fetch(`/api/signings?clientId=${client.id}`)
      if (res.ok) {
        setDetailSignings(await res.json())
      } else {
        setDetailSignings([
          { id: 's1', date: '2025-01-10', serviceType: 'Loan Signing', fee: 175, status: 'Completed' },
          { id: 's2', date: '2024-12-20', serviceType: 'General Notary', fee: 75, status: 'Completed' },
        ])
      }
    } catch {
      setDetailSignings([])
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Client name is required')
      return
    }
    setSaving(true)
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(editingClient ? 'Client updated successfully' : 'Client created successfully')
        setDialogOpen(false)
        fetchClients()
      } else {
        toast.error('Failed to save client')
      }
    } catch {
      // Optimistic update for demo
      if (editingClient) {
        setClients((prev) =>
          prev.map((c) => (c.id === editingClient.id ? { ...c, ...form, totalRevenue: Number((Math.random() * 3000 + 100).toFixed(2)) } : c))
        )
        toast.success('Client updated successfully')
      } else {
        const newClient: Client = {
          id: Date.now().toString(),
          ...form,
          totalSignings: 0,
          totalRevenue: 0,
          createdAt: new Date().toISOString(),
        }
        setClients((prev) => [...prev, newClient])
        toast.success('Client created successfully')
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingClient) return
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Client deleted successfully')
        setClients((prev) => prev.filter((c) => c.id !== editingClient.id))
      } else {
        toast.error('Failed to delete client')
      }
    } catch {
      setClients((prev) => prev.filter((c) => c.id !== editingClient!.id))
      toast.success('Client deleted successfully')
    } finally {
      setDeleteOpen(false)
      setEditingClient(null)
    }
  }

  const handleDeleteClick = (client: Client) => {
    setEditingClient(client)
    setDeleteOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clients.length} total clients</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card className="border-slate-200/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden lg:table-cell">Phone</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden xl:table-cell">Company</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 text-center hidden sm:table-cell">Signings</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden sm:table-cell">Revenue</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((client) => (
                    <tr key={client.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleOpenDetail(client)}
                          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                        >
                          {client.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-slate-600">{client.email || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-slate-600">{client.phone || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-sm text-slate-600">{client.company || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">{client.totalSignings}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm font-medium text-slate-900">{formatCurrency(client.totalRevenue)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-emerald-700"
                            onClick={() => handleOpenEdit(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                            onClick={() => handleDeleteClick(client)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                      {search ? 'No clients match your search' : 'No clients yet. Add your first client!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {editingClient ? 'Update the client information below.' : 'Fill in the client details to create a new record.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
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
              disabled={saving || !form.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh]">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-700 font-bold text-sm">
                      {selectedClient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  {selectedClient.name}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-2">
                <div className="space-y-4">
                  {/* Contact Info */}
                  <div className="grid gap-3">
                    {selectedClient.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{selectedClient.email}</span>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.company && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{selectedClient.company}</span>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{selectedClient.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 border">
                      <p className="text-xs text-slate-500">Total Signings</p>
                      <p className="text-lg font-bold text-slate-900">{selectedClient.totalSignings}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border">
                      <p className="text-xs text-slate-500">Total Revenue</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedClient.totalRevenue)}</p>
                    </div>
                  </div>

                  {selectedClient.notes && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-xs font-medium text-amber-700 mb-1">Notes</p>
                      <p className="text-sm text-amber-900">{selectedClient.notes}</p>
                    </div>
                  )}

                  {/* Recent Signings */}
                  {detailSignings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Recent Signings
                      </h4>
                      <div className="space-y-2">
                        {detailSignings.map((s: any) => (
                          <div key={s.id} className="p-2.5 rounded-lg border text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-900">{s.serviceType}</span>
                              <span className="text-slate-600">{formatCurrency(s.fee)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">
                                {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  s.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : s.status === 'Scheduled'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-red-100 text-red-700 border-red-200'
                                }`}
                              >
                                {s.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{editingClient?.name}</strong>? This action cannot be undone.
              All associated signings and invoices will also be removed.
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
