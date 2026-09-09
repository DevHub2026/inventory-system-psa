import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/layouts/Sidebar'
import { TopNav } from '@/layouts/TopNav'
import SplitView from '@/components/SplitView'
import GlobalQuickAccess from '@/components/GlobalQuickAccess'
import { BorrowingPage } from '@/pages/BorrowingPage'
import { AssetPage } from '@/pages/AssetPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ReservationPage } from '@/pages/ReservationPage'
import { SharedQrScanner } from '@/components/qr/SharedQrScanner'
import { GlobalAIAssistant } from '@/components/chat/GlobalAIAssistant'
import { useSearchParams } from 'react-router-dom'

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
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
        marginLeft: isDesktop ? (sidebarOpen ? 260 : 72) : 0,
        transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <TopNav onMenuClick={() => setSidebarOpen((s) => !s)} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: isDesktop ? '24px 32px' : '16px 16px 24px' }}>
            {/* If a splitRight query param exists, render the current route (Outlet) as left and the requested page as right */}
            <SplitArea />
          </div>
        </main>
      </div>

      {/* Global Quick Access — consolidates split selector, help, scanner, etc.
           On mobile it becomes a draggable FAB with the full quick-action menu. */}
      <GlobalQuickAccess isDesktop={isDesktop} />
      <GlobalAIAssistant />

    </div>
  )
}


function SplitArea() {
  const [searchParams, setSearchParams] = useSearchParams()
  const splitRight = searchParams.get('splitRight')

  const rightMap: Record<string, React.ReactNode> = {
    borrowings: <BorrowingPage />,
    assets: <AssetPage />,
    inventory: <InventoryPage embedded={true} />,
    reservations: <ReservationPage />,
    scanner: <SharedQrScanner open={true} onClose={() => setSearchParams({})} mode="page" />,
  }

  if (!splitRight) return <Outlet />

  const rightSide = rightMap[splitRight] ?? null
  return (
    <SplitView rightOpen={Boolean(rightSide)} rightSide={rightSide} rightWidth={820} onCloseRight={() => setSearchParams({})}>
      <Outlet />
    </SplitView>
  )
}
