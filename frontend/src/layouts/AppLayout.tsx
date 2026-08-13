import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/layouts/Sidebar'
import { TopNav } from '@/layouts/TopNav'
import GlobalSplitToggle from '@/components/GlobalSplitToggle'
import SplitView from '@/components/SplitView'
import { BorrowingPage } from '@/pages/BorrowingPage'
import { AssetPage } from '@/pages/AssetPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ReservationPage } from '@/pages/ReservationPage'
import { SharedQrScanner } from '@/components/qr/SharedQrScanner'
import { useSearchParams, useNavigate } from 'react-router-dom'

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
import { useLocation } from 'react-router-dom'

export function AppLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop,   setIsDesktop]   = useState(() => window.innerWidth >= 768)

  // Hide the sidebar for focused reader pages (QR asset view / scanned asset pages)
  const hideSidebarFor = location.pathname.startsWith('/qr') || location.pathname.startsWith('/qr/')
  const showSidebar = isDesktop && !hideSidebarFor

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
      if (e.matches) setSidebarOpen(false) // close drawer when switching to desktop
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Lock body scroll and mark main content as hidden to assist mobile drawer UX
  // when the sidebar is open on narrow viewports.
  useEffect(() => {
    if (sidebarOpen && !isDesktop) {
      // prevent background scrolling
      const prevOverflow = document.body.style.overflow
      const prevPaddingRight = document.body.style.paddingRight
      document.body.style.overflow = 'hidden'
      // preserve layout when scrollbar disappears
      try {
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
        if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`
      } catch {}
      return () => {
        document.body.style.overflow = prevOverflow || ''
        document.body.style.paddingRight = prevPaddingRight || ''
      }
    }
    return
  }, [sidebarOpen, isDesktop])

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
    {showSidebar && (
      <Sidebar
        open={sidebarOpen}
        isDesktop={isDesktop}
        onClose={() => setSidebarOpen(false)}
      />
    )}

    {/* ── Main column — always fills the space not taken by sidebar ── */}
    <div style={{
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }} aria-hidden={sidebarOpen && !isDesktop}>
      <TopNav onMenuClick={() => setSidebarOpen(true)} />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: showSidebar ? 1440 : 960, margin: '0 auto', padding: '24px 32px', paddingBottom: isDesktop ? '24px' : 92 }}>
          {/* If a splitRight query param exists, render the current route (Outlet) as left and the requested page as right */}
          <SplitArea />
        </div>
      </main>
    </div>

      {/* Global split selector button (accessibility FAB) */}
      <GlobalSplitToggle />
      {/* Bottom navigation for mobile */}
      {!isDesktop && (
        <MobileBottomNav />
      )}

    </div>
  )
}

function MobileBottomNav() {
  const navigate = useNavigate()
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, display: 'flex', justifyContent: 'space-around', padding: '8px 12px', background: 'rgba(255,255,255,0.98)', borderTop: '1px solid #E6EDF4' }}>
      <button onClick={() => navigate('/assets')} style={mobileBtnStyle}>Assets</button>
      <button onClick={() => navigate('/inventory')} style={mobileBtnStyle}>Inventory</button>
      <button onClick={() => navigate('/borrowings')} style={mobileBtnStyle}>Borrowings</button>
      <button onClick={() => navigate('/reservations')} style={mobileBtnStyle}>Reservations</button>
    </div>
  )
}

const mobileBtnStyle: React.CSSProperties = {
  flex: 1,
  height: 44,
  margin: '0 6px',
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  background: '#fff',
  color: '#0F172A',
  fontSize: 14,
  fontWeight: 700,
}

function SplitArea() {
  const [searchParams, setSearchParams] = useSearchParams()
  const splitRight = searchParams.get('splitRight')

  const rightMap: Record<string, React.ReactNode> = {
    borrowings: <BorrowingPage />,
    assets: <AssetPage />,
    inventory: <InventoryPage />,
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
