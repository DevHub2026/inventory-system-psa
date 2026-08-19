export interface AccessibilityPreferences {
  fontSize: 'default' | 'large'
  highContrast: boolean
  reducedMotion: boolean
}

import { authService } from '@/services/authService'

const KEY = 'psa_accessibility_preferences_v1'

function getUserIdFromLocalCache(): string | null {
  try {
    const raw = localStorage.getItem('prototype_user')
    if (!raw) return null
    const user = JSON.parse(raw)
    return user?.id ? String(user.id) : null
  } catch {
    return null
  }
}

function storageKeyForUser(userId: string | null): string {
  return userId ? `${KEY}:${userId}` : `${KEY}:anon`
}

export function getPreferences(): AccessibilityPreferences {
  try {
    const userId = getUserIdFromLocalCache()
    const raw = localStorage.getItem(storageKeyForUser(userId))
    if (!raw) return { fontSize: 'default', highContrast: false, reducedMotion: false }
    return JSON.parse(raw) as AccessibilityPreferences
  } catch {
    return { fontSize: 'default', highContrast: false, reducedMotion: false }
  }
}

export function setLocalPreferences(p: Partial<AccessibilityPreferences>) {
  const userId = getUserIdFromLocalCache()
  const key = storageKeyForUser(userId)
  const current = getPreferences()
  const next = { ...current, ...p }
  localStorage.setItem(key, JSON.stringify(next))
  applyPreferences(next)
}

export function setPreferences(p: Partial<AccessibilityPreferences>) {
  setLocalPreferences(p)
  void syncPreferencesToServer(p)
}

// Persist to backend if user is authenticated (best-effort, do not block)
export function syncPreferencesToServer(p: Partial<AccessibilityPreferences>) {
  try {
    const userId = getUserIdFromLocalCache()
    const token = localStorage.getItem('prototype_token')
    if (token && userId) {
      return authService.updateAccessibilityPreferences({
        fontSize: p.fontSize,
        highContrast: p.highContrast,
        reducedMotion: p.reducedMotion,
      }).then((resp) => {
        try {
          const raw = localStorage.getItem('prototype_user')
          if (raw) {
            const u = JSON.parse(raw)
            u.accessibility_preferences = resp
            localStorage.setItem('prototype_user', JSON.stringify(u))
            // Also update per-user pref cache with normalized shape expected by frontend
            localStorage.setItem(storageKeyForUser(userId), JSON.stringify({
              fontSize: resp.font_size ?? 'default',
              highContrast: Boolean(resp.high_contrast ?? false),
              reducedMotion: Boolean(resp.reduced_motion ?? false),
            }))
          }
        } catch (_e) {
          // ignore
        }
        return resp
      }).catch((e) => {
        console.warn('Failed to persist accessibility preferences', e)
        return null
      })
    }
  } catch (_e) {
    // ignore
  }
  return Promise.resolve(null)
}

export function applyPreferences(p: AccessibilityPreferences) {
  // font size
  if (p.fontSize === 'large') {
    document.documentElement.style.fontSize = '18px'
  } else {
    document.documentElement.style.fontSize = ''
  }

  // high contrast - toggle a data attribute that can be used in CSS
  if (p.highContrast) {
    document.documentElement.setAttribute('data-psa-high-contrast', '1')
  } else {
    document.documentElement.removeAttribute('data-psa-high-contrast')
  }

  // reduced motion
  if (p.reducedMotion) {
    document.documentElement.setAttribute('data-psa-reduced-motion', '1')
  } else {
    document.documentElement.removeAttribute('data-psa-reduced-motion')
  }
}

// Apply preferences on module load
try {
  applyPreferences(getPreferences())
} catch {
  // ignore in non-browser contexts
}
