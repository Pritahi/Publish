import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase (anon key — respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase (service role — bypasses RLS for API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * Get the server-side Supabase admin client for API routes.
 * This bypasses RLS — use only in authenticated API routes after verifying the user.
 */
export function getDb(): SupabaseClient {
  return supabaseAdmin
}

// ── Snake_case ↔ camelCase helpers ──

/** Convert a camelCase string to snake_case */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/** Convert a snake_case string to camelCase */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/** Convert an object's keys from camelCase to snake_case */
export function toSnakeCaseObj<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[toSnakeCase(key)] = value
    }
  }
  return result
}

/** Convert an object's keys from snake_case to camelCase */
export function toCamelCaseObj<T = Record<string, unknown>>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = value
  }
  return result as T
}

/** Convert an array of objects from snake_case to camelCase */
export function toCamelCaseArr<T = Record<string, unknown>>(arr: Record<string, unknown>[]): T[] {
  return arr.map(toCamelCaseObj<T>)
}
