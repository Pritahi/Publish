import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const invoices = await db.invoice.findMany({
      where,
      orderBy: { issuedDate: 'desc' },
      include: {
        client: {
          select: { id: true, name: true },
        },
        signing: {
          select: { id: true, serviceType: true, date: true },
        },
      },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('GET /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, signingId, amount, dueDate, notes } = body

    if (!clientId || amount === undefined) {
      return NextResponse.json(
        { error: 'clientId and amount are required' },
        { status: 400 }
      )
    }

    // Auto-generate invoice number: INV-0001, INV-0002, etc.
    const count = await db.invoice.count()
    const invoiceNo = `INV-${String(count + 1).padStart(4, '0')}`

    const invoice = await db.invoice.create({
      data: {
        invoiceNo,
        clientId,
        signingId: signingId || undefined,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: notes || undefined,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('POST /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, clientId, signingId, amount, status, dueDate, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // If status is being set to "Paid", auto-set paidDate
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
        client: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('PUT /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
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
