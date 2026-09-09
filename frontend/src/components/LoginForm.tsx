import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import Input from './Input'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'

function describeError(error: any): string {
  const raw = error?.response?.data?.message || error?.message || ''
  switch (raw) {
    case 'Invalid credentials':
    case 'Unauthenticated.': return 'Invalid email or password.'
    case 'Validation failed.': return 'Please check your input and try again.'
    default: return raw || 'Unable to sign in. Please try again.'
  }
}

interface LoginFormProps {
  onPrivacyClick?: () => void
}

export default function LoginForm({ onPrivacyClick }: LoginFormProps) {
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
    <form onSubmit={handleSubmit} className="w-full flex flex-col">

      {/* Input Group (16px gap) */}
      <div className="flex flex-col gap-[16px]">
        {/* Email / username */}
        <Input
          id="email"
          name="email"
          placeholder="Employee Number or Email"
          icon={<User size={19} strokeWidth={2} className="text-slate-400" />}
          value={email}
          autoComplete="username"
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          icon={<Lock size={19} strokeWidth={2} className="text-slate-400" />}
          value={password}
          autoComplete="current-password"
          required
          onChange={(e) => setPassword(e.target.value)}
          rightIcon={showPassword ? <EyeOff size={19} strokeWidth={2} /> : <Eye size={19} strokeWidth={2} />}
          onRightIconClick={() => setShowPassword((v) => !v)}
        />
      </div>

      {/* Remember Me and Forgot Password (14px below password) */}
      <div className="flex items-center justify-between mt-[14px]">
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600 cursor-pointer"
          />
          <span className="text-[13.5px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
            Remember me
          </span>
        </label>
        <button
          type="button"
          disabled={forgotLoading}
          onClick={handleForgotPassword}
          className="text-[13.5px] font-semibold text-brand-700 hover:text-brand-800 focus:outline-none focus:underline"
        >
          {forgotLoading ? 'Sending...' : 'Forgot Password?'}
        </button>
      </div>

      {/* Feedback messages */}
      {errorMessage && (
        <div className="bg-red-50 text-red-800 p-3 rounded-[10px] text-sm font-medium flex gap-2.5 items-start border border-red-200 mt-[16px]">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 text-green-800 p-3 rounded-[10px] text-sm font-medium flex gap-2.5 items-start border border-green-200 mt-[16px]">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Primary Sign In Button (16px below remember row) */}
      <button 
        type="submit" 
        disabled={loading} 
        className="w-full h-[52px] mt-[16px] bg-[#1a56db] hover:bg-[#1e40af] text-white font-bold text-[15.5px] rounded-[10px] shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
      >
        {loading ? (
          'Signing In...'
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight size={18} className="stroke-[2.5] text-white/90" />
          </>
        )}
      </button>

      {/* OR Divider (24px spacing) */}
      <div className="relative flex items-center mt-[24px] mb-[24px]">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="shrink-0 px-3 text-[11px] font-bold text-slate-400 tracking-widest uppercase bg-white">
          OR
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>
      
      {/* SSO Buttons */}
      <div className="grid grid-cols-2 gap-[16px]">
        <button
          type="button"
          className="h-[52px] flex items-center justify-center gap-3 px-3 border border-slate-200 rounded-[10px] bg-white hover:bg-slate-50 text-[13.5px] font-semibold text-slate-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 21 21" fill="none">
            <path fill="#f25022" d="M1 1h9v9H1z"/>
            <path fill="#00a4ef" d="M11 1h9v9h-9z"/>
            <path fill="#7fba00" d="M1 11h9v9H1z"/>
            <path fill="#ffb900" d="M11 11h9v9h-9z"/>
          </svg>
          <span className="truncate">Sign in with Microsoft</span>
        </button>
        <button
          type="button"
          className="h-[52px] flex items-center justify-center gap-3 px-3 border border-slate-200 rounded-[10px] bg-white hover:bg-slate-50 text-[13.5px] font-semibold text-slate-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          <span className="truncate">Sign in with Google</span>
        </button>
      </div>

      {/* Privacy Notice Link (Below SSO buttons) */}
      {onPrivacyClick && (
        <div className="mt-[16px] flex items-center justify-start">
          <button
            type="button"
            onClick={onPrivacyClick}
            className="text-[12.5px] font-bold text-brand-700 hover:text-brand-800 hover:underline focus:outline-none"
          >
            Privacy Notice
          </button>
        </div>
      )}

    </form>
  )
}
