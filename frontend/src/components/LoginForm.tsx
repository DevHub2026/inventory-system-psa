import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, Lock, Shield, User } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

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
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setErrorMessage('')

    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (error) {
      setErrorMessage(describeError(error))
    } finally {
      setLoading(false)
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

      <div className="flex items-center justify-between pt-[8px]">
        <label className="flex items-center gap-[12px] text-[15px] text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-[18px] w-[18px] accent-[#003DA5]"
          />
          Remember me
        </label>

        <button
          type="button"
          className="text-[15px] font-medium leading-none text-[#003DA5] transition-colors duration-300 hover:text-[#0057D9] hover:underline"
        >
          Forgot Password?
        </button>
      </div>

      {errorMessage ? (
        <p className="text-sm font-medium text-red-600">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="primary-button login-shadow sign-in-button h-[64px] w-full rounded-[18px] text-[16px] font-bold tracking-[5px] duration-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'SIGNING IN...' : 'SIGN IN'}
      </button>

      <div className="card-divider">
        <span className="text-[13px] font-medium tracking-[0.22em] text-slate-400">OR</span>
      </div>

      <button
        type="button"
        className="secondary-button flex h-[64px] w-full items-center justify-center gap-[12px] rounded-[18px] text-[14px] font-semibold tracking-[0.06em] duration-300"
      >
        <Shield size={20} strokeWidth={2} className="shrink-0 text-[#003DA5]" />
        LOGIN WITH PSA ACCOUNT
      </button>
    </form>
  )
}
