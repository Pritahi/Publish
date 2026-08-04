import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toCamelCaseArr, toSnakeCaseObj } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { journalEntryCreateSchema, paginationSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { searchParams } = new URL(request.url)
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    })

    const supabase = getDb()

    const { data, count, error } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, (page - 1) * limit + limit - 1)

    if (error) {
      console.error('GET /api/journal-entries Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
    }

    const result = toCamelCaseArr(data as Record<string, unknown>[]).map((e: Record<string, unknown>) => ({
      ...e,
      fee: Number(e.fee),
    }))

    return NextResponse.json({ data: result, total: count ?? 0, page, limit })
  } catch (error) {
    console.error('GET /api/journal-entries error:', error)
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
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
    const validated = journalEntryCreateSchema.parse(body)

    const supabase = getDb()
    const insertData = toSnakeCaseObj({
      userId,
      signerName: validated.signerName,
      idType: validated.idType || '',
      idNumber: validated.idNumber || '',
      idExpiry: validated.idExpiry || '',
      documentType: validated.documentType || '',
      documentDescription: validated.documentDescription || '',
      pageCount: validated.pageCount ?? 0,
      fee: validated.fee ?? 0,
      date: validated.date,
      time: validated.time || '',
      state: validated.state || '',
      county: validated.county || '',
      notaryActType: validated.notaryActType || '',
      notes: validated.notes || '',
      signatureDataUrl: validated.signatureDataUrl || null,
    })

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('POST /api/journal-entries Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
    }

    const result = toCamelCaseObj(data as Record<string, unknown>)
    return NextResponse.json({ ...result, fee: Number(result.fee) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/journal-entries error:', error)
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
  }
}
