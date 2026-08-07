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
      // Log full Supabase error server-side for debugging — never send it
      // to the client. Even the message can leak schema details.
      console.error('[register] Supabase insert failed:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      })
      return NextResponse.json(
        { error: 'Something went wrong while creating your account. Please try again.' },
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
      // Don't expose Zod's internal `issues` array to the client — it
      // contains field paths, codes, and the schema shape. Pick the
      // first user-facing message only, and even then re-wrap it so we
      // control the exact wording.
      const firstIssue = error.issues?.[0]
      const friendly =
        firstIssue?.message && firstIssue.message.length < 120
          ? firstIssue.message
          : 'Please check your input and try again.'
      console.warn('[register] validation failed:', {
        issues: error.issues.map((i) => ({ path: i.path, code: i.code })),
      })
      return NextResponse.json(
        { error: friendly },
        { status: 400 }
      )
    }
    console.error('[register] unexpected error:', error)
    return NextResponse.json(
      { error: 'Something went wrong while creating your account. Please try again.' },
      { status: 500 }
    )
  }
}
