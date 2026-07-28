import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    /*
     * Protect the main app route. Unauthenticated users
     * are redirected to /login. API routes are unprotected
     * for now (add auth checks per-route as needed).
     *
     * Excluded paths:
     * - /login (auth page)
     * - /api/auth (NextAuth routes)
     * - /api/health (health check)
     * - /api/seed (database seeding)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, logo.svg, robots.txt (public assets)
     */
    '/((?!login|api/auth|api/health|api/seed|_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)',
  ],
}
