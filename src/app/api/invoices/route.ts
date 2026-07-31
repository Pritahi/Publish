import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { invoiceCreateSchema, invoiceUpdateSchema, paginationSchema } from '@/lib/validations'
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
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    })

    const where: Record<string, unknown> = { userId }
    if (status) {
      where.status = status
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        orderBy: { issuedDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true },
          },
          signing: {
            select: { id: true, serviceType: true, date: true },
          },
        },
      }),
      db.invoice.count({ where }),
    ])

    const result = invoices.map((inv) => ({
      ...inv,
      amount: Number(inv.amount),
    }))

    return NextResponse.json({ data: result, total, page, limit })
  } catch (error) {
    console.error('GET /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
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
    const validated = invoiceCreateSchema.parse(body)

    // Verify client belongs to user
    const client = await db.client.findFirst({ where: { id: validated.clientId, userId } })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Use transaction with max(invoiceNo) + 1 to avoid race condition
    const invoice = await db.$transaction(async (tx) => {
      const maxResult = await tx.invoice.aggregate({
        where: { userId },
        _max: { invoiceNo: true },
      })

      let nextNum = 1
      if (maxResult._max.invoiceNo) {
        const match = maxResult._max.invoiceNo.match(/INV-(\d+)/)
        if (match) {
          nextNum = parseInt(match[1], 10) + 1
        }
      }
      const invoiceNo = `INV-${String(nextNum).padStart(4, '0')}`

      return tx.invoice.create({
        data: {
          userId,
          invoiceNo,
          clientId: validated.clientId,
          signingId: validated.signingId || undefined,
          amount: validated.amount,
          dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
          notes: validated.notes || undefined,
        },
        include: {
          client: {
            select: { id: true, name: true },
          },
        },
      })
    })

    return NextResponse.json({ ...invoice, amount: Number(invoice.amount) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('POST /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
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

    const validated = invoiceUpdateSchema.parse(rest)

    // Verify ownership
    const existing = await db.invoice.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // If status is being set to "Paid", auto-set paidDate
    const data: Record<string, unknown> = {}
    if (validated.clientId) data.clientId = validated.clientId
    if (validated.signingId !== undefined) data.signingId = validated.signingId || null
    if (validated.amount !== undefined) data.amount = validated.amount
    if (validated.status) {
      data.status = validated.status
      if (validated.status === 'Paid') {
        data.paidDate = new Date()
      }
    }
    if (validated.dueDate !== undefined) data.dueDate = validated.dueDate ? new Date(validated.dueDate) : null
    if (validated.notes !== undefined) data.notes = validated.notes || null

    const invoice = await db.invoice.update({
      where: { id },
      data,
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ ...invoice, amount: Number(invoice.amount) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
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
    const existing = await db.invoice.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await db.invoice.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
