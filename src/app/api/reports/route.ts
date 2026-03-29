import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getPeriodRange(period: string) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  switch (period) {
    case 'lastMonth': {
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
      const end = new Date(year, month, 0, 23, 59, 59, 999)
      return { start, end }
    }
    case 'thisYear': {
      const start = new Date(year, 0, 1, 0, 0, 0, 0)
      const end = new Date(year, 11, 31, 23, 59, 59, 999)
      return { start, end }
    }
    case 'all': {
      return { start: new Date(2000, 0, 1), end: new Date(2099, 11, 31, 23, 59, 59, 999) }
    }
    case 'thisMonth':
    default: {
      const start = new Date(year, month, 1, 0, 0, 0, 0)
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
      return { start, end }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'thisMonth'
    const { start, end } = getPeriodRange(period)
    const now = new Date()

    // Run all queries in parallel
    const [
      totalClients,
      totalSignings,
      paidInvoices,
      unpaidInvoices,
      overdueInvoices,
      periodExpenses,
      periodMileage,
      monthlyRevenue,
      signingsByStatus,
      expensesByCategory,
      topClients,
      recentSignings,
      upcomingSignings,
    ] = await Promise.all([
      // Total clients
      db.client.count(),

      // Total signings
      db.signing.count(),

      // Total revenue (sum of paid invoices)
      db.invoice.aggregate({
        where: { status: 'Paid' },
        _sum: { amount: true },
      }),

      // Pending payments (unpaid invoices)
      db.invoice.aggregate({
        where: { status: 'Unpaid' },
        _sum: { amount: true },
      }),

      // Overdue payments (dueDate < now && status != "Paid")
      db.invoice.aggregate({
        where: {
          dueDate: { lt: now },
          status: { not: 'Paid' },
        },
        _sum: { amount: true },
      }),

      // Total expenses for the period
      db.expense.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),

      // Total mileage for the period
      db.signing.aggregate({
        where: {
          date: { gte: start, lte: end },
          mileage: { not: null },
        },
        _sum: { mileage: true },
      }),

      // Monthly revenue (last 6 months)
      (() => {
        const months: { month: string; revenue: number }[] = []
        const promises = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const mStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
          const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
          const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

          promises.push(
            db.invoice
              .aggregate({
                where: {
                  status: 'Paid',
                  paidDate: { gte: mStart, lte: mEnd },
                },
                _sum: { amount: true },
              })
              .then((result) => {
                months.push({
                  month: label,
                  revenue: result._sum.amount ?? 0,
                })
              })
          )
        }
        return Promise.all(promises).then(() => months)
      })(),

      // Signings by status
      db.signing.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Expenses by category (for the period)
      db.expense.groupBy({
        by: ['category'],
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),

      // Top 5 clients by revenue (using Prisma queries instead of raw SQL)
      db.client.findMany({
        take: 5,
        include: {
          _count: { select: { signings: true, invoices: true } },
          invoices: {
            where: { status: 'Paid' },
            select: { amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }).then(clients =>
        clients.map(c => ({
          name: c.name,
          totalRevenue: c.invoices.reduce((sum, i) => sum + i.amount, 0),
          signingsCount: c._count.signings,
        })).sort((a, b) => b.totalRevenue - a.totalRevenue)
      ),

      // Recent 5 signings
      db.signing.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: { select: { id: true, name: true } },
        },
      }),

      // Upcoming 5 signings (date >= now)
      db.signing.findMany({
        where: { date: { gte: now } },
        orderBy: { date: 'asc' },
        take: 5,
        include: {
          client: { select: { id: true, name: true } },
        },
      }),
    ])

    return NextResponse.json({
      totalClients,
      totalSignings,
      totalRevenue: paidInvoices._sum.amount ?? 0,
      pendingPayments: unpaidInvoices._sum.amount ?? 0,
      overduePayments: overdueInvoices._sum.amount ?? 0,
      totalExpenses: periodExpenses._sum.amount ?? 0,
      totalMileage: periodMileage._sum.mileage ?? 0,
      monthlyRevenue,
      signingsByStatus: signingsByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      expensesByCategory: expensesByCategory.map((e) => ({
        category: e.category,
        amount: e._sum.amount ?? 0,
      })),
      topClients,
      recentSignings,
      upcomingSignings,
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
