import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Public paths that don't require authentication.
 * - /            landing page
 * - /guide       in-app help (linked from landing footer)
 * - /login       auth page
 */
const PUBLIC_PATHS = new Set(['/', '/guide', '/login'])

export default withAuth(
  function middleware(_req) {
    // withAuth runs this only on matched paths and only when there IS a token.
    // If we reach here, the user is authenticated — let them through.
    return NextResponse.next()
  },
  {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      // Return true to allow access, false to redirect to signIn.
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        if (PUBLIC_PATHS.has(path)) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals, public static assets,
     * and auth/health API routes (which handle their own auth).
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)',
  ],
}
