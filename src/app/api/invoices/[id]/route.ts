import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        signing: { select: { id: true, serviceType: true, date: true, fee: true } },
      },
    })
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    return NextResponse.json(invoice)
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

// PUT /api/invoices/[id] — used for Mark Paid, status updates
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { clientId, signingId, amount, status, dueDate, notes } = body

    const data: Record<string, unknown> = {}
    if (clientId) data.clientId = clientId
    if (signingId !== undefined) data.signingId = signingId || null
    if (amount !== undefined) data.amount = parseFloat(amount)
    if (status) {
      data.status = status
      if (status === 'Paid') {
        data.paidDate = new Date()
      }
    }
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
    if (notes !== undefined) data.notes = notes || null

    const invoice = await db.invoice.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('PUT /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
