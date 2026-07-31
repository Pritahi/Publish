import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
    const entry = await db.journalEntry.findFirst({ where: { id, userId } })
    if (!entry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }
    return NextResponse.json({ ...entry, fee: Number(entry.fee) })
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

    // Verify ownership
    const existing = await db.journalEntry.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (validated.signerName) data.signerName = validated.signerName
    if (validated.idType !== undefined) data.idType = validated.idType
    if (validated.idNumber !== undefined) data.idNumber = validated.idNumber
    if (validated.idExpiry !== undefined) data.idExpiry = validated.idExpiry
    if (validated.documentType !== undefined) data.documentType = validated.documentType
    if (validated.documentDescription !== undefined) data.documentDescription = validated.documentDescription
    if (validated.pageCount !== undefined) data.pageCount = validated.pageCount
    if (validated.fee !== undefined) data.fee = validated.fee
    if (validated.date) data.date = validated.date
    if (validated.time !== undefined) data.time = validated.time
    if (validated.state !== undefined) data.state = validated.state
    if (validated.county !== undefined) data.county = validated.county
    if (validated.notaryActType !== undefined) data.notaryActType = validated.notaryActType
    if (validated.notes !== undefined) data.notes = validated.notes
    if (validated.signatureDataUrl !== undefined) data.signatureDataUrl = validated.signatureDataUrl

    const entry = await db.journalEntry.update({ where: { id }, data })
    return NextResponse.json({ ...entry, fee: Number(entry.fee) })
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

    // Verify ownership
    const existing = await db.journalEntry.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    await db.journalEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/journal-entries/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 })
  }
}
