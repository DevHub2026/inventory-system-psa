import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }

    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Login failed.')
          : err instanceof Error
            ? err.message
            : 'Login failed.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md" title="Sign in" subtitle="PSA Office Inventory System">
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {error && (
            <Alert tone="error" title="Unable to sign in">
              {error}
            </Alert>
          )}
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@psa.gov.ph"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <Link to="#" className="text-xs text-brand-700 hover:underline">
              Forgot password?
            </Link>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Login'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
