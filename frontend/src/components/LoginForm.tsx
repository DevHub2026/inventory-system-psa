import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/authService'

import Input from './Input'

function describeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const message = err.response?.data?.message

    if (status === 401) return 'Invalid email or password.'
    if (status === 422) return 'Please check your input and try again.'
    if (status === 500) return 'The server could not sign you in. Please try again.'

    return message || 'Unable to sign in. Please try again.'
  }

  const raw = err instanceof Error ? err.message : ''

  switch (raw) {
    case 'Invalid credentials':
    case 'Unauthenticated.':
      return 'Invalid email or password.'
    case 'Validation failed.':
      return 'Please check your input and try again.'
    default:
      return raw || 'Unable to sign in. Please try again.'
  }
}

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (error) {
      setErrorMessage(describeError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    setErrorMessage('')
    setSuccessMessage('')

    if (!email) {
      setErrorMessage('Enter your email address first, then request a reset link.')
      return
    }

    setForgotLoading(true)
    try {
      await authService.forgotPassword({ email })
      setSuccessMessage('Password reset instructions were sent if the account exists.')
    } catch (error) {
      setErrorMessage(describeError(error))
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <Input
        id="email"
        name="email"
        placeholder="Username or Email"
        icon={<User size={20} strokeWidth={2} />}
        value={email}
        autoComplete="username"
        required
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Password"
        icon={<Lock size={20} />}
        value={password}
        autoComplete="current-password"
        required
        onChange={(e) => setPassword(e.target.value)}
        rightIcon={
          showPassword ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )
        }
        onRightIconClick={() => setShowPassword((visible) => !visible)}
      />

      <div className="auth-forgot-row">
        <button
          type="button"
          disabled={forgotLoading}
          onClick={handleForgotPassword}
          className="auth-forgot-password"
        >
          {forgotLoading ? 'Sending reset link...' : 'Forgot Password?'}
        </button>
      </div>

      {errorMessage ? (
        <p className="auth-message auth-message--error">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="auth-message auth-message--success">{successMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="auth-submit"
      >
        {loading ? 'SIGNING IN...' : 'SIGN IN'}
      </button>
    </form>
  )
}
