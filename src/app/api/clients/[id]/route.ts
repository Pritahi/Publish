import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toCamelCaseArr } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { clientUpdateSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// GET /api/clients/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const db = getDb()

    // Fetch the client
    const { data: client, error: clientError } = await db
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch related signings
    const { data: signings, error: signingsError } = await db
      .from('signings')
      .select('*')
      .eq('client_id', id)
      .order('date', { ascending: false })

    if (signingsError) {
      console.error('Supabase signings fetch error:', signingsError)
      return NextResponse.json({ error: 'Failed to fetch client signings' }, { status: 500 })
    }

    // Fetch related invoices
    const { data: invoices, error: invoicesError } = await db
      .from('invoices')
      .select('*')
      .eq('client_id', id)
      .order('issued_date', { ascending: false })

    if (invoicesError) {
      console.error('Supabase invoices fetch error:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch client invoices' }, { status: 500 })
    }

    // Combine and convert to camelCase
    const result = {
      ...toCamelCaseObj(client as Record<string, unknown>),
      signings: toCamelCaseArr((signings ?? []) as Record<string, unknown>[]),
      invoices: toCamelCaseArr((invoices ?? []) as Record<string, unknown>[]),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/clients/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

// PUT /api/clients/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const body = await request.json()
    const validated = clientUpdateSchema.parse(body)

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

    // Build update data (column names are snake_case in DB)
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
    console.error('PUT /api/clients/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/clients/[id]
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
    const { data: existing, error: findError } = await db
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Delete client (cascade deletes handled by DB schema ON DELETE CASCADE)
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
    console.error('DELETE /api/clients/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
