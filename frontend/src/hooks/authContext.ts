import { createContext } from 'react'
import type { LoginPayload } from '@/services/authService'
import type { User } from '@/types'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
