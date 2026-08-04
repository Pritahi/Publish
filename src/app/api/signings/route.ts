import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toCamelCaseArr, toSnakeCaseObj } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { signingCreateSchema, signingUpdateSchema, paginationSchema } from '@/lib/validations'
import { ZodError } from 'zod'

/** Map a Supabase signing row (snake_case + `clients` join) to camelCase frontend shape */
function mapSigningRow(row: Record<string, unknown>) {
  const { clients, ...rest } = row
  const camel = toCamelCaseObj(rest)
  return {
    ...camel,
    fee: Number(camel.fee),
    mileage: camel.mileage !== null ? Number(camel.mileage) : null,
    client: clients ? toCamelCaseObj(clients as Record<string, unknown>) : null,
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
    const serviceType = searchParams.get('serviceType')
    const month = searchParams.get('month')
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    })

    const db = getDb()
    const skip = (page - 1) * limit

    // Build query with filters
    let query = db
      .from('signings')
      .select('*, clients(id, name, email, phone)', { count: 'exact' })
      .eq('user_id', userId)

    if (status) {
      query = query.eq('status', status)
    }
    if (serviceType) {
      query = query.eq('service_type', serviceType)
    }
    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`)
      const [year, mon] = month.split('-').map(Number)
      const endDate = new Date(year, mon, 0, 23, 59, 59, 999)
      query = query.gte('date', startDate.toISOString()).lte('date', endDate.toISOString())
    }

    const { data, count, error } = await query
      .order('date', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error('Supabase GET signings error:', error)
      return NextResponse.json({ error: 'Failed to fetch signings' }, { status: 500 })
    }

    const result = (data as Record<string, unknown>[]).map(mapSigningRow)
    const total = count ?? 0

    return NextResponse.json({ data: result, total, page, limit })
  } catch (error) {
    console.error('GET /api/signings error:', error)
    return NextResponse.json({ error: 'Failed to fetch signings' }, { status: 500 })
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
    const validated = signingCreateSchema.parse(body)

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

    const insertData = toSnakeCaseObj({
      userId,
      clientId: validated.clientId,
      date: validated.date,
      time: validated.time || null,
      location: validated.location,
      serviceType: validated.serviceType || 'General Notary',
      fee: validated.fee ?? 0,
      status: validated.status || 'Scheduled',
      notes: validated.notes || null,
      mileage: validated.mileage ?? null,
    })

    const { data: signing, error: insertError } = await db
      .from('signings')
      .insert(insertData)
      .select('*, clients(id, name, email, phone)')
      .single()

    if (insertError || !signing) {
      console.error('Supabase POST signing error:', insertError)
      return NextResponse.json({ error: 'Failed to create signing' }, { status: 500 })
    }

    return NextResponse.json(mapSigningRow(signing as Record<string, unknown>), { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/signings error:', error)
    return NextResponse.json({ error: 'Failed to create signing' }, { status: 500 })
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

    const validated = signingUpdateSchema.parse(rest)

    const db = getDb()

    // Verify ownership
    const { data: existing, error: fetchError } = await db
      .from('signings')
      .select('id, client_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Signing not found' }, { status: 404 })
    }

    // If clientId is being changed, verify new client belongs to user
    if (validated.clientId && validated.clientId !== existing.client_id) {
      const { data: client, error: clientError } = await db
        .from('clients')
        .select('id')
        .eq('id', validated.clientId)
        .eq('user_id', userId)
        .single()

      if (clientError || !client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
    }

    // Build update data with snake_case keys
    const updateData: Record<string, unknown> = {}
    if (validated.clientId) updateData.client_id = validated.clientId
    if (validated.date) updateData.date = validated.date
    if (validated.time !== undefined) updateData.time = validated.time || null
    if (validated.location) updateData.location = validated.location
    if (validated.serviceType) updateData.service_type = validated.serviceType
    if (validated.fee !== undefined) updateData.fee = validated.fee
    if (validated.status) updateData.status = validated.status
    if (validated.notes !== undefined) updateData.notes = validated.notes || null
    if (validated.mileage !== undefined) updateData.mileage = validated.mileage ?? null

    const { data: signing, error: updateError } = await db
      .from('signings')
      .update(updateData)
      .eq('id', id)
      .select('*, clients(id, name, email, phone)')
      .single()

    if (updateError || !signing) {
      console.error('Supabase PUT signing error:', updateError)
      return NextResponse.json({ error: 'Failed to update signing' }, { status: 500 })
    }

    return NextResponse.json(mapSigningRow(signing as Record<string, unknown>))
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/signings error:', error)
    return NextResponse.json({ error: 'Failed to update signing' }, { status: 500 })
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
      .from('signings')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Signing not found' }, { status: 404 })
    }

    const { error: deleteError } = await db
      .from('signings')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Supabase DELETE signing error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete signing' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/signings error:', error)
    return NextResponse.json({ error: 'Failed to delete signing' }, { status: 500 })
  }
}
