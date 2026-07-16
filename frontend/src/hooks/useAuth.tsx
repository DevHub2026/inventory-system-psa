import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authService, type LoginPayload } from '@/services/authService'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void authService
      .me()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const nextUser = await authService.login(payload)
    setUser(nextUser)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      setUser,
    }),
    [user, loading, login, logout, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
