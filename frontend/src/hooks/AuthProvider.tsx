import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService, type LoginPayload } from '@/services/authService'
import type { User } from '@/types'
import { AuthContext } from '@/hooks/authContext'
import { applyPreferences, setLocalPreferences } from '@/utils/accessibilityPreferences'

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
        if (fresh) {
          setUser(fresh)
          try {
            // Apply accessibility preferences from server if present
            const prefs = (fresh as unknown as Record<string, unknown>)['accessibility_preferences'] as Record<string, unknown> | undefined
            if (prefs) {
              // normalize server shape to frontend
              const fontSizeRaw = prefs['font_size']
              const fontSize = (typeof fontSizeRaw === 'string' && (fontSizeRaw === 'large' || fontSizeRaw === 'default')) ? (fontSizeRaw as 'large' | 'default') : 'default'
              const normalized = {
                fontSize,
                highContrast: Boolean(prefs['high_contrast'] ?? false),
                reducedMotion: Boolean(prefs['reduced_motion'] ?? false),
              }
              setLocalPreferences(normalized)
              applyPreferences(normalized)
            }
          } catch (_e) {
            // ignore
          }
        }
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
