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
     * are redirected to /login. API routes are protected
     * with getServerSession() checks per-route.
     *
     * Excluded paths:
     * - /login (auth page)
     * - /api/auth (NextAuth routes)
     * - /api/health (health check)
     * - /api/auth/register (registration endpoint)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, logo.svg, robots.txt (public assets)
     */
    '/((?!login|api/auth|api/health|_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)',
  ],
}
