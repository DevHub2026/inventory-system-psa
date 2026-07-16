import { api, unwrapData } from '@/services/api'
import type { ApiResponse, User } from '@/types'
import { displayName } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export interface UpdateProfilePayload {
  name?: string
  email?: string
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
  const normalized: User = {
    ...user,
    name: displayName(user),
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
    const { data } = await api.post<LoginResponse>('/login', payload)

    if (!data.success || !data.user || !data.token) {
      throw new Error(data.message || 'Login failed.')
    }

    return persistUser(data.user, data.token)
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
