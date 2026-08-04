import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toSnakeCaseObj } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { expenseUpdateSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// GET /api/expenses/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const supabase = getDb()

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const result = toCamelCaseObj(data as Record<string, unknown>)
    return NextResponse.json({ ...result, amount: Number(result.amount) })
  } catch (error) {
    console.error('GET /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
  }
}

// PUT /api/expenses/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const body = await request.json()
    const validated = expenseUpdateSchema.parse(body)

    const supabase = getDb()

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {}
    if (validated.category) updateData.category = validated.category
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.amount !== undefined) updateData.amount = validated.amount
    if (validated.date) updateData.date = validated.date
    if (validated.notes !== undefined) updateData.notes = validated.notes || null

    const snakeUpdateData = toSnakeCaseObj(updateData)

    const { data, error } = await supabase
      .from('expenses')
      .update(snakeUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('PUT /api/expenses/[id] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
    }

    const result = toCamelCaseObj(data as Record<string, unknown>)
    return NextResponse.json({ ...result, amount: Number(result.amount) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const supabase = getDb()

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('DELETE /api/expenses/[id] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
