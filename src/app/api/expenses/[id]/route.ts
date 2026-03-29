import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/expenses/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const expense = await db.expense.findUnique({ where: { id } })
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    return NextResponse.json(expense)
  } catch (error) {
    console.error('GET /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
  }
}

// PUT /api/expenses/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { category, description, amount, date, notes } = body

    const data: Record<string, unknown> = {}
    if (category) data.category = category
    if (description !== undefined) data.description = description
    if (amount !== undefined) data.amount = parseFloat(amount) || 0
    if (date) data.date = new Date(date)
    if (notes !== undefined) data.notes = notes || null

    const expense = await db.expense.update({ where: { id }, data })
    return NextResponse.json(expense)
  } catch (error) {
    console.error('PUT /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
