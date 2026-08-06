import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
  // Only redirect to /login when an auth-protected path is hit AND there
  // is no session. Public paths (landing, guide, login) are allowed
  // through without a session.
  callbacks: {
    authorized: ({ token, path }) => {
      // Public paths that never require auth
      const publicPaths = ['/', '/guide', '/login']
      if (publicPaths.includes(path)) {
        return true
      }
      // Everything else requires a session token
      return !!token
    },
  },
})

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals, public static assets,
     * and auth/health API routes (which handle their own auth).
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)',
  ],
}
