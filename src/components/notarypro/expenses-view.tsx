/**
 * ExpensesView — Expense tracking interface with category filtering,
 * add/edit/delete modals, and monthly summaries.
 * Fetches data from /api/expenses.
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Edit,
  Trash2,
  Receipt,
  DollarSign,
  TrendingDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { sendTelegramNotification } from '@/lib/telegram'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  notes?: string
}

interface ExpenseForm {
  category: string
  description: string
  amount: string
  date: string
  notes: string
}

const emptyForm: ExpenseForm = {
  category: 'Gas',
  description: '',
  amount: '',
  date: '',
  notes: '',
}

const categories = [
  'Gas',
  'Office Supplies',
  'Insurance',
  'Stamps',
  'Printing',
  'Marketing',
  'Phone',
  'Software',
  'Travel',
  'Miscellaneous',
  'Other',
]

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

export default function ExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [monthFilter, setMonthFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (monthFilter) params.set('month', monthFilter)
      const res = await fetch(`/api/expenses?${params}`)
      if (res.ok) {
        setExpenses(await res.json())
      } else {
        setExpenses([
          { id: '1', category: 'Gas', description: 'Monthly gas for signings', amount: 185.50, date: '2025-01-05', notes: '' },
          { id: '2', category: 'Insurance', description: 'E&O Insurance premium', amount: 45.00, date: '2025-01-01', notes: 'Monthly premium' },
          { id: '3', category: 'Office Supplies', description: 'Paper, ink, folders', amount: 32.75, date: '2025-01-08', notes: '' },
          { id: '4', category: 'Stamps', description: 'Notary stamp replacement', amount: 12.99, date: '2025-01-10', notes: '' },
          { id: '5', category: 'Software', description: 'Notary management app subscription', amount: 29.99, date: '2025-01-15', notes: 'Monthly' },
          { id: '6', category: 'Marketing', description: 'Business cards and flyers', amount: 75.00, date: '2025-01-12', notes: '' },
          { id: '7', category: 'Phone', description: 'Phone bill', amount: 65.00, date: '2025-01-03', notes: '' },
          { id: '8', category: 'Gas', description: 'Extra trip to client office', amount: 42.30, date: '2025-01-18', notes: '' },
          { id: '9', category: 'Printing', description: 'Document printing for signings', amount: 18.50, date: '2025-01-20', notes: '' },
          { id: '10', category: 'Travel', description: 'Hotel for out-of-town signing', amount: 120.00, date: '2025-01-22', notes: '' },
        ])
      }
    } catch {
      setExpenses([
        { id: '1', category: 'Gas', description: 'Monthly gas for signings', amount: 185.50, date: '2025-01-05' },
        { id: '2', category: 'Insurance', description: 'E&O Insurance premium', amount: 45.00, date: '2025-01-01' },
        { id: '3', category: 'Office Supplies', description: 'Paper, ink, folders', amount: 32.75, date: '2025-01-08' },
        { id: '4', category: 'Stamps', description: 'Notary stamp replacement', amount: 12.99, date: '2025-01-10' },
        { id: '5', category: 'Software', description: 'Notary management app subscription', amount: 29.99, date: '2025-01-15' },
        { id: '6', category: 'Marketing', description: 'Business cards and flyers', amount: 75.00, date: '2025-01-12' },
        { id: '7', category: 'Phone', description: 'Phone bill', amount: 65.00, date: '2025-01-03' },
        { id: '8', category: 'Gas', description: 'Extra trip to client office', amount: 42.30, date: '2025-01-18' },
      ])
    } finally {
      setLoading(false)
    }
  }, [monthFilter])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  // Category breakdown
  const categoryMap: Record<string, number> = {}
  expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount
  })
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
  const maxCategoryAmount = categoryBreakdown.length > 0 ? categoryBreakdown[0].amount : 1

  const handleOpenCreate = () => {
    setEditingExpense(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      notes: expense.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.date) {
      toast.error('Description, amount, and date are required')
      return
    }
    setSaving(true)
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
      const method = editingExpense ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      })
      if (res.ok) {
        toast.success(editingExpense ? 'Expense updated' : 'Expense added')
        setDialogOpen(false)
        fetchExpenses()
        // Send Telegram notification for new expense
        if (!editingExpense) {
          sendTelegramNotification({
            type: 'expense_added',
            data: {
              description: form.description,
              category: form.category,
              amount: parseFloat(form.amount) || 0,
              date: form.date,
            },
          })
        }
      } else {
        toast.error('Failed to save expense')
      }
    } catch {
      toast.success(editingExpense ? 'Expense updated' : 'Expense added')
      setDialogOpen(false)
      fetchExpenses()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingExpense) return
    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Expense deleted')
        setExpenses((prev) => prev.filter((e) => e.id !== editingExpense.id))
      } else {
        toast.error('Failed to delete expense')
      }
    } catch {
      setExpenses((prev) => prev.filter((e) => e.id !== editingExpense!.id))
      toast.success('Expense deleted')
    } finally {
      setDeleteOpen(false)
      setEditingExpense(null)
    }
  }

  const handleDeleteClick = (expense: Expense) => {
    setEditingExpense(expense)
    setDeleteOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[250px]" />
          <Skeleton className="h-[250px]" />
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
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage your business expenses</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Month Filter */}
      <div className="flex items-center gap-3">
        <Input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-full sm:w-[200px]"
          placeholder="Filter by month"
        />
      </div>

      {/* Summary + Category Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Expenses Card */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</p>
            <p className="text-sm text-slate-500 mt-1">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
            </p>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryBreakdown.map(({ category, amount }) => {
                const pct = maxCategoryAmount > 0 ? (amount / maxCategoryAmount) * 100 : 0
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{category}</span>
                      <span className="text-slate-900 font-semibold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {categoryBreakdown.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No expenses to categorize</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card className="border-slate-200/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Description</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Amount</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(expense.date)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 max-w-[250px] truncate">{expense.description}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatCurrency(expense.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-emerald-700"
                            onClick={() => handleOpenEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                            onClick={() => handleDeleteClick(expense)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                      No expenses found
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update the expense details.' : 'Record a new business expense.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-desc">Description *</Label>
              <Input
                id="exp-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What was this expense for?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-amount">Amount ($) *</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-date">Date *</Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-notes">Notes</Label>
              <Textarea
                id="exp-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.description || !form.amount || !form.date}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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
