/**
 * ReportsView — Analytics and reporting dashboard with revenue charts,
 * expense breakdowns, top clients, and signing type distribution.
 * Fetches data from /api/reports.
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Car,
  BarChart3,
  Users,
  ArrowUpRight,
} from 'lucide-react'

interface ReportData {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  monthlyRevenue: { month: string; revenue: number }[]
  expenseCategories: { category: string; amount: number }[]
  totalMileage: number
  mileageDeduction: number
  signingsByType: { type: string; count: number }[]
  topClients: { name: string; signingCount: number; totalRevenue: number }[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

const categoryColors: Record<string, string> = {
  Gas: '#059669',
  'Office Supplies': '#10b981',
  Insurance: '#f59e0b',
  Stamps: '#ef4444',
  Printing: '#6366f1',
  Marketing: '#ec4899',
  Phone: '#14b8a6',
  Software: '#8b5cf6',
  Travel: '#f97316',
  Miscellaneous: '#64748b',
  Other: '#94a3b8',
}

export default function ReportsView() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('thisMonth')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?period=${period}`)
      if (res.ok) {
        setData(await res.json())
      } else {
        // Demo data
        setData({
          totalIncome: 8425.0,
          totalExpenses: 626.03,
          netProfit: 7798.97,
          monthlyRevenue: [
            { month: 'Aug', revenue: 4100 },
            { month: 'Sep', revenue: 3800 },
            { month: 'Oct', revenue: 5200 },
            { month: 'Nov', revenue: 4600 },
            { month: 'Dec', revenue: 6800 },
            { month: 'Jan', revenue: 8425 },
          ],
          expenseCategories: [
            { category: 'Gas', amount: 227.80 },
            { category: 'Marketing', amount: 75.00 },
            { category: 'Phone', amount: 65.00 },
            { category: 'Travel', amount: 120.00 },
            { category: 'Office Supplies', amount: 32.75 },
            { category: 'Software', amount: 29.99 },
            { category: 'Insurance', amount: 45.00 },
            { category: 'Stamps', amount: 12.99 },
            { category: 'Printing', amount: 18.50 },
          ],
          totalMileage: 342,
          mileageDeduction: 229.14,
          signingsByType: [
            { type: 'Loan Signing', count: 18 },
            { type: 'General Notary', count: 14 },
            { type: 'Real Estate Closing', count: 8 },
            { type: 'Power of Attorney', count: 5 },
            { type: 'I-9 Verification', count: 4 },
            { type: 'Affidavit', count: 3 },
          ],
          topClients: [
            { name: 'David Wilson', signingCount: 15, totalRevenue: 3250.00 },
            { name: 'John Smith', signingCount: 12, totalRevenue: 2100.00 },
            { name: 'Mike Davis', signingCount: 8, totalRevenue: 1500.00 },
            { name: 'Sarah Johnson', signingCount: 5, totalRevenue: 875.00 },
            { name: 'Emily Brown', signingCount: 3, totalRevenue: 375.00 },
          ],
        })
      }
    } catch {
      setData({
        totalIncome: 8425.0,
        totalExpenses: 626.03,
        netProfit: 7798.97,
        monthlyRevenue: [
          { month: 'Aug', revenue: 4100 },
          { month: 'Sep', revenue: 3800 },
          { month: 'Oct', revenue: 5200 },
          { month: 'Nov', revenue: 4600 },
          { month: 'Dec', revenue: 6800 },
          { month: 'Jan', revenue: 8425 },
        ],
        expenseCategories: [
          { category: 'Gas', amount: 227.80 },
          { category: 'Marketing', amount: 75.00 },
          { category: 'Phone', amount: 65.00 },
          { category: 'Travel', amount: 120.00 },
          { category: 'Office Supplies', amount: 32.75 },
          { category: 'Software', amount: 29.99 },
          { category: 'Insurance', amount: 45.00 },
          { category: 'Stamps', amount: 12.99 },
          { category: 'Printing', amount: 18.50 },
        ],
        totalMileage: 342,
        mileageDeduction: 229.14,
        signingsByType: [
          { type: 'Loan Signing', count: 18 },
          { type: 'General Notary', count: 14 },
          { type: 'Real Estate Closing', count: 8 },
          { type: 'Power of Attorney', count: 5 },
          { type: 'I-9 Verification', count: 4 },
          { type: 'Affidavit', count: 3 },
        ],
        topClients: [
          { name: 'David Wilson', signingCount: 15, totalRevenue: 3250.00 },
          { name: 'John Smith', signingCount: 12, totalRevenue: 2100.00 },
          { name: 'Mike Davis', signingCount: 8, totalRevenue: 1500.00 },
          { name: 'Sarah Johnson', signingCount: 5, totalRevenue: 875.00 },
          { name: 'Emily Brown', signingCount: 3, totalRevenue: 375.00 },
        ],
      })
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  const maxRevenue = data.monthlyRevenue.length > 0
    ? Math.max(...data.monthlyRevenue.map((m) => m.revenue))
    : 1
  const totalExpenseAmount = data.expenseCategories.reduce((sum, e) => sum + e.amount, 0)
  const maxSignings = data.signingsByType.length > 0
    ? Math.max(...data.signingsByType.map((s) => s.count))
    : 1

  // Donut chart data
  const donutSegments = data.expenseCategories.map((cat) => ({
    ...cat,
    pct: totalExpenseAmount > 0 ? (cat.amount / totalExpenseAmount) * 100 : 0,
    color: categoryColors[cat.category] || '#94a3b8',
  }))

  let cumulativePct = 0
  const donutStyles = donutSegments.map((seg) => {
    const start = cumulativePct
    cumulativePct += seg.pct
    const end = cumulativePct
    const startAngle = (start / 100) * 360
    const endAngle = (end / 100) * 360
    const largeArc = seg.pct > 50 ? 1 : 0
    const r = 80
    const cx = 100
    const cy = 100
    const radStart = ((startAngle - 90) * Math.PI) / 180
    const radEnd = ((endAngle - 90) * Math.PI) / 180
    const x1 = cx + r * Math.cos(radStart)
    const y1 = cy + r * Math.sin(radStart)
    const x2 = cx + r * Math.cos(radEnd)
    const y2 = cy + r * Math.sin(radEnd)
    const d = seg.pct >= 99.9
      ? `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
      : `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
    return { ...seg, d, startAngle, endAngle }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Insights into your notary business performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="thisYear">This Year</SelectItem>
            <SelectItem value="allTime">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Income</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(data.totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(data.totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Net Profit</p>
                <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(data.netProfit)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Profit margin</span>
                <span className="font-semibold">
                  {data.totalIncome > 0 ? ((data.netProfit / data.totalIncome) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${data.totalIncome > 0 ? Math.max(0, (data.netProfit / data.totalIncome) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-[220px] mt-2">
              {data.monthlyRevenue.map((m) => {
                const height = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">
                      {m.revenue >= 1000 ? `$${(m.revenue / 1000).toFixed(1)}k` : `$${m.revenue}`}
                    </span>
                    <div className="w-full flex justify-center">
                      <div
                        className="w-10 rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-colors duration-200 min-h-[8px]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Expense Category Donut */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-red-500" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* CSS Donut */}
              <div className="relative shrink-0">
                <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                  {donutStyles.map((seg, i) => (
                    <path
                      key={i}
                      d={seg.d}
                      fill={seg.color}
                      stroke="white"
                      strokeWidth="2"
                      className="transition-all duration-300 hover:opacity-80"
                    >
                      <title>{seg.category}: {formatCurrency(seg.amount)} ({seg.pct.toFixed(1)}%)</title>
                    </path>
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-500">Total</span>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(totalExpenseAmount)}</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2 max-h-[200px] overflow-y-auto w-full">
                {donutSegments.map((seg) => (
                  <div key={seg.category} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-slate-700 flex-1 truncate">{seg.category}</span>
                    <span className="text-slate-900 font-medium">{formatCurrency(seg.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mileage + Signings by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mileage Summary */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-600" />
              Mileage Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-center">
                <p className="text-2xl font-bold text-blue-700">{data.totalMileage.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">Total Miles</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(data.mileageDeduction)}</p>
                <p className="text-xs text-emerald-600 mt-1">IRS Deduction ($0.67/mi)</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              Based on current IRS standard mileage rate of $0.67 per mile
            </p>
          </CardContent>
        </Card>

        {/* Signings by Service Type */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Signings by Service Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.signingsByType.map((s) => {
                const pct = maxSignings > 0 ? (s.count / maxSignings) * 100 : 0
                const colors = [
                  'bg-emerald-500',
                  'bg-blue-500',
                  'bg-purple-500',
                  'bg-amber-500',
                  'bg-pink-500',
                  'bg-teal-500',
                ]
                const colorIdx = data.signingsByType.indexOf(s) % colors.length
                return (
                  <div key={s.type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{s.type}</span>
                      <span className="text-slate-500">{s.count} signings</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[colorIdx]} transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            Top Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Rank</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Client</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4 text-center hidden sm:table-cell">Signings</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topClients.map((client, idx) => (
                  <tr key={client.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-700'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-600'
                            : idx === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm font-medium text-slate-900">{client.name}</td>
                    <td className="py-3 pr-4 text-sm text-slate-600 text-center hidden sm:table-cell">{client.signingCount}</td>
                    <td className="py-3 text-sm font-semibold text-emerald-700">{formatCurrency(client.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
