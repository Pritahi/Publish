import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { signingCreateSchema, signingUpdateSchema, paginationSchema } from '@/lib/validations'
import { ZodError } from 'zod'

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

    const where: Record<string, unknown> = { userId }

    if (status) {
      where.status = status
    }
    if (serviceType) {
      where.serviceType = serviceType
    }
    if (month) {
      // month is YYYY-MM format
      const startDate = new Date(`${month}-01T00:00:00.000Z`)
      const [year, mon] = month.split('-').map(Number)
      const endDate = new Date(year, mon, 0, 23, 59, 59, 999)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    const [signings, total] = await Promise.all([
      db.signing.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      }),
      db.signing.count({ where }),
    ])

    const result = signings.map((s) => ({
      ...s,
      fee: Number(s.fee),
      mileage: s.mileage !== null ? Number(s.mileage) : null,
    }))

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

    // Verify client belongs to user
    const client = await db.client.findFirst({ where: { id: validated.clientId, userId } })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const signing = await db.signing.create({
      data: {
        userId,
        clientId: validated.clientId,
        date: new Date(validated.date),
        time: validated.time || undefined,
        location: validated.location,
        serviceType: validated.serviceType || 'General Notary',
        fee: validated.fee ?? 0,
        status: validated.status || 'Scheduled',
        notes: validated.notes || undefined,
        mileage: validated.mileage ?? undefined,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    return NextResponse.json({ ...signing, fee: Number(signing.fee), mileage: signing.mileage !== null ? Number(signing.mileage) : null }, { status: 201 })
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

    // Verify ownership
    const existing = await db.signing.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Signing not found' }, { status: 404 })
    }

    // If clientId is being changed, verify new client belongs to user
    if (validated.clientId && validated.clientId !== existing.clientId) {
      const client = await db.client.findFirst({ where: { id: validated.clientId, userId } })
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
    }

    const signing = await db.signing.update({
      where: { id },
      data: {
        ...(validated.clientId && { clientId: validated.clientId }),
        ...(validated.date && { date: new Date(validated.date) }),
        ...(validated.time !== undefined && { time: validated.time || null }),
        ...(validated.location && { location: validated.location }),
        ...(validated.serviceType && { serviceType: validated.serviceType }),
        ...(validated.fee !== undefined && { fee: validated.fee }),
        ...(validated.status && { status: validated.status }),
        ...(validated.notes !== undefined && { notes: validated.notes || null }),
        ...(validated.mileage !== undefined && { mileage: validated.mileage ?? null }),
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    return NextResponse.json({ ...signing, fee: Number(signing.fee), mileage: signing.mileage !== null ? Number(signing.mileage) : null })
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

    // Verify ownership
    const existing = await db.signing.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Signing not found' }, { status: 404 })
    }

    await db.signing.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/signings error:', error)
    return NextResponse.json({ error: 'Failed to delete signing' }, { status: 500 })
  }
}
