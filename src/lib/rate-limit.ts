import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple rate limiting middleware for API routes.
 *
 * Uses in-memory store — suitable for single-instance deployments.
 * For multi-instance (clustered) deployments, use Redis or a similar
 * distributed store.
 *
 * Usage in API routes:
 *   const rateLimitResult = rateLimit(request)
 *   if (rateLimitResult) return rateLimitResult
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 60 seconds
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key)
      }
    }
  }, 60_000)
}

export interface RateLimitOptions {
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  windowMs: number
  /** Maximum number of requests per window (default: 60) */
  maxRequests: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 60_000,
  maxRequests: 60,
}

/**
 * Rate limit a request. Returns a 429 response if the limit is exceeded,
 * or null if the request is allowed.
 */
export function rateLimit(
  request: NextRequest,
  options: Partial<RateLimitOptions> = {}
): NextResponse | null {
  const windowMs = options.windowMs ?? DEFAULT_OPTIONS.windowMs
  const maxRequests = options.maxRequests ?? DEFAULT_OPTIONS.maxRequests

  // Use IP address as the key (fallback to a generic key)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
  const key = `${ip}`

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs })
    return null
  }

  entry.count++

  if (entry.count > maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(entry.resetTime),
        },
      }
    )
  }

  return null
}
