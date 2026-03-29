import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const clients = await db.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { signings: true, invoices: true } },
      },
    })

    // Fetch total revenue per client (sum of paid invoices)
    const revenueMap: Record<string, number> = {}
    const paidInvoices = await db.invoice.groupBy({
      by: ['clientId'],
      where: { status: 'Paid' },
      _sum: { amount: true },
    })
    for (const inv of paidInvoices) {
      revenueMap[inv.clientId] = inv._sum.amount ?? 0
    }

    const result = clients.map((client) => ({
      ...client,
      totalRevenue: revenueMap[client.id] ?? 0,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/clients error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, company, address, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const client = await db.client.create({
      data: {
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
    console.error('POST /api/clients error:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email, phone, company, address, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const client = await db.client.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(company !== undefined && { company: company || null }),
        ...(address !== undefined && { address: address || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('PUT /api/clients error:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
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
