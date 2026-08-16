import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService, type LoginPayload } from '@/services/authService'
import type { User } from '@/types'
import { AuthContext } from '@/hooks/authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = localStorage.getItem('prototype_user')
    if (cached) {
      try { setUser(JSON.parse(cached) as User) } catch { /* ignore malformed cache */ }
    }
    void authService
      .me()
      .then((fresh) => {
        if (fresh) setUser(fresh)
      })
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
