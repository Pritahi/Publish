import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { invoiceUpdateSchema } from '@/lib/validations'
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

// GET /api/invoices/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const db = getDb()

    const { data, error } = await db
      .from('invoices')
      .select('*, clients(id, name, email, phone), signings(id, service_type, date, fee)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(mapInvoiceRow(data as Record<string, unknown>))
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

// PUT /api/invoices/[id] — used for Mark Paid, status updates
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const body = await request.json()
    const validated = invoiceUpdateSchema.parse(body)

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
      } else {
        // Status changed away from Paid — clear paid_date so reports stay accurate
        updateData.paid_date = null
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
    console.error('PUT /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
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
    console.error('DELETE /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
