import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/layouts/Sidebar'
import { TopNav } from '@/layouts/TopNav'

/**
 * AppLayout — guaranteed two-column shell using 100% inline styles.
 *
 * The outer div is a flex row. On desktop the sidebar is a normal
 * flex child (260px, shrink-0). On mobile it is rendered as a fixed
 * overlay via a portal-like pattern: the sidebar is REMOVED from the
 * flex row and inserted as a fixed element only when the drawer is open.
 *
 * We detect desktop by watching window.innerWidth >= 768px.
 * Everything is inline — no CSS class can interfere.
 */
export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop,   setIsDesktop]   = useState(() => window.innerWidth >= 768)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
      if (e.matches) setSidebarOpen(false) // close drawer when switching to desktop
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#F2F4F8',
      position: 'relative',
    }}>

      {/* ── Sidebar ── */}
      <Sidebar
        open={sidebarOpen}
        isDesktop={isDesktop}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main column — always fills the space not taken by sidebar ── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 32px' }}>
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  )
}
