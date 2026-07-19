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
    <form onSubmit={handleSubmit} className="login-card-form-fields">
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
            <EyeOff size={20} onClick={() => setShowPassword(false)} />
          ) : (
            <Eye size={20} onClick={() => setShowPassword(true)} />
          )
        }
      />

      <div className="flex justify-end pt-[8px]">
        <button
          type="button"
          disabled={forgotLoading}
          onClick={handleForgotPassword}
          className="text-[15px] font-medium leading-none text-[#003DA5] transition-colors duration-300 hover:text-[#0057D9] hover:underline"
        >
          {forgotLoading ? 'Sending reset link...' : 'Forgot Password?'}
        </button>
      </div>

      {errorMessage ? (
        <p className="text-sm font-medium text-red-600">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="primary-button login-shadow sign-in-button h-[64px] w-full rounded-[18px] text-[16px] font-bold tracking-[5px] duration-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'SIGNING IN...' : 'SIGN IN'}
      </button>
    </form>
  )
}
