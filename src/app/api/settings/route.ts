import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { settingsSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// GET /api/settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    let settings = await db.settings.findUnique({ where: { userId } })

    if (!settings) {
      // Create default settings for user
      settings = await db.settings.create({
        data: { userId },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const body = await request.json()
    const validated = settingsSchema.parse(body)

    // Upsert settings
    const settings = await db.settings.upsert({
      where: { userId },
      update: validated,
      create: {
        userId,
        ...validated,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
