'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''
  const headers = Object.keys(data[0])
  const headerRow = headers.map(escapeCSV).join(',')
  const rows = data.map((row) =>
    headers.map((h) => escapeCSV(String(row[h] ?? ''))).join(',')
  )
  return [headerRow, ...rows].join('\n')
}

export function downloadCSV(data: Record<string, any>[], filename: string) {
  const csv = convertToCSV(data as Record<string, unknown>[])
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast.success(`CSV exported: ${a.download}`)
}

interface ReportData {
  totalIncome?: number
  totalExpenses?: number
  netProfit?: number
  totalMileage?: number
  invoices?: Array<{
    invoiceNo?: string
    clientName?: string
    amount?: number
    status?: string
    issuedDate?: string
  }>
  expenses?: Array<{
    date?: string
    category?: string
    description?: string
    amount?: number
  }>
  signings?: Array<{
    date?: string
    clientName?: string
    serviceType?: string
    fee?: number
    status?: string
    mileage?: number | null
  }>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function exportReportToCSV(data: ReportData, filename?: string) {
  const lines: string[] = []

  // Section: Summary
  lines.push('=== SUMMARY ===')
  lines.push('Metric,Value')
  lines.push(`Total Revenue,${formatCurrency(data.totalIncome ?? 0)}`)
  lines.push(`Total Expenses,${formatCurrency(data.totalExpenses ?? 0)}`)
  lines.push(`Net Profit,${formatCurrency(data.netProfit ?? 0)}`)
  lines.push(`Total Mileage,${data.totalMileage ?? 0} miles`)
  lines.push('')

  // Section: Invoices
  lines.push('=== INVOICES ===')
  if (data.invoices && data.invoices.length > 0) {
    lines.push('Invoice #,Client,Amount,Status,Date')
    for (const inv of data.invoices) {
      lines.push(
        `${inv.invoiceNo ?? ''},${inv.clientName ?? ''},${formatCurrency(inv.amount ?? 0)},${inv.status ?? ''},${inv.issuedDate ?? ''}`
      )
    }
  } else {
    lines.push('No invoice data')
  }
  lines.push('')

  // Section: Expenses
  lines.push('=== EXPENSES ===')
  if (data.expenses && data.expenses.length > 0) {
    lines.push('Date,Category,Description,Amount')
    for (const exp of data.expenses) {
      lines.push(
        `${exp.date ?? ''},${exp.category ?? ''},${exp.description ?? ''},${formatCurrency(exp.amount ?? 0)}`
      )
    }
  } else {
    lines.push('No expense data')
  }
  lines.push('')

  // Section: Signings
  lines.push('=== SIGNINGS ===')
  if (data.signings && data.signings.length > 0) {
    lines.push('Date,Client,Service Type,Fee,Status,Mileage')
    for (const sig of data.signings) {
      lines.push(
        `${sig.date ?? ''},${sig.clientName ?? ''},${sig.serviceType ?? ''},${formatCurrency(sig.fee ?? 0)},${sig.status ?? ''},${sig.mileage ?? ''}`
      )
    }
  } else {
    lines.push('No signing data')
  }

  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? 'notarypro-report.csv'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast.success('Report exported as CSV')
}

export function CSVExportButton({
  onClick,
  label = 'Export CSV',
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
