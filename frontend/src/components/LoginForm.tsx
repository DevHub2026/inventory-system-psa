import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, User, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/authService'

function describeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status  = err.response?.status
    const message = err.response?.data?.message
    if (status === 401) return 'Invalid email or password.'
    if (status === 422) return 'Please check your input and try again.'
    if (status === 500) return 'The server could not sign you in. Please try again.'
    return message || 'Unable to sign in. Please try again.'
  }
  const raw = err instanceof Error ? err.message : ''
  switch (raw) {
    case 'Invalid credentials':
    case 'Unauthenticated.': return 'Invalid email or password.'
    case 'Validation failed.': return 'Please check your input and try again.'
    default: return raw || 'Unable to sign in. Please try again.'
  }
}

export default function LoginForm() {
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [showPassword,   setShowPassword]   = useState(false)
  const [loading,        setLoading]        = useState(false)
  const [forgotLoading,  setForgotLoading]  = useState(false)
  const [errorMessage,   setErrorMessage]   = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { login } = useAuth()
  const navigate  = useNavigate()

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {/* Email Input */}
      <div>
        <label htmlFor="email" className="sr-only">
          Email or Employee Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#5a82c1]">
            <User size={18} strokeWidth={2.5} />
          </div>
          <input
            id="email"
            name="email"
            type="text"
            placeholder="Employee Number or Email"
            value={email}
            autoComplete="username"
            required
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full h-[52px] rounded-[12px] border-[1.5px] border-[#c9dcf8] bg-[#fbfdff] text-[14px] text-[#102b67] placeholder-[#88a4ce] transition-colors focus:outline-none focus:border-[#2670db] focus:ring-[3px] focus:ring-[#2670db]/10 hover:border-[#9ebce6]"
            style={{ paddingLeft: '2.75rem', paddingRight: '1rem' }}
          />
        </div>
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#5a82c1]">
            <Lock size={18} strokeWidth={2.5} />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            required
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full h-[52px] rounded-[12px] border-[1.5px] border-[#c9dcf8] bg-[#fbfdff] text-[14px] text-[#102b67] placeholder-[#88a4ce] transition-colors focus:outline-none focus:border-[#2670db] focus:ring-[3px] focus:ring-[#2670db]/10 hover:border-[#9ebce6]"
            style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#5a82c1] hover:text-[#164aa6] transition-colors focus:outline-none"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Utility Row */}
      <div className="flex items-center justify-end mt-[-4px]">
        {/* Remember me removed entirely as per instruction since no backend support exists */}
        <button
          type="button"
          disabled={forgotLoading}
          onClick={handleForgotPassword}
          className="text-[13px] font-bold text-[#1260d4] hover:underline transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {forgotLoading ? 'Sending link...' : 'Forgot Password?'}
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] bg-[#FEF2F2] border border-[#FCA5A5] text-[#D32F2F]">
          <AlertCircle size={16} className="mt-[2px] shrink-0" strokeWidth={2.5} />
          <p className="text-[13px] font-medium leading-[1.4]">{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-[10px] bg-[#F0FDF4] border border-[#86EFAC] text-[#2E7D32]">
          <CheckCircle2 size={16} className="mt-[2px] shrink-0" strokeWidth={2.5} />
          <p className="text-[13px] font-medium leading-[1.4]">{successMessage}</p>
        </div>
      )}

      {/* Submit */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full mt-2 h-[52px] text-[15px] font-bold text-white rounded-[12px] shadow-[0_10px_22px_rgba(18,96,212,0.22)] transition-all flex items-center justify-center gap-2 bg-[#1260d4] hover:bg-[#0e4eaf] border-none disabled:opacity-70 disabled:cursor-wait"
      >
        {loading ? 'Checking access…' : 'Sign In'} {!loading && <ArrowRight size={18} strokeWidth={2.5} />}
      </button>
    </form>
  )
}
