import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { signingUpdateSchema } from '@/lib/validations'
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

// GET /api/signings/[id]
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
      .from('signings')
      .select('*, clients(id, name, email, phone)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Signing not found' }, { status: 404 })
    }

    return NextResponse.json(mapSigningRow(data as Record<string, unknown>))
  } catch (error) {
    console.error('GET /api/signings/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch signing' }, { status: 500 })
  }
}

// PUT /api/signings/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const body = await request.json()
    const validated = signingUpdateSchema.parse(body)

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

    // Build update data with snake_case keys
    const updateData: Record<string, unknown> = {}
    if (validated.clientId) updateData.client_id = validated.clientId
    if (validated.date) updateData.date = validated.date
    if (validated.time !== undefined) updateData.time = validated.time || null
    if (validated.location !== undefined) updateData.location = validated.location
    if (validated.serviceType) updateData.service_type = validated.serviceType
    if (validated.fee !== undefined) updateData.fee = validated.fee
    if (validated.mileage !== undefined) updateData.mileage = validated.mileage ?? null
    if (validated.status) updateData.status = validated.status
    if (validated.notes !== undefined) updateData.notes = validated.notes || null

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
    console.error('PUT /api/signings/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update signing' }, { status: 500 })
  }
}

// DELETE /api/signings/[id]
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
    console.error('DELETE /api/signings/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete signing' }, { status: 500 })
  }
}
