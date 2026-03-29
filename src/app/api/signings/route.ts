import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const serviceType = searchParams.get('serviceType')
    const month = searchParams.get('month')

    const where: Record<string, unknown> = {}

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

    const signings = await db.signing.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    return NextResponse.json(signings)
  } catch (error) {
    console.error('GET /api/signings error:', error)
    return NextResponse.json({ error: 'Failed to fetch signings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, date, time, location, serviceType, fee, status, notes, mileage } = body

    if (!clientId || !date || !location) {
      return NextResponse.json(
        { error: 'clientId, date, and location are required' },
        { status: 400 }
      )
    }

    const signing = await db.signing.create({
      data: {
        clientId,
        date: new Date(date),
        time: time || undefined,
        location,
        serviceType: serviceType || 'General Notary',
        fee: fee ?? 0,
        status: status || 'Scheduled',
        notes: notes || undefined,
        mileage: mileage ?? undefined,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    return NextResponse.json(signing, { status: 201 })
  } catch (error) {
    console.error('POST /api/signings error:', error)
    return NextResponse.json({ error: 'Failed to create signing' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, clientId, date, time, location, serviceType, fee, status, notes, mileage } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const signing = await db.signing.update({
      where: { id },
      data: {
        ...(clientId && { clientId }),
        ...(date && { date: new Date(date) }),
        ...(time !== undefined && { time: time || null }),
        ...(location && { location }),
        ...(serviceType && { serviceType }),
        ...(fee !== undefined && { fee }),
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(mileage !== undefined && { mileage: mileage || null }),
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    return NextResponse.json(signing)
  } catch (error) {
    console.error('PUT /api/signings error:', error)
    return NextResponse.json({ error: 'Failed to update signing' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
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
