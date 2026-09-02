import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Boxes, ClipboardList, Briefcase, Package, FileBarChart, Wrench, HandCoins, CalendarClock, Users, Shield, SlidersHorizontal, BookOpen, LayoutDashboard, QrCode, FileText, Settings, Accessibility, X, Share
} from 'lucide-react'
import HelpAccessibilityHub from './HelpAccessibilityHub'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission, isAdmin } from '@/utils/roleHelpers'
import type { User } from '@/types'

interface QuickAccessItem {
  label: string
  icon: React.ElementType
  route?: string
  action?: string
  splitKey?: string
}

// ── RBAC & Context Aware Menu Generator ─────────────────────────────────────
function useQuickAccessMenu(pathname: string, user: User | null, isDesktop: boolean) {
  return useMemo(() => {
    const groups: { label: string, items: QuickAccessItem[] }[] = []

    const can = (perm: string) => perm === 'always' || hasPermission(user, perm)

    // 1. Contextual Actions
    const contextItems: QuickAccessItem[] = []
    if (pathname.startsWith('/assets')) {
      if (can('nav.assets')) contextItems.push({ label: 'Browse Assets', route: '/assets', icon: Boxes })
      if (can('nav.reservations')) contextItems.push({ label: 'Borrow Request', route: '/reservations', icon: ClipboardList })
      if (can('nav.issued_assets')) contextItems.push({ label: 'My Issued Assets', route: '/issued-assets', icon: Briefcase })
    } else if (pathname.startsWith('/inventory')) {
      if (can('nav.inventory')) contextItems.push({ label: 'Browse Inventory', route: '/inventory', icon: Package })
      if (can('nav.reports')) contextItems.push({ label: 'Inventory Reports', route: '/reports', icon: FileBarChart })
      if (can('nav.maintenance')) contextItems.push({ label: 'Maintenance', route: '/maintenance', icon: Wrench })
    } else if (pathname.startsWith('/borrowings')) {
      if (can('nav.borrowings')) contextItems.push({ label: 'Borrowed Items', route: '/borrowings', icon: HandCoins })
      if (can('nav.issued_assets')) contextItems.push({ label: 'My Issued Assets', route: '/issued-assets', icon: Briefcase })
      if (can('nav.reservations')) contextItems.push({ label: 'Borrow Request', route: '/reservations', icon: ClipboardList })
      if (can('nav.extension_requests')) contextItems.push({ label: 'Extension Requests', route: '/extension-requests', icon: CalendarClock })
    } else if (pathname.startsWith('/reservations')) {
      if (can('nav.reservations')) contextItems.push({ label: 'Borrow Requests', route: '/reservations', icon: ClipboardList })
      if (can('nav.borrowings')) contextItems.push({ label: 'Borrowed Items', route: '/borrowings', icon: HandCoins })
    } else if (['/system-setup', '/users', '/roles', '/faqs', '/workflows', '/audit-logs', '/document-templates'].some(p => pathname.startsWith(p))) {
      if (can('nav.users')) contextItems.push({ label: 'Manage Users', route: '/users', icon: Users })
      if (can('nav.roles')) contextItems.push({ label: 'Roles & Permissions', route: '/roles', icon: Shield })
      if (can('nav.system_setup')) contextItems.push({ label: 'System Setup', route: '/system-setup', icon: SlidersHorizontal })
      if (can('nav.faqs')) contextItems.push({ label: 'FAQ Management', route: '/faqs', icon: BookOpen })
    }

    if (contextItems.length > 0) {
      groups.push({ label: 'Contextual Actions', items: contextItems })
    }

    // 2. Common Actions
    const commonItems: QuickAccessItem[] = []
    if (!pathname.startsWith('/dashboard') && can('nav.dashboard')) {
      commonItems.push({ label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard })
    }
    const hasContext = (route: string) => contextItems.some(i => i.route === route)
    
    if (!hasContext('/assets') && !pathname.startsWith('/assets') && can('nav.assets')) {
       commonItems.push({ label: 'Assets', route: '/assets', icon: Boxes })
    }
    if (!hasContext('/borrowings') && !pathname.startsWith('/borrowings') && can('nav.borrowings')) {
       commonItems.push({ label: 'Borrowings', route: '/borrowings', icon: HandCoins })
    }
    if (!hasContext('/inventory') && !pathname.startsWith('/inventory') && can('nav.inventory')) {
       commonItems.push({ label: 'Inventory', route: '/inventory', icon: Package })
    }
    
    if (commonItems.length > 0) {
      groups.push({ label: 'Common Actions', items: commonItems.slice(0, 3) })
    }

    // 3. Desktop specific split-screen feature
    if (isDesktop) {
      const splitItems: QuickAccessItem[] = []
      if (can('nav.borrowings')) splitItems.push({ label: 'Borrowings', splitKey: 'borrowings', icon: HandCoins })
      if (can('nav.inventory')) splitItems.push({ label: 'Inventory', splitKey: 'inventory', icon: Package })
      if (can('nav.assets')) splitItems.push({ label: 'Assets', splitKey: 'assets', icon: Boxes })
      if (can('nav.reservations')) splitItems.push({ label: 'Reservations', splitKey: 'reservations', icon: ClipboardList })
      if (can('always')) splitItems.push({ label: 'QR Scanner', splitKey: 'scanner', icon: QrCode })
      
      if (splitItems.length > 0) {
        groups.push({ label: 'Open as Right Pane', items: splitItems })
      }
    }

    // 4. Tools
    const toolItems: QuickAccessItem[] = []
    toolItems.push({ label: 'Accessibility & Help', action: 'help', icon: Accessibility })
    
    if (!isDesktop) {
      toolItems.push({ label: 'QR Scanner', route: '/qr', icon: QrCode })
    }

    // Retain existing Documentation permission logic
    const canViewDocumentation = Boolean(
      user && (isAdmin(user) ||
        user.roles?.some((r) => r.name === 'System Administrator' || r.name === 'Super Administrator'))
    )
    if (canViewDocumentation) {
      toolItems.push({ label: 'Documentation', route: '/documentation', icon: FileText })
    }

    groups.push({ label: 'Tools', items: toolItems })

    // 5. Account
    if (can('always')) {
      groups.push({
        label: 'Account',
        items: [
          { label: 'Profile & Settings', route: '/settings', icon: Settings }
        ]
      })
    }

    return groups
  }, [pathname, user, isDesktop])
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isDesktop?: boolean
}

// Drag threshold in px — movement below this is treated as a tap
const DRAG_THRESHOLD = 6
const EDGE_MARGIN    = 16    // min px from each viewport edge
const FAB_SIZE       = 52

export default function GlobalQuickAccess({ isDesktop = true }: Props) {
  const [open,     setOpen]     = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // ── Drag state (mobile only) ─────────────────────────────────────────────
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragStartRef  = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const wasDraggedRef = useRef(false)

  const btnRef   = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuth()

  // Generate the RBAC-aware contextual menu
  const menuGroups = useQuickAccessMenu(location.pathname, user, isDesktop)

  // ── Initialise FAB position (mobile only) ────────────────────────────────
  useEffect(() => {
    if (!isDesktop) {
      setPos({
        x: window.innerWidth  - FAB_SIZE - EDGE_MARGIN,
        y: window.innerHeight - FAB_SIZE - EDGE_MARGIN - 80, // above any content
      })
    }
  }, [isDesktop])

  // ── Clamp helper ─────────────────────────────────────────────────────────
  const clamp = useCallback((x: number, y: number): { x: number; y: number } => {
    const maxX = window.innerWidth  - FAB_SIZE - EDGE_MARGIN
    const maxY = window.innerHeight - FAB_SIZE - EDGE_MARGIN
    return {
      x: Math.max(EDGE_MARGIN, Math.min(x, maxX)),
      y: Math.max(EDGE_MARGIN, Math.min(y, maxY)),
    }
  }, [])

  // ── Snap to nearest edge (left / right) ─────────────────────────────────
  const snapToEdge = useCallback((x: number, y: number): { x: number; y: number } => {
    const mid = window.innerWidth / 2
    const snappedX = x + FAB_SIZE / 2 < mid
      ? EDGE_MARGIN
      : window.innerWidth - FAB_SIZE - EDGE_MARGIN
    return clamp(snappedX, y)
  }, [clamp])

  // ── Pointer-down: start drag ──────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (isDesktop) return
    wasDraggedRef.current = false
    dragStartRef.current = {
      x:  e.clientX,
      y:  e.clientY,
      px: pos?.x ?? 0,
      py: pos?.y ?? 0,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
  }, [isDesktop, pos])

  // ── Pointer-move: update position ────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (isDesktop || !dragStartRef.current) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    if (!wasDraggedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    wasDraggedRef.current = true
    setPos(clamp(
      dragStartRef.current.px + dx,
      dragStartRef.current.py + dy,
    ))
    e.stopPropagation()
  }, [isDesktop, clamp])

  // ── Pointer-up: snap and decide tap vs drag ───────────────────────────────
  const onPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (isDesktop) return
    dragStartRef.current = null
    if (wasDraggedRef.current) {
      // snap to nearest edge
      setPos((p) => p ? snapToEdge(p.x, p.y) : p)
      wasDraggedRef.current = false
      e.stopPropagation()
      return
    }
    // treat as tap → toggle menu
    setOpen((v) => !v)
  }, [isDesktop, snapToEdge])

  // ── Keyboard / click-outside ─────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false) }
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!open) return
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        btnRef.current   && !btnRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleItemClick = (item: QuickAccessItem) => {
    setOpen(false)
    if (item.action === 'help') {
      setHelpOpen(true)
    } else if (item.splitKey) {
      if (item.splitKey === 'scanner') {
        navigate('/qr')
      } else {
        const sp = new URLSearchParams(location.search)
        sp.set('splitRight', item.splitKey)
        navigate({ pathname: location.pathname, search: `?${sp.toString()}` })
      }
    } else if (item.route) {
      navigate(item.route)
    }
  }

  const handleHelpClose = () => {
    setHelpOpen(false)
    try { if (btnRef.current) btnRef.current.focus() } catch { /* ignore */ }
  }

  // ── FAB & Positioning ────────────────────────────────────────────────────
  const fabStyle: React.CSSProperties = isDesktop
    ? { position: 'fixed', right: 18, bottom: 18, zIndex: 70 }
    : {
        position: 'fixed',
        left:     pos?.x ?? (window.innerWidth - FAB_SIZE - EDGE_MARGIN),
        top:      pos?.y ?? (window.innerHeight - FAB_SIZE - EDGE_MARGIN - 80),
        zIndex:   70,
        touchAction: 'none', // prevent scroll hijack during drag
      }

  // Determine if menu should appear above or below the FAB (mobile only)
  const panelAbove = !isDesktop && pos
    ? pos.y > window.innerHeight * 0.55
    : true

  const fabButton = (
    <button
      ref={btnRef}
      onPointerDown={isDesktop ? undefined : onPointerDown}
      onPointerMove={isDesktop ? undefined : onPointerMove}
      onPointerUp={isDesktop ? undefined : onPointerUp}
      onClick={isDesktop ? () => setOpen((v) => !v) : undefined}
      aria-label={open ? 'Close Quick Access' : 'Open Quick Access'}
      title="Quick Access"
      style={{
        width: FAB_SIZE, height: FAB_SIZE,
        borderRadius: 999, border: 'none',
        background: '#0B3D91', color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 18px rgba(11,61,145,0.28)',
        cursor: isDesktop ? 'pointer' : 'grab',
        fontWeight: 700, fontFamily: 'inherit', fontSize: 14,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      {isDesktop ? (open ? <X size={24} /> : <Share size={22} />) : (open ? <X size={24} /> : <Share size={22} />)}
    </button>
  )

  // ── Unified Menu Panel ────────────────────────────────────────────────────
  // Both desktop and mobile share the exact same menu structure, just positioned differently
  
  const desktopPanelStyle: React.CSSProperties = {
    width: 280, 
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 12px 36px rgba(2,6,23,0.12)',
    border: '1px solid #E6EDF4',
    marginBottom: 8,
    padding: '12px 0',
    maxHeight: '65vh',
    overflowY: 'auto',
  }

  const mobilePanelStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 69,
    left: pos ? Math.min(
      Math.max(EDGE_MARGIN, pos.x - 8),
      window.innerWidth - Math.min(window.innerWidth * 0.85, 320) - EDGE_MARGIN,
    ) : EDGE_MARGIN,
    ...(panelAbove
      ? { bottom: window.innerHeight - (pos?.y ?? 0) + 8 }
      : { top: (pos?.y ?? 0) + FAB_SIZE + 8 }
    ),
    width: `min(85vw, 320px)`,
    maxHeight: '65vh',
    overflowY: 'auto',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 16px 48px rgba(2,6,23,0.18)',
    border: '1px solid #E6EDF4',
    padding: '12px 0',
  }

  const sharedPanel = (
    <div ref={panelRef} role="dialog" aria-label="Quick Access Menu" style={isDesktop ? desktopPanelStyle : mobilePanelStyle}>
      <div style={{ padding: '0 16px 10px', borderBottom: '1px solid #F1F5F9', marginBottom: 4 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>Quick Access</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{isDesktop ? 'Shortcuts and tools' : 'Tap an action to navigate'}</div>
      </div>

      {menuGroups.map((group, idx) => (
        <div key={group.label} style={{ padding: '8px 12px 4px', borderTop: idx > 0 ? '1px solid #F1F5F9' : 'none' }}>
          <div style={groupLabelStyle}>{group.label}</div>
          {group.items.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={i}
                onClick={() => handleItemClick(item)}
                style={menuItemStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={menuItemIcon}><Icon size={18} strokeWidth={2.2} /></div>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      ))}
      
      {!isDesktop && (
        <div style={{ borderTop: '1px solid #F1F5F9', margin: '8px 12px 0', paddingTop: 8 }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              ...menuItemStyle,
              color: '#64748B',
              justifyContent: 'center',
            }}
          >
            Close menu
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {isDesktop ? (
        <div style={fabStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {open && sharedPanel}
            {fabButton}
          </div>
        </div>
      ) : (
        <>
          <div style={fabStyle}>
            {fabButton}
          </div>
          {open && sharedPanel}
        </>
      )}

      <HelpAccessibilityHub open={helpOpen} onClose={handleHelpClose} />
    </>
  )
}

// ── Shared styles ────────────────────────────────────────────────────────────

const groupLabelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#94A3B8',
  marginBottom: 4,
  paddingLeft: 4,
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '9px 8px',
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: '#0F172A',
  cursor: 'pointer',
  fontSize: 13.5,
  fontWeight: 600,
  textAlign: 'left',
  boxSizing: 'border-box',
  transition: 'background 0.15s',
}

const menuItemIcon: React.CSSProperties = {
  width: 24,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexShrink: 0,
  color: '#0B3D91',
}
