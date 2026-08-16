import { api, unwrapData } from '@/services/api'
import type { ApiResponse, User } from '@/types'
import { displayName } from '@/types'

type ApiErrorLike = Error & {
  response?: {
    data?: {
      message?: string
    } | string
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface UpdateProfilePayload {
  name?: string
  first_name?: string
  middle_name?: string | null
  last_name?: string
  email?: string
  email_notifications_enabled?: boolean
}

export interface ChangePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

interface LoginResponse {
  success: boolean
  message: string
  user: User
  token: string
}

function persistUser(user: User, token?: string): User {
  /*
   * Build the normalized name AFTER spreading user so user.name takes
   * priority from the server response when present, falling back to
   * displayName() for derived computation from first/last fields.
   */
  const normalized: User = {
    ...user,
    // Normalize and trim server-provided name fields. Prefer server values
    // (full_name then name). If those are missing use the displayName
    // fallback (which no longer returns the literal 'User'). Ensure both
    // name and full_name are present to avoid later merge inconsistencies.
    full_name: (user.full_name && user.full_name.trim()) || (user.name && user.name.trim()) || displayName(user) || '',
    name: (user.name && user.name.trim()) || (user.full_name && user.full_name.trim()) || displayName(user) || '',
  }
  localStorage.setItem('prototype_user', JSON.stringify(normalized))
  if (token) {
    localStorage.setItem('prototype_token', token)
  }
  return normalized
}

export const authService = {
  /**
   * Uses Eman's Auth API: POST /api/v1/login
   * Response provides an authenticated user and Sanctum bearer token.
   */
  async login(payload: LoginPayload): Promise<User> {
    // Basic client-side validation to avoid sending malformed requests
    if (!payload || typeof payload.email !== 'string' || payload.email.trim() === '' || typeof payload.password !== 'string' || payload.password.trim() === '') {
      throw new Error('Please provide both email and password')
    }
    // Debug: log payload (non-sensitive fields only) to help diagnose server 400 responses
    console.debug('authService.login payload', { email: payload.email })

    try {
      // ensure JSON payload and explicit content-type header for backend
      const { data } = await api.post<LoginResponse>('/login', payload, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })

      if (!data.success || !data.user || !data.token) {
        throw new Error(data.message || 'Login failed.')
      }

      return persistUser(data.user, data.token)
    } catch (err: unknown) {
      // Surface backend error details to help debugging (do not log sensitive data in production)
      const apiError = err as ApiErrorLike
      console.error('authService.login error', apiError.response ?? err)
      const responseData = apiError.response?.data
      const backendMessage = typeof responseData === 'string'
        ? responseData
        : responseData?.message || apiError.message || 'Login failed (no additional details)'
      throw new Error(backendMessage, { cause: err })
    }
  },



  async logout(): Promise<void> {
    try {
      await api.post('/logout')
    } catch {
      // clear local session even if API fails
    }
    localStorage.removeItem('prototype_token')
    localStorage.removeItem('prototype_user')
  },

  async me(): Promise<User | null> {
    const token = localStorage.getItem('prototype_token')
    if (!token) {
      return null
    }

    try {
      const { data } = await api.get<ApiResponse<User>>('/me')
      return persistUser(unwrapData(data))
    } catch {
      localStorage.removeItem('prototype_token')
      localStorage.removeItem('prototype_user')
      return null
    }
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.put<ApiResponse<User>>('/profile', payload)
    const updatedUser = unwrapData(data)
    return persistUser(updatedUser)
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.put('/change-password', payload)
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await api.post('/forgot-password', payload)
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await api.post('/reset-password', payload)
  },
}
