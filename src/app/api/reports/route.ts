import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj } from '@/lib/db'
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

/** Sum a numeric field from an array of objects */
function sumField(data: Record<string, unknown>[], field: string): number {
  return data.reduce((sum, row) => sum + Number(row[field] ?? 0), 0)
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

    const db = getDb()

    // ── Run all independent queries in parallel ──
    const [
      clientsCountRes,
      signingsCountRes,
      paidInvoicesRes,
      unpaidInvoicesRes,
      overdueInvoicesRes,
      periodExpensesRes,
      periodMileageRes,
      recentSigningsRes,
      upcomingSigningsRes,
      expensesForCategoryRes,
      signingsForTypeRes,
      allClientsRes,
      paidInvoicesAllRes,
    ] = await Promise.all([
      // Total clients count
      db.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId),

      // Total signings count
      db.from('signings').select('*', { count: 'exact', head: true }).eq('user_id', userId),

      // Total revenue — all paid invoices
      db.from('invoices').select('amount').eq('status', 'Paid').eq('user_id', userId),

      // Pending payments — unpaid invoices
      db.from('invoices').select('amount').eq('status', 'Unpaid').eq('user_id', userId),

      // Overdue payments — not Paid and due_date < now
      db
        .from('invoices')
        .select('amount')
        .neq('status', 'Paid')
        .lt('due_date', now.toISOString())
        .eq('user_id', userId),

      // Period expenses
      db
        .from('expenses')
        .select('amount')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())
        .eq('user_id', userId),

      // Period mileage
      db
        .from('signings')
        .select('mileage')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())
        .not('mileage', 'is', null)
        .eq('user_id', userId),

      // Recent 5 signings (with client info)
      db
        .from('signings')
        .select('*, clients(id, name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Upcoming 5 signings (date >= now)
      db
        .from('signings')
        .select('*, clients(id, name)')
        .eq('user_id', userId)
        .gte('date', now.toISOString())
        .order('date', { ascending: true })
        .limit(5),

      // Expenses by category for the selected period
      db
        .from('expenses')
        .select('category, amount')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())
        .eq('user_id', userId),

      // Signings by service type for the selected period
      db
        .from('signings')
        .select('service_type')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())
        .eq('user_id', userId),

      // All clients (for topClients computation)
      db.from('clients').select('id, name').eq('user_id', userId),

      // All paid invoices with client_id (for topClients revenue computation)
      db.from('invoices').select('client_id, amount').eq('status', 'Paid').eq('user_id', userId),
    ])

    // ── Monthly revenue (last 6 months) — sequential per-month queries ──
    const monthlyRevenue: { month: string; revenue: number }[] = []
    const monthPromises: Promise<void>[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const label = d.toLocaleDateString('en-US', { month: 'short' })

      monthPromises.push(
        db
          .from('invoices')
          .select('amount')
          .eq('status', 'Paid')
          .gte('paid_date', mStart.toISOString())
          .lte('paid_date', mEnd.toISOString())
          .eq('user_id', userId)
          .then((res) => {
            const data = (res.data ?? []) as Record<string, unknown>[]
            monthlyRevenue.push({
              month: label,
              revenue: sumField(data, 'amount'),
            })
          }) as Promise<void>
      )
    }
    await Promise.all(monthPromises)

    // ── Compute aggregates from query results ──
    const totalClientsCount = clientsCountRes.count ?? 0
    const totalSigningsCount = signingsCountRes.count ?? 0

    const paidData = (paidInvoicesRes.data ?? []) as Record<string, unknown>[]
    const totalIncome = sumField(paidData, 'amount')

    const unpaidData = (unpaidInvoicesRes.data ?? []) as Record<string, unknown>[]
    const pendingPayments = sumField(unpaidData, 'amount')

    const overdueData = (overdueInvoicesRes.data ?? []) as Record<string, unknown>[]
    const overduePayments = sumField(overdueData, 'amount')

    const expData = (periodExpensesRes.data ?? []) as Record<string, unknown>[]
    const totalExp = sumField(expData, 'amount')

    const mileageData = (periodMileageRes.data ?? []) as Record<string, unknown>[]
    const mileage = sumField(mileageData, 'mileage')

    // ── Expenses by category ──
    const expCatData = (expensesForCategoryRes.data ?? []) as Record<string, unknown>[]
    const categoryMap = new Map<string, number>()
    for (const row of expCatData) {
      const cat = String(row.category)
      const amt = Number(row.amount ?? 0)
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + amt)
    }
    const expenseCategories = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }))

    // ── Signings by service type ──
    const sigTypeData = (signingsForTypeRes.data ?? []) as Record<string, unknown>[]
    const typeMap = new Map<string, number>()
    for (const row of sigTypeData) {
      const t = String(row.service_type)
      typeMap.set(t, (typeMap.get(t) ?? 0) + 1)
    }
    const signingsByType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }))

    // ── Top 5 clients by revenue ──
    const allClients = (allClientsRes.data ?? []) as Record<string, unknown>[]
    const paidInvoicesAll = (paidInvoicesAllRes.data ?? []) as Record<string, unknown>[]

    // Build revenue map: client_id → total revenue from paid invoices
    const clientRevenueMap = new Map<string, number>()
    for (const inv of paidInvoicesAll) {
      const cId = String(inv.client_id)
      const amt = Number(inv.amount ?? 0)
      clientRevenueMap.set(cId, (clientRevenueMap.get(cId) ?? 0) + amt)
    }

    // Also need signing count per client
    const allSigningsForCountRes = await db
      .from('signings')
      .select('client_id')
      .eq('user_id', userId)
    const allSigningsForCount = (allSigningsForCountRes.data ?? []) as Record<string, unknown>[]
    const clientSigningCountMap = new Map<string, number>()
    for (const s of allSigningsForCount) {
      const cId = String(s.client_id)
      clientSigningCountMap.set(cId, (clientSigningCountMap.get(cId) ?? 0) + 1)
    }

    const topClients = allClients
      .map((c) => ({
        name: String(c.name),
        totalRevenue: clientRevenueMap.get(String(c.id)) ?? 0,
        signingCount: clientSigningCountMap.get(String(c.id)) ?? 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)

    // ── Recent & upcoming signings — convert to camelCase ──
    const recentSigningsRaw = (recentSigningsRes.data ?? []) as Record<string, unknown>[]
    const upcomingSigningsRaw = (upcomingSigningsRes.data ?? []) as Record<string, unknown>[]

    const formatSigning = (s: Record<string, unknown>) => {
      const camel = toCamelCaseObj(s) as Record<string, unknown>
      return {
        ...camel,
        fee: Number(camel.fee ?? 0),
        mileage: camel.mileage != null ? Number(camel.mileage) : null,
      }
    }

    return NextResponse.json({
      // Dashboard fields
      totalClients: totalClientsCount,
      totalSignings: totalSigningsCount,
      totalRevenue: totalIncome,
      pendingPayments,
      overduePayments,
      totalExpenses: totalExp,
      totalMileage: mileage,

      // Reports page fields (matching frontend interface)
      totalIncome,
      netProfit: totalIncome - totalExp,
      mileageDeduction: mileage * 0.67,
      completedSignings: totalSigningsCount,

      monthlyRevenue,
      expenseCategories,
      signingsByType,
      topClients,

      recentSignings: recentSigningsRaw.map(formatSigning),
      upcomingSignings: upcomingSigningsRaw.map(formatSigning),
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
