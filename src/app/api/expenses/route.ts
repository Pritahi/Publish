import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { expenseCreateSchema, expenseUpdateSchema, paginationSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const month = searchParams.get('month')
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    })

    const where: Record<string, unknown> = { userId }

    if (category) {
      where.category = category
    }
    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`)
      const [year, mon] = month.split('-').map(Number)
      const endDate = new Date(year, mon, 0, 23, 59, 59, 999)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.expense.count({ where }),
    ])

    const result = expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
    }))

    return NextResponse.json({ data: result, total, page, limit })
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const body = await request.json()
    const validated = expenseCreateSchema.parse(body)

    const expense = await db.expense.create({
      data: {
        userId,
        category: validated.category,
        description: validated.description,
        amount: validated.amount,
        date: new Date(validated.date),
        receiptUrl: validated.receiptUrl || undefined,
        notes: validated.notes || undefined,
      },
    })

    return NextResponse.json({ ...expense, amount: Number(expense.amount) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const body = await request.json()
    const { id, ...rest } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const validated = expenseUpdateSchema.parse(rest)

    // Verify ownership
    const existing = await db.expense.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const expense = await db.expense.update({
      where: { id },
      data: {
        ...(validated.category && { category: validated.category }),
        ...(validated.description && { description: validated.description }),
        ...(validated.amount !== undefined && { amount: validated.amount }),
        ...(validated.date && { date: new Date(validated.date) }),
        ...(validated.receiptUrl !== undefined && { receiptUrl: validated.receiptUrl || null }),
        ...(validated.notes !== undefined && { notes: validated.notes || null }),
      },
    })

    return NextResponse.json({ ...expense, amount: Number(expense.amount) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/expenses error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await db.expense.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await db.expense.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/expenses error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
