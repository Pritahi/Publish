'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Stamp, Loader2, AlertCircle } from 'lucide-react'

/**
 * Map any internal/technical error string coming from the API or NextAuth
 * to a single, user-friendly message. We NEVER show the raw string — even
 * if it looks friendly — because internal codes (e.g. `gmail_save_failed`,
 * `PGRST116`, `CredentialsSignin`) can leak through and confuse users.
 *
 * If we don't recognize the error, we fall back to a generic safe message.
 * The real error remains in the server logs for debugging.
 */
function toFriendlyError(raw: string | undefined | null): string {
  if (!raw) return 'Something went wrong. Please try again.'

  const code = raw.toLowerCase()

  // Auth-related
  if (code.includes('invalid credentials') || code.includes('credentialssignin')) {
    return 'Invalid email or password. Please try again.'
  }
  if (code.includes('email and password are required')) {
    return 'Please enter both your email and password.'
  }
  if (code.includes('already exists') || code.includes('duplicate')) {
    return 'An account with this email already exists. Try signing in instead.'
  }

  // Validation
  if (code.includes('validation') || code.includes('invalid email')) {
    return 'Please check your email and password and try again.'
  }
  if (code.includes('password')) {
    return 'Password must be at least 6 characters.'
  }

  // Gmail-related (defensive — these should never reach here anymore,
  // but if they do, we strip the internal code).
  if (code.startsWith('gmail_')) {
    return 'We could not connect your Gmail. You can try again later from Settings.'
  }

  // Generic fallback for anything else (DB errors, network, etc.)
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const result = await signIn('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        })

        if (result?.error) {
          setError(toFriendlyError(result.error))
        } else if (result?.ok) {
          router.push('/')
          router.refresh()
        } else {
          setError('Something went wrong. Please try again.')
        }
      } else {
        // Register
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          setError(toFriendlyError(data?.error))
          return
        }

        // Auto sign in after registration
        const result = await signIn('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        })

        if (result?.error) {
          setError(toFriendlyError(result.error))
        } else if (result?.ok) {
          router.push('/')
          router.refresh()
        } else {
          setError('Something went wrong. Please try again.')
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
            <Stamp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">NotaryPro</h1>
            <p className="text-sm text-slate-500">Business Manager</p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Sign in to manage your notary business'
                : 'Get started with NotaryPro SaaS'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="text-sm text-slate-600 hover:text-emerald-600 transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          NotaryPro SaaS &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
