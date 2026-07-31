import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { signingUpdateSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// GET /api/signings/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const signing = await db.signing.findFirst({
      where: { id, userId },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
    })
    if (!signing) {
      return NextResponse.json({ error: 'Signing not found' }, { status: 404 })
    }
    return NextResponse.json({ ...signing, fee: Number(signing.fee), mileage: signing.mileage !== null ? Number(signing.mileage) : null })
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

    // Verify ownership
    const existing = await db.signing.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Signing not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (validated.clientId) data.clientId = validated.clientId
    if (validated.date) data.date = new Date(validated.date)
    if (validated.time !== undefined) data.time = validated.time || null
    if (validated.location !== undefined) data.location = validated.location
    if (validated.serviceType) data.serviceType = validated.serviceType
    if (validated.fee !== undefined) data.fee = validated.fee
    if (validated.mileage !== undefined) data.mileage = validated.mileage ?? null
    if (validated.status) data.status = validated.status
    if (validated.notes !== undefined) data.notes = validated.notes || null

    const signing = await db.signing.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ ...signing, fee: Number(signing.fee), mileage: signing.mileage !== null ? Number(signing.mileage) : null })
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

    // Verify ownership
    const existing = await db.signing.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Signing not found' }, { status: 404 })
    }

    await db.signing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/signings/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete signing' }, { status: 500 })
  }
}
