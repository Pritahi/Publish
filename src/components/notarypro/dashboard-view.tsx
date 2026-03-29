'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DollarSign,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  MapPin,
} from 'lucide-react'

interface DashboardStats {
  totalRevenue: number
  pendingPayments: number
  upcomingSignings: number
  totalClients: number
  revenueChange: number
}

interface Signing {
  id: string
  date: string
  clientName: string
  serviceType: string
  fee: number
  status: string
  time?: string
  location?: string
}

interface Invoice {
  id: string
  invoiceNo: string
  clientName: string
  amount: number
  dueDate: string
}

interface MonthlyRevenue {
  month: string
  revenue: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Cancelled: 'bg-red-100 text-red-800 border-red-200',
    Unpaid: 'bg-amber-100 text-amber-800 border-amber-200',
    Overdue: 'bg-red-100 text-red-800 border-red-200',
    Paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }
  return (
    <Badge variant="outline" className={styles[status] || ''}>
      {status}
    </Badge>
  )
}

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentSignings, setRecentSignings] = useState<Signing[]>([])
  const [upcomingSignings, setUpcomingSignings] = useState<Signing[]>([])
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, recentRes, upcomingRes, overdueRes] = await Promise.allSettled([
        fetch('/api/reports'),
        fetch('/api/signings?status=Scheduled&limit=5'),
        fetch('/api/signings?status=Scheduled&upcoming=true&limit=3'),
        fetch('/api/invoices?status=Overdue'),
      ])

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const data = await statsRes.value.json()
        setStats(data)
        if (data.monthlyRevenue) setMonthlyRevenue(data.monthlyRevenue)
      }

      if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
        const data = await recentRes.value.json()
        setRecentSignings(data)
      }

      if (upcomingRes.status === 'fulfilled' && upcomingRes.value.ok) {
        const data = await upcomingRes.value.json()
        setUpcomingSignings(data)
      }

      if (overdueRes.status === 'fulfilled' && overdueRes.value.ok) {
        const data = await overdueRes.value.json()
        setOverdueInvoices(data)
      }
    } catch {
      // Use fallback data for demo
      setStats({
        totalRevenue: 24580.5,
        pendingPayments: 3200.0,
        upcomingSignings: 12,
        totalClients: 48,
        revenueChange: 15.3,
      })
      setMonthlyRevenue([
        { month: 'Jul', revenue: 3200 },
        { month: 'Aug', revenue: 4100 },
        { month: 'Sep', revenue: 3800 },
        { month: 'Oct', revenue: 5200 },
        { month: 'Nov', revenue: 4600 },
        { month: 'Dec', revenue: 3680 },
      ])
      setRecentSignings([
        { id: '1', date: '2025-01-10', clientName: 'John Smith', serviceType: 'Loan Signing', fee: 175, status: 'Completed' },
        { id: '2', date: '2025-01-12', clientName: 'Sarah Johnson', serviceType: 'Real Estate Closing', fee: 250, status: 'Completed' },
        { id: '3', date: '2025-01-14', clientName: 'Mike Davis', serviceType: 'General Notary', fee: 75, status: 'Scheduled' },
        { id: '4', date: '2025-01-15', clientName: 'Emily Brown', serviceType: 'Power of Attorney', fee: 125, status: 'Scheduled' },
        { id: '5', date: '2025-01-16', clientName: 'David Wilson', serviceType: 'I-9 Verification', fee: 50, status: 'Cancelled' },
      ])
      setUpcomingSignings([
        { id: '3', date: '2025-01-14', time: '10:00 AM', clientName: 'Mike Davis', location: '123 Main St, Suite 400', serviceType: 'General Notary', fee: 75, status: 'Scheduled' },
        { id: '4', date: '2025-01-15', time: '2:30 PM', clientName: 'Emily Brown', location: '456 Oak Ave, Office 12', serviceType: 'Power of Attorney', fee: 125, status: 'Scheduled' },
        { id: '6', date: '2025-01-17', time: '9:00 AM', clientName: 'Lisa Anderson', location: '789 Pine Rd, Bldg C', serviceType: 'Affidavit', fee: 100, status: 'Scheduled' },
      ])
      setOverdueInvoices([
        { id: '1', invoiceNo: 'INV-001', clientName: 'Robert Taylor', amount: 200, dueDate: '2024-12-15' },
        { id: '2', invoiceNo: 'INV-003', clientName: 'Amanda Clark', amount: 150, dueDate: '2024-12-20' },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  const maxRevenue = monthlyRevenue.length > 0
    ? Math.max(...monthlyRevenue.map((m) => m.revenue))
    : 1

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      trend: stats?.revenueChange || 0,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Pending Payments',
      value: formatCurrency(stats?.pendingPayments || 0),
      icon: Clock,
      trend: 0,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Upcoming Signings',
      value: stats?.upcomingSignings || 0,
      icon: Calendar,
      trend: 0,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Total Clients',
      value: stats?.totalClients || 0,
      icon: Users,
      trend: 0,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here&apos;s your business overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="border-slate-200/60">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                {card.trend !== 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {card.trend > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${card.trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {card.trend > 0 ? '+' : ''}{card.trend}% vs last month
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length > 0 ? (
              <div className="flex items-end gap-3 h-[200px] mt-2">
                {monthlyRevenue.map((m) => {
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
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-slate-400">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Signings */}
        <Card className="border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Upcoming Signings</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSignings.length > 0 ? (
              <div className="space-y-3">
                {upcomingSignings.map((signing) => (
                  <div
                    key={signing.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-blue-600 leading-none">
                        {new Date(signing.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold text-blue-700 leading-none">
                        {new Date(signing.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{signing.clientName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {signing.time && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {signing.time}
                          </span>
                        )}
                        {signing.location && (
                          <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {signing.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-slate-400">
                No upcoming signings
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Signings */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">Recent Signings</CardTitle>
            <StatusBadge status="Scheduled" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Date</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Client</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4 hidden sm:table-cell">Service Type</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">Fee</th>
                  <th className="text-left text-xs font-medium text-slate-500 pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSignings.length > 0 ? (
                  recentSignings.map((signing) => (
                    <tr key={signing.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 pr-4 text-sm text-slate-700">{formatDate(signing.date)}</td>
                      <td className="py-3 pr-4 text-sm font-medium text-slate-900">{signing.clientName}</td>
                      <td className="py-3 pr-4 text-sm text-slate-600 hidden sm:table-cell">{signing.serviceType}</td>
                      <td className="py-3 pr-4 text-sm font-medium text-slate-900">{formatCurrency(signing.fee)}</td>
                      <td className="py-3"><StatusBadge status={signing.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                      No recent signings
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Invoices Alert */}
      {overdueInvoices.length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-base font-semibold text-red-900">Overdue Invoices</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{invoice.clientName}</p>
                    <p className="text-xs text-slate-500">
                      {invoice.invoiceNo} &middot; Due: {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-600">{formatCurrency(invoice.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
