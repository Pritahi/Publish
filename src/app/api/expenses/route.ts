import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toCamelCaseArr, toSnakeCaseObj } from '@/lib/db'
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

    const supabase = getDb()

    // Build query with filters
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range((page - 1) * limit, (page - 1) * limit + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }
    if (month) {
      const startDate = `${month}-01`
      const [year, mon] = month.split('-').map(Number)
      const endDay = new Date(year, mon, 0).getDate()
      const endDate = `${month}-${String(endDay).padStart(2, '0')}`
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('GET /api/expenses Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }

    const result = toCamelCaseArr(data as Record<string, unknown>[]).map((e: Record<string, unknown>) => ({
      ...e,
      amount: Number(e.amount),
    }))

    return NextResponse.json({ data: result, total: count ?? 0, page, limit })
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

    const supabase = getDb()
    const insertData = toSnakeCaseObj({
      userId,
      category: validated.category,
      description: validated.description,
      amount: validated.amount,
      date: validated.date,
      receiptUrl: validated.receiptUrl || null,
      notes: validated.notes || null,
    })

    const { data, error } = await supabase
      .from('expenses')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('POST /api/expenses Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
    }

    const result = toCamelCaseObj(data as Record<string, unknown>)
    return NextResponse.json({ ...result, amount: Number(result.amount) }, { status: 201 })
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
    if (validated.description) updateData.description = validated.description
    if (validated.amount !== undefined) updateData.amount = validated.amount
    if (validated.date) updateData.date = validated.date
    if (validated.receiptUrl !== undefined) updateData.receiptUrl = validated.receiptUrl || null
    if (validated.notes !== undefined) updateData.notes = validated.notes || null

    const snakeUpdateData = toSnakeCaseObj(updateData)

    const { data, error } = await supabase
      .from('expenses')
      .update(snakeUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('PUT /api/expenses Supabase error:', error)
      return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
    }

    const result = toCamelCaseObj(data as Record<string, unknown>)
    return NextResponse.json({ ...result, amount: Number(result.amount) })
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
      console.error('DELETE /api/expenses Supabase error:', error)
      return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/expenses error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
