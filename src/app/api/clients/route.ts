import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

    const clients = await db.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { signings: true, invoices: true } },
      },
    })

    const total = await db.client.count({ where: { userId } })

    // Fetch total revenue per client (sum of paid invoices)
    const revenueMap: Record<string, number> = {}
    const paidInvoices = await db.invoice.groupBy({
      by: ['clientId'],
      where: { status: 'Paid', userId },
      _sum: { amount: true },
    })
    for (const inv of paidInvoices) {
      revenueMap[inv.clientId] = Number(inv._sum.amount ?? 0)
    }

    const result = clients.map((client) => ({
      ...client,
      totalRevenue: revenueMap[client.id] ?? 0,
    }))

    return NextResponse.json({ data: result, total, page, limit })
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

    const client = await db.client.create({
      data: {
        userId,
        name,
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
        address: address || undefined,
        notes: notes || undefined,
      },
    })

    return NextResponse.json(client, { status: 201 })
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

    // Verify ownership
    const existing = await db.client.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const client = await db.client.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.email !== undefined && { email: validated.email || null }),
        ...(validated.phone !== undefined && { phone: validated.phone || null }),
        ...(validated.company !== undefined && { company: validated.company || null }),
        ...(validated.address !== undefined && { address: validated.address || null }),
        ...(validated.notes !== undefined && { notes: validated.notes || null }),
      },
    })

    return NextResponse.json(client)
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

    // Verify ownership
    const existing = await db.client.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Cascade deletes related signings and invoices automatically via schema
    await db.client.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/clients error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
