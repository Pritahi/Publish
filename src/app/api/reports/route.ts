import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'

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
    case 'allTime': {
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
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'thisMonth'
    const { start, end } = getPeriodRange(period)
    const now = new Date()

    // Run all queries in parallel, scoped to userId
    const [
      totalClients,
      totalSignings,
      totalRevenue,
      pendingPayments,
      overduePayments,
      periodExpenses,
      periodMileage,
      monthlyRevenue,
      expensesByCategory,
      topClients,
      recentSignings,
      upcomingSignings,
      signingsByType,
    ] = await Promise.all([
      // Total clients
      db.client.count({ where: { userId } }),

      // Total signings
      db.signing.count({ where: { userId } }),

      // Total revenue (sum of paid invoices) — all time
      db.invoice.aggregate({
        where: { status: 'Paid', userId },
        _sum: { amount: true },
      }),

      // Pending payments (unpaid invoices)
      db.invoice.aggregate({
        where: { status: 'Unpaid', userId },
        _sum: { amount: true },
      }),

      // Overdue payments
      db.invoice.aggregate({
        where: {
          dueDate: { lt: now },
          status: { not: 'Paid' },
          userId,
        },
        _sum: { amount: true },
      }),

      // Total expenses for the selected period
      db.expense.aggregate({
        where: { date: { gte: start, lte: end }, userId },
        _sum: { amount: true },
      }),

      // Total mileage for the selected period
      db.signing.aggregate({
        where: {
          date: { gte: start, lte: end },
          mileage: { not: null },
          userId,
        },
        _sum: { mileage: true },
      }),

      // Monthly revenue (last 6 months) — uses paid invoices with paidDate
      (() => {
        const months: { month: string; revenue: number }[] = []
        const promises: Promise<void>[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const mStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
          const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
          const label = d.toLocaleDateString('en-US', { month: 'short' })

          promises.push(
            db.invoice
              .aggregate({
                where: {
                  status: 'Paid',
                  paidDate: { gte: mStart, lte: mEnd },
                  userId,
                },
                _sum: { amount: true },
              })
              .then((result) => {
                months.push({
                  month: label,
                  revenue: Number(result._sum.amount ?? 0),
                })
              })
          )
        }
        return Promise.all(promises).then(() => months)
      })(),

      // Expenses by category (for the selected period)
      db.expense.groupBy({
        by: ['category'],
        where: { date: { gte: start, lte: end }, userId },
        _sum: { amount: true },
      }),

      // Top 5 clients by revenue
      db.client.findMany({
        where: { userId },
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
          totalRevenue: c.invoices.reduce((sum, i) => sum + Number(i.amount), 0),
          signingCount: c._count.signings,
        })).sort((a, b) => b.totalRevenue - a.totalRevenue)
      ),

      // Recent 5 signings
      db.signing.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: { select: { id: true, name: true } },
        },
      }),

      // Upcoming 5 signings (date >= now)
      db.signing.findMany({
        where: { date: { gte: now }, userId },
        orderBy: { date: 'asc' },
        take: 5,
        include: {
          client: { select: { id: true, name: true } },
        },
      }),

      // Signings by service type (for the selected period)
      db.signing.groupBy({
        by: ['serviceType'],
        where: { date: { gte: start, lte: end }, userId },
        _count: { serviceType: true },
      }),
    ])

    // Calculate derived values
    const totalIncome = Number(totalRevenue._sum.amount ?? 0)
    const totalExp = Number(periodExpenses._sum.amount ?? 0)
    const mileage = Number(periodMileage._sum.mileage ?? 0)
    const completedSignings = totalSignings

    return NextResponse.json({
      // Dashboard fields
      totalClients,
      totalSignings,
      totalRevenue: totalIncome,
      pendingPayments: Number(pendingPayments._sum.amount ?? 0),
      overduePayments: Number(overduePayments._sum.amount ?? 0),
      totalExpenses: totalExp,
      totalMileage: mileage,

      // Reports page fields (matching frontend interface)
      totalIncome,
      netProfit: totalIncome - totalExp,
      mileageDeduction: mileage * 0.67,
      completedSignings,

      monthlyRevenue,
      expenseCategories: expensesByCategory.map(e => ({
        category: e.category,
        amount: Number(e._sum.amount ?? 0),
      })),
      signingsByType: signingsByType.map(s => ({
        type: s.serviceType,
        count: s._count.serviceType,
      })),
      topClients,

      recentSignings: recentSignings.map(s => ({
        ...s,
        fee: Number(s.fee),
        mileage: s.mileage !== null ? Number(s.mileage) : null,
      })),
      upcomingSignings: upcomingSignings.map(s => ({
        ...s,
        fee: Number(s.fee),
        mileage: s.mileage !== null ? Number(s.mileage) : null,
      })),
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
