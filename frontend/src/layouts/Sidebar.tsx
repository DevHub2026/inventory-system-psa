import { NavLink, useNavigate } from 'react-router-dom'
import {
  Boxes,
  ClipboardList,
  FileBarChart,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  SlidersHorizontal,
  Shield,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin, isStaff, isEmployee } from '@/utils/roleHelpers'
import { displayName } from '@/types'
import logo from '@/assets/logo.png'

const allLinks = [
  { to: '/dashboard',    label: 'Dashboard',           icon: LayoutDashboard,   roles: ['admin', 'staff', 'employee'] },
  { to: '/assets',       label: 'Assets',              icon: Boxes,             roles: ['admin', 'staff', 'employee'] },
  { to: '/reservations', label: 'Borrow Requests',     icon: ClipboardList,     roles: ['admin', 'staff', 'employee'] },
  { to: '/borrowings',   label: 'Borrowed Items',      icon: HandCoins,         roles: ['admin', 'staff', 'employee'] },
  { to: '/inventory',    label: 'Inventory',           icon: Package,           roles: ['admin', 'staff'] },
  { to: '/maintenance',  label: 'Maintenance',         icon: Wrench,            roles: ['admin', 'staff'] },
  { to: '/reports',      label: 'Reports',             icon: FileBarChart,      roles: ['admin', 'staff'] },
  { to: '/users',        label: 'Users',               icon: Users,             roles: ['admin'] },
  { to: '/roles',        label: 'Roles & Permissions', icon: Shield,            roles: ['admin'] },
  { to: '/system-setup', label: 'System Setup',        icon: SlidersHorizontal, roles: ['admin'] },
  { to: '/settings',     label: 'Settings',            icon: Settings,          roles: ['admin', 'staff', 'employee'] },
]

const NAV_GROUPS = [
  { label: 'Main Menu',  paths: ['/dashboard', '/assets', '/reservations', '/borrowings'] },
  { label: 'Operations', paths: ['/inventory', '/maintenance', '/reports'] },
  { label: 'Admin',      paths: ['/users', '/roles', '/system-setup'] },
  { label: 'Account',    paths: ['/settings'] },
]

interface SidebarProps {
  open: boolean
  /** True when viewport ≥ 768px — controls positioning mode */
  isDesktop: boolean
  onClose: () => void
}

export function Sidebar({ open, isDesktop, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const getVisibleLinks = () => {
    if (isAdmin(user))    return allLinks
    if (isStaff(user))    return allLinks.filter((l) => l.roles.includes('staff'))
    if (isEmployee(user)) return allLinks.filter((l) => l.roles.includes('employee'))
    return allLinks.filter((l) => l.roles.includes('employee'))
  }

  const visibleLinks = getVisibleLinks()
  const visiblePaths = new Set(visibleLinks.map((l) => l.to))
  const name         = displayName(user)
  const initials     = name.slice(0, 1).toUpperCase()

  /*
   * POSITIONING LOGIC — 100% inline styles, zero CSS class dependency:
   *
   * Desktop (isDesktop = true):
   *   position: relative  → stays in flex row, takes 260px, main fills rest.
   *   transform: none     → always visible.
   *
   * Mobile (isDesktop = false):
   *   position: fixed     → overlays content, doesn't push main column.
   *   transform:          → translateX(-260px) when closed, 0 when open.
   *   z-index: 40         → above backdrop.
   */
  const sidebarStyle: React.CSSProperties = isDesktop
    ? {
        position: 'relative',
        width: 260,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0B3D91',
        transform: 'none',
        zIndex: 'auto',
        transition: 'none',
      }
    : {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 260,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0B3D91',
        zIndex: 40,
        transform: open ? 'translateX(0)' : 'translateX(-260px)',
        transition: 'transform 0.22s ease-in-out',
      }

  return (
    <>
      {/* Mobile backdrop — only shown when drawer is open on mobile */}
      {!isDesktop && open && (
        <div
          aria-hidden="true"
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 39,
          }}
        />
      )}

      <aside style={sidebarStyle}>

        {/* ── Brand header ── */}
        <div style={{
          display: 'flex', height: 64, flexShrink: 0,
          alignItems: 'center', gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          padding: '0 20px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            display: 'grid', width: 36, height: 36, flexShrink: 0,
            placeItems: 'center', borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>
            <img src={logo} alt="PSA" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              PSA Inventory
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.15em', lineHeight: 1.3, marginTop: 2 }}>
              Region XII
            </div>
          </div>
          {/* Mobile close button */}
          {!isDesktop && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, flexShrink: 0,
                borderRadius: 8, border: 'none', background: 'transparent',
                color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }} aria-label="Main navigation">
          {NAV_GROUPS.map((group) => {
            const groupLinks = visibleLinks.filter((l) => group.paths.includes(l.to))
            if (groupLinks.length === 0) return null
            return (
              <div key={group.label} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.14em',
                  color: 'rgba(255,255,255,0.30)',
                  padding: '0 12px', marginBottom: 4, lineHeight: 1,
                }}>
                  {group.label}
                </div>

                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }} role="list">
                  {groupLinks.map((link) => {
                    if (!visiblePaths.has(link.to)) return null
                    const Icon = link.icon
                    return (
                      <li key={link.to} style={{ margin: 0, padding: 0 }}>
                        <NavLink
                          to={link.to}
                          onClick={onClose}
                          style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            height: 40,
                            padding: '0 12px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 500,
                            lineHeight: 1,
                            textDecoration: 'none',
                            color: isActive ? '#0B3D91' : 'rgba(255,255,255,0.70)',
                            background: isActive ? '#ffffff' : 'transparent',
                            boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
                            transition: 'background 0.15s, color 0.15s',
                            boxSizing: 'border-box',
                          })}
                        >
                          {({ isActive }) => (
                            <>
                              <Icon
                                style={{
                                  width: 17, height: 17, flexShrink: 0,
                                  color: isActive ? '#0B3D91' : 'rgba(255,255,255,0.50)',
                                  transition: 'color 0.15s',
                                }}
                                strokeWidth={isActive ? 2.25 : 1.75}
                                aria-hidden="true"
                              />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {link.label}
                              </span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* ── User footer ── */}
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          padding: '10px 12px 12px',
        }}>
          <button
            type="button"
            onClick={() => { navigate('/settings'); onClose() }}
            style={{
              display: 'flex', width: '100%', alignItems: 'center', gap: 10,
              borderRadius: 10, padding: '8px 10px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              textAlign: 'left', boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            {/* Avatar */}
            <div style={{
              display: 'grid', width: 36, height: 36, flexShrink: 0,
              placeItems: 'center', borderRadius: '50%',
              background: '#FFD400',
              fontSize: 13, fontWeight: 900, color: '#0B3D91',
              boxShadow: '0 0 0 2px rgba(255,212,0,0.40)',
            }}>
              {initials}
            </div>
            {/* Text */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.3, marginTop: 2 }}>
                Account settings
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            style={{
              display: 'flex', width: '100%', alignItems: 'center', gap: 8,
              borderRadius: 10, padding: '7px 12px', marginTop: 4,
              background: 'transparent', border: 'none', cursor: 'pointer',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'rgba(255,255,255,0.10)'
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'transparent'
            }}
          >
            <LogOut size={14} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.60)' }} aria-hidden="true" />
            <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.60)' }}>Sign out</div>
          </button>
        </div>
      </aside>
    </>
  )
}
