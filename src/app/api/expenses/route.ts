import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const month = searchParams.get('month')

    const where: Record<string, unknown> = {}

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

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, description, amount, date, receiptUrl, notes } = body

    if (!category || !description || amount === undefined || !date) {
      return NextResponse.json(
        { error: 'category, description, amount, and date are required' },
        { status: 400 }
      )
    }

    const expense = await db.expense.create({
      data: {
        category,
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        receiptUrl: receiptUrl || undefined,
        notes: notes || undefined,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, category, description, amount, date, receiptUrl, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const expense = await db.expense.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(description && { description }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(receiptUrl !== undefined && { receiptUrl: receiptUrl || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('PUT /api/expenses error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
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
