import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toSnakeCaseObj } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { invoiceCreateSchema, invoiceUpdateSchema, paginationSchema } from '@/lib/validations'
import { ZodError } from 'zod'

/** Map a Supabase invoice row (snake_case + `clients`/`signings` joins) to camelCase frontend shape */
function mapInvoiceRow(row: Record<string, unknown>) {
  const { clients, signings, ...rest } = row
  const camel = toCamelCaseObj(rest)
  return {
    ...camel,
    amount: Number(camel.amount),
    client: clients ? toCamelCaseObj(clients as Record<string, unknown>) : null,
    signing: signings
      ? {
          ...toCamelCaseObj(signings as Record<string, unknown>),
          fee: Number((signings as Record<string, unknown>).fee),
        }
      : null,
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
    const status = searchParams.get('status')
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    })

    const db = getDb()
    const skip = (page - 1) * limit

    // Build query with filters
    let query = db
      .from('invoices')
      .select('*, clients(id, name), signings(id, service_type, date, fee)', { count: 'exact' })
      .eq('user_id', userId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, count, error } = await query
      .order('issued_date', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error('Supabase GET invoices error:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    const result = (data as Record<string, unknown>[]).map(mapInvoiceRow)
    const total = count ?? 0

    return NextResponse.json({ data: result, total, page, limit })
  } catch (error) {
    console.error('GET /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
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
    const validated = invoiceCreateSchema.parse(body)

    const db = getDb()

    // Verify client belongs to user
    const { data: client, error: clientError } = await db
      .from('clients')
      .select('id')
      .eq('id', validated.clientId)
      .eq('user_id', userId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Use RPC for atomic invoice number generation
    const { data: invoiceNo, error: rpcError } = await db.rpc('get_next_invoice_no', {
      p_user_id: userId,
    })

    if (rpcError || !invoiceNo) {
      console.error('Supabase RPC get_next_invoice_no error:', rpcError)
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 })
    }

    const insertData = toSnakeCaseObj({
      userId,
      invoiceNo,
      clientId: validated.clientId,
      signingId: validated.signingId || null,
      amount: validated.amount,
      dueDate: validated.dueDate || null,
      notes: validated.notes || null,
    })

    const { data: invoice, error: insertError } = await db
      .from('invoices')
      .insert(insertData)
      .select('*, clients(id, name), signings(id, service_type, date, fee)')
      .single()

    if (insertError || !invoice) {
      console.error('Supabase POST invoice error:', insertError)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    return NextResponse.json(mapInvoiceRow(invoice as Record<string, unknown>), { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
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

    const validated = invoiceUpdateSchema.parse(rest)

    const db = getDb()

    // Verify ownership
    const { data: existing, error: fetchError } = await db
      .from('invoices')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Build update data with snake_case keys
    const updateData: Record<string, unknown> = {}
    if (validated.clientId) updateData.client_id = validated.clientId
    if (validated.signingId !== undefined) updateData.signing_id = validated.signingId || null
    if (validated.amount !== undefined) updateData.amount = validated.amount
    if (validated.status) {
      updateData.status = validated.status
      if (validated.status === 'Paid') {
        updateData.paid_date = new Date().toISOString()
      }
    }
    if (validated.dueDate !== undefined) updateData.due_date = validated.dueDate || null
    if (validated.notes !== undefined) updateData.notes = validated.notes || null

    const { data: invoice, error: updateError } = await db
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select('*, clients(id, name), signings(id, service_type, date, fee)')
      .single()

    if (updateError || !invoice) {
      console.error('Supabase PUT invoice error:', updateError)
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }

    return NextResponse.json(mapInvoiceRow(invoice as Record<string, unknown>))
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
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

    const db = getDb()

    // Verify ownership
    const { data: existing, error: fetchError } = await db
      .from('invoices')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { error: deleteError } = await db
      .from('invoices')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Supabase DELETE invoice error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
