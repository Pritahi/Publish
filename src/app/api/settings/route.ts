import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toSnakeCaseObj } from '@/lib/db'
import { requireAuth } from '@/lib/auth-guard'
import { settingsSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// GET /api/settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { userId } = authResult

    const supabase = getDb()

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Create default settings for user
      const { data: newSettings, error: insertError } = await supabase
        .from('settings')
        .insert({ user_id: userId })
        .select()
        .single()

      if (insertError) {
        console.error('GET /api/settings insert error:', insertError)
        return NextResponse.json({ error: 'Failed to create default settings' }, { status: 500 })
      }

      const result = toCamelCaseObj(newSettings as Record<string, unknown>)
      return NextResponse.json(result)
    }

    const result = toCamelCaseObj(data as Record<string, unknown>)
    return NextResponse.json(result)
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

    const supabase = getDb()

    // Convert validated camelCase fields to snake_case for DB, and add user_id
    const snakeData = toSnakeCaseObj(validated)
    // Include user_id for the upsert conflict resolution
    const upsertData = { ...snakeData, user_id: userId }

    const { data, error } = await supabase
      .from('settings')
      .upsert(upsertData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('PUT /api/settings Supabase error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    const result = toCamelCaseObj(data as Record<string, unknown>)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
