import { NextRequest, NextResponse } from 'next/server'
import { getDb, toCamelCaseObj, toSnakeCaseObj } from '@/lib/db'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request, { windowMs: 60_000, maxRequests: 5 })
    if (rateLimitResult) return rateLimitResult

    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    const db = getDb()

    // Check if user already exists
    const { data: existingUser } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    // If existingUser is found, the email is already registered
    // (PGRST116 = no rows returned, which means not found — that's the good case)
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const passwordHash = await hash(password, 12)

    const insertData = toSnakeCaseObj({
      name,
      email,
      passwordHash,
    })

    const { data: user, error: insertError } = await db
      .from('users')
      .insert(insertData)
      .select('id, name, email, role, created_at')
      .single()

    if (insertError) {
      console.error('Supabase user insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    const userCamel = toCamelCaseObj(user as Record<string, unknown>)

    return NextResponse.json(
      { message: 'Account created successfully', user: userCamel },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
