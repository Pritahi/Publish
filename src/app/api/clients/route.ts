import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toCamelCaseArr, toSnakeCaseObj } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { clientCreateSchema, clientUpdateSchema, paginationSchema } from '@/lib/validations'
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

    const db = getDb()
    const skip = (page - 1) * limit
    const from = skip
    const to = skip + limit - 1

    // Fetch paginated clients
    const { data: clients, error: clientsError } = await db
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (clientsError) {
      console.error('Supabase clients fetch error:', clientsError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Fetch total count
    const { count: total, error: countError } = await db
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('Supabase clients count error:', countError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Build per-client counts and revenue
    const clientIds = (clients ?? []).map((c: Record<string, unknown>) => c.id as string)

    type ClientIdRow = { client_id: string }
    type InvoiceRow = { client_id: string; amount: number }

    // Count signings per client
    const signingsCountMap: Record<string, number> = {}
    if (clientIds.length > 0) {
      const { data: signingsRows } = await db
        .from('signings')
        .select('client_id')
        .in('client_id', clientIds)

      for (const row of (signingsRows ?? []) as ClientIdRow[]) {
        signingsCountMap[row.client_id] = (signingsCountMap[row.client_id] ?? 0) + 1
      }
    }

    // Count invoices per client + compute revenue from paid invoices
    const invoicesCountMap: Record<string, number> = {}
    const revenueMap: Record<string, number> = {}

    if (clientIds.length > 0) {
      const { data: invoicesRows } = await db
        .from('invoices')
        .select('client_id')
        .in('client_id', clientIds)

      for (const row of (invoicesRows ?? []) as ClientIdRow[]) {
        invoicesCountMap[row.client_id] = (invoicesCountMap[row.client_id] ?? 0) + 1
      }
    }

    // Revenue: sum of paid invoices grouped by client_id
    const { data: paidInvoices } = await db
      .from('invoices')
      .select('client_id, amount')
      .eq('status', 'Paid')
      .eq('user_id', userId)

    for (const inv of (paidInvoices ?? []) as InvoiceRow[]) {
      revenueMap[inv.client_id] = (revenueMap[inv.client_id] ?? 0) + Number(inv.amount ?? 0)
    }

    // Assemble final result
    const result = (clients ?? []).map((client: Record<string, unknown>) => {
      const camelClient = toCamelCaseObj(client)
      return {
        ...camelClient,
        _count: {
          signings: signingsCountMap[(client.id as string)] ?? 0,
          invoices: invoicesCountMap[(client.id as string)] ?? 0,
        },
        totalRevenue: revenueMap[(client.id as string)] ?? 0,
      }
    })

    return NextResponse.json({ data: result, total: total ?? 0, page, limit })
  } catch (error) {
    console.error('GET /api/clients error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
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
    const { name, email, phone, company, address, notes } = clientCreateSchema.parse(body)

    const db = getDb()
    const insertData = toSnakeCaseObj({
      userId,
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      address: address || null,
      notes: notes || null,
    })

    const { data: client, error: insertError } = await db
      .from('clients')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Supabase client insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }

    return NextResponse.json(toCamelCaseObj(client as Record<string, unknown>), { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/clients error:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
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

    const validated = clientUpdateSchema.parse(rest)

    const db = getDb()

    // Verify ownership
    const { data: existing, error: findError } = await db
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Build update data in snake_case
    const updateData: Record<string, unknown> = {}
    if (validated.name) updateData.name = validated.name
    if (validated.email !== undefined) updateData.email = validated.email || null
    if (validated.phone !== undefined) updateData.phone = validated.phone || null
    if (validated.company !== undefined) updateData.company = validated.company || null
    if (validated.address !== undefined) updateData.address = validated.address || null
    if (validated.notes !== undefined) updateData.notes = validated.notes || null

    const { data: client, error: updateError } = await db
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Supabase client update error:', updateError)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json(toCamelCaseObj(client as Record<string, unknown>))
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/clients error:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
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
    const { data: existing, error: findError } = await db
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Cascade deletes related signings and invoices automatically via DB schema (ON DELETE CASCADE)
    const { error: deleteError } = await db
      .from('clients')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Supabase client delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/clients error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
