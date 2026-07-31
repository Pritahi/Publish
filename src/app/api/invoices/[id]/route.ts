import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { invoiceUpdateSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// GET /api/invoices/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const invoice = await db.invoice.findFirst({
      where: { id, userId },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        signing: { select: { id: true, serviceType: true, date: true, fee: true } },
      },
    })
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    return NextResponse.json({
      ...invoice,
      amount: Number(invoice.amount),
      signing: invoice.signing ? { ...invoice.signing, fee: Number(invoice.signing.fee) } : invoice.signing,
    })
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

// PUT /api/invoices/[id] — used for Mark Paid, status updates
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params
    const body = await request.json()
    const validated = invoiceUpdateSchema.parse(body)

    // Verify ownership
    const existing = await db.invoice.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

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
        client: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ ...invoice, amount: Number(invoice.amount) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimitResult = rateLimit(request)
    if (rateLimitResult) return rateLimitResult

    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const { id } = await params

    // Verify ownership
    const existing = await db.invoice.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    await db.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
