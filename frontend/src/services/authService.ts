import { api, unwrapData } from '@/services/api'
import type { ApiResponse, User } from '@/types'
import { displayName } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

/** Login data from AuthController: UserResource fields + token. */
interface LoginData extends User {
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
   * Response data = user fields + token (bearer / Sanctum personal access token).
   */
  async login(payload: LoginPayload): Promise<User> {
    const { data } = await api.post<ApiResponse<LoginData>>('/login', payload)

    if (!data.success || !data.data?.token) {
      throw new Error(data.message || 'Login failed.')
    }

    const { token, ...user } = data.data
    return persistUser(user, token)
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
      const cached = localStorage.getItem('prototype_user')
      return cached ? (JSON.parse(cached) as User) : null
    }
  },
}
