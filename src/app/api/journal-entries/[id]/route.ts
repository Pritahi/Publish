import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toSnakeCaseObj } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { journalEntryUpdateSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// GET /api/journal-entries/[id]
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
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    const result = toCamelCaseObj(data as Record<string, unknown>)
    return NextResponse.json({ ...result, fee: Number(result.fee) })
  } catch (error) {
    console.error('GET /api/journal-entries/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch journal entry' }, { status: 500 })
  }
}

// PUT /api/journal-entries/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const body = await request.json()
    const validated = journalEntryUpdateSchema.parse(body)

    const supabase = getDb()

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {}
    if (validated.signerName) updateData.signerName = validated.signerName
    if (validated.idType !== undefined) updateData.idType = validated.idType
    if (validated.idNumber !== undefined) updateData.idNumber = validated.idNumber
    if (validated.idExpiry !== undefined) updateData.idExpiry = validated.idExpiry
    if (validated.documentType !== undefined) updateData.documentType = validated.documentType
    if (validated.documentDescription !== undefined) updateData.documentDescription = validated.documentDescription
    if (validated.pageCount !== undefined) updateData.pageCount = validated.pageCount
    if (validated.fee !== undefined) updateData.fee = validated.fee
    if (validated.date) updateData.date = validated.date
    if (validated.time !== undefined) updateData.time = validated.time
    if (validated.state !== undefined) updateData.state = validated.state
    if (validated.county !== undefined) updateData.county = validated.county
    if (validated.notaryActType !== undefined) updateData.notaryActType = validated.notaryActType
    if (validated.notes !== undefined) updateData.notes = validated.notes
    if (validated.signatureDataUrl !== undefined) updateData.signatureDataUrl = validated.signatureDataUrl

    const snakeUpdateData = toSnakeCaseObj(updateData)

    const { data, error } = await supabase
      .from('journal_entries')
      .update(snakeUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('PUT /api/journal-entries/[id] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 })
    }

    const result = toCamelCaseObj(data as Record<string, unknown>)
    return NextResponse.json({ ...result, fee: Number(result.fee) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/journal-entries/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 })
  }
}

// DELETE /api/journal-entries/[id]
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
      .from('journal_entries')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('DELETE /api/journal-entries/[id] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/journal-entries/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 })
  }
}
