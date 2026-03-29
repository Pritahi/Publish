import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/signings/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const signing = await db.signing.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
    })
    if (!signing) {
      return NextResponse.json({ error: 'Signing not found' }, { status: 404 })
    }
    return NextResponse.json(signing)
  } catch (error) {
    console.error('GET /api/signings/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch signing' }, { status: 500 })
  }
}

// PUT /api/signings/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { clientId, date, time, location, serviceType, fee, mileage, status, notes } = body

    const data: Record<string, unknown> = {}
    if (clientId) data.clientId = clientId
    if (date) data.date = new Date(date)
    if (time !== undefined) data.time = time || null
    if (location !== undefined) data.location = location
    if (serviceType) data.serviceType = serviceType
    if (fee !== undefined) data.fee = parseFloat(fee) || 0
    if (mileage !== undefined) data.mileage = parseFloat(mileage) || 0
    if (status) data.status = status
    if (notes !== undefined) data.notes = notes || null

    const signing = await db.signing.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(signing)
  } catch (error) {
    console.error('PUT /api/signings/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update signing' }, { status: 500 })
  }
}

// DELETE /api/signings/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.signing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/signings/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete signing' }, { status: 500 })
  }
}
