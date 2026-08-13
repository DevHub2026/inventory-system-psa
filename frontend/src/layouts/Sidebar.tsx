import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  Boxes,
  CalendarClock,
  ClipboardList,
  FileBarChart,
  FileText,
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
  Briefcase,
  Code2,
  GitMerge,
  QrCode,
  History,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin, isStaff, isEmployee, canManageIssuance } from '@/utils/roleHelpers'
import { displayName } from '@/types'
import logo from '@/assets/logo.png'

const allLinks = [
  { to: '/dashboard',              label: 'Dashboard',              icon: LayoutDashboard,     roles: ['admin', 'staff', 'employee'] },
  { to: '/qr',                     label: 'QR Scanner',             icon: QrCode,              roles: ['admin', 'staff', 'employee'] },
  { to: '/assets',                 label: 'Assets',                 icon: Boxes,               roles: ['admin', 'staff', 'employee'] },
  { to: '/reservations',           label: 'Borrow Requests',        icon: ClipboardList,       roles: ['admin', 'staff', 'employee'] },
  { to: '/borrowings',             label: 'Borrowed Items',         icon: HandCoins,           roles: ['admin', 'staff', 'employee'] },
  { to: '/issued-assets',          label: 'Issued Assets',         icon: Briefcase,           roles: ['admin', 'staff', 'employee'] },
  { to: '/extension-requests',     label: 'Extension Requests',     icon: CalendarClock,       roles: ['admin', 'staff'] },
  { to: '/inventory',              label: 'Inventory',              icon: Package,             roles: ['admin', 'staff'] },
  { to: '/maintenance',            label: 'Maintenance',            icon: Wrench,              roles: ['admin', 'staff'] },
  { to: '/reports',                label: 'Reports',                icon: FileBarChart,        roles: ['admin', 'staff'] },
  { to: '/users',                  label: 'Users',                  icon: Users,               roles: ['admin'] },
  { to: '/roles',                  label: 'Roles & Permissions',    icon: Shield,              roles: ['admin'] },
  { to: '/system-setup',           label: 'System Setup',           icon: SlidersHorizontal,   roles: ['admin'] },
  { to: '/workflows',              label: 'Approval Workflows',     icon: GitMerge,            roles: ['admin'] },
  { to: '/qr-scan-history',        label: 'QR Scan Audit History',  icon: History,             roles: ['admin', 'staff'] },
  { to: '/document-templates',     label: 'Document Templates',     icon: FileText,            roles: ['admin'] },
  { to: '/settings',               label: 'Settings',               icon: Settings,            roles: ['admin', 'staff', 'employee'] },
  { to: '/sessions',               label: 'Active Sessions',        icon: LogOut,              roles: ['admin', 'staff', 'employee'] },
  { to: '/privacy',                label: 'Privacy Notice',         icon: Shield,              roles: ['admin', 'staff', 'employee'] },
  { to: '/developers',             label: 'Development Team',       icon: Code2,               roles: ['admin', 'staff', 'employee'] },
]


const NAV_GROUPS = [
  { label: 'Self Service', paths: ['/qr'] },
  { label: 'Main Menu',  paths: ['/dashboard', '/assets', '/reservations', '/borrowings'] },
  { label: 'Operations', paths: ['/issued-assets', '/extension-requests', '/inventory', '/maintenance', '/reports'] },
  { label: 'Admin',      paths: ['/users', '/roles', '/system-setup', '/workflows', '/qr-scan-history', '/document-templates'] },
  { label: 'Account',    paths: ['/settings', '/sessions', '/privacy', '/developers'] },
]

interface SidebarProps {
  open: boolean
  isDesktop: boolean
  onClose: () => void
}

export function Sidebar({ open, isDesktop, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Close sidebar on Escape for mobile users and focus management
  useEffect(() => {
    if (!open || isDesktop) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    // focus first interactive element inside the sidebar for keyboard users
    setTimeout(() => {
      try {
        const el = document.querySelector('.psa-sidebar a, .psa-sidebar button') as HTMLElement | null
        if (el) el.focus()
      } catch {}
    }, 50)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, isDesktop, onClose])

  const getVisibleLinks = () => {
    let links
    if (isAdmin(user)) {
      links = allLinks
    } else if (isStaff(user)) {
      links = allLinks.filter((l) => l.roles.includes('staff') || l.roles.includes('employee'))
    } else if (isEmployee(user)) {
      links = allLinks.filter((l) => l.roles.includes('employee'))
    } else {
      links = allLinks.filter((l) => l.roles.includes('employee'))
    }
    const seen = new Set<string>()
    return links.filter((link) => {
      if (seen.has(link.to)) return false
      seen.add(link.to)
      return true
    })
  }

  const visibleLinks = getVisibleLinks()
  const visiblePaths = new Set(visibleLinks.map((l) => l.to))
  const linkLabel = (link: (typeof allLinks)[number]) => {
    if (link.to === '/issued-assets' && !canManageIssuance(user)) {
      return 'My Issued Assets'
    }
    return link.label
  }
  const name         = displayName(user)
  const initials     = name.slice(0, 1).toUpperCase()

  const sidebarStyle: React.CSSProperties = isDesktop
    ? {
        position: 'relative',
        width: 260,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0B3D91 0%, #0A3580 50%, #082A6A 100%)',
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
        background: 'linear-gradient(180deg, #0B3D91 0%, #0A3580 50%, #082A6A 100%)',
        zIndex: 9999,
        transform: open ? 'translateX(0)' : 'translateX(-260px)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }

  return (
    <>
      {!isDesktop && open && (
        <div
          aria-hidden="true"
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.50)',
            zIndex: 9989,
          }}
        />
      )}

      <aside className="psa-sidebar" data-open={open ? 'true' : 'false'} style={sidebarStyle}>

        {/* ── Brand header ── */}
        <div style={{
          display: 'flex', height: 64, flexShrink: 0,
          alignItems: 'center', gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0 20px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            display: 'grid', width: 42, height: 42, flexShrink: 0,
            placeItems: 'center', borderRadius: '50%',
            background: '#ffffff',
            border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <img src={logo} alt="PSA" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: '#ffffff',
              lineHeight: 1.3, letterSpacing: '0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              PSA Inventory
            </div>
            <div style={{
              fontSize: 10, fontWeight: 600,
              color: 'rgba(255,255,255,0.40)',
              textTransform: 'uppercase', letterSpacing: '0.18em',
              lineHeight: 1.3, marginTop: 2,
            }}>
              Region XII
            </div>
          </div>
          {!isDesktop && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, flexShrink: 0,
                borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav style={{
          flex: 1, padding: '12px 10px',
          overflowY: 'scroll', scrollbarWidth: 'none', msOverflowStyle: 'none',
        }} aria-label="Main navigation">
          {NAV_GROUPS.map((group) => {
            const groupLinks = visibleLinks.filter((l) => group.paths.includes(l.to))
            if (groupLinks.length === 0) return null
            return (
              <div key={group.label} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 9.5, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.16em',
                  color: 'rgba(255,255,255,0.25)',
                  padding: '0 10px', marginBottom: 4, lineHeight: 1,
                }}>
                  {group.label}
                </div>

                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }} role="list">
                  {groupLinks.map((link) => {
                    if (!visiblePaths.has(link.to)) return null
                    const Icon = link.icon
                    return (
                      <li key={link.to} style={{ margin: 0, padding: 0 }}>
                        <NavLink
                          to={link.to}
                          end={true}
                          onClick={onClose}
                          style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            height: 38,
                            padding: '0 10px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 450,
                            lineHeight: 1,
                            textDecoration: 'none',
                            color: isActive ? '#0B3D91' : 'rgba(255,255,255,0.72)',
                            background: isActive ? '#ffffff' : 'transparent',
                            boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                            transition: 'all 0.15s ease',
                            boxSizing: 'border-box',
                          })}
                        >
                          {({ isActive }) => (
                            <>
                              <Icon
                                style={{
                                  width: 17, height: 17, flexShrink: 0,
                                  color: isActive ? '#0B3D91' : 'rgba(255,255,255,0.48)',
                                  transition: 'color 0.15s',
                                }}
                                strokeWidth={isActive ? 2.25 : 1.75}
                                aria-hidden="true"
                              />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {linkLabel(link)}
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
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '10px 12px 12px',
        }}>
          <button
            type="button"
            onClick={() => { navigate('/settings'); onClose() }}
            style={{
              display: 'flex', width: '100%', alignItems: 'center', gap: 10,
              borderRadius: 8, padding: '8px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              textAlign: 'left', boxSizing: 'border-box',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
          >
            <div style={{
              display: 'grid', width: 34, height: 34, flexShrink: 0,
              placeItems: 'center', borderRadius: '50%',
              background: '#FFD400',
              fontSize: 13, fontWeight: 900, color: '#0B3D91',
              boxShadow: '0 0 0 2px rgba(255,212,0,0.40)',
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#ffffff',
                lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {name}
              </div>
              <div style={{
                fontSize: 10.5, color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.3, marginTop: 1,
              }}>
                Account settings
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            style={{
              display: 'flex', width: '100%', alignItems: 'center', gap: 8,
              borderRadius: 8, padding: '7px 10px', marginTop: 6,
              background: 'transparent', border: 'none', cursor: 'pointer',
              boxSizing: 'border-box', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'rgba(255,255,255,0.08)'
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'transparent'
            }}
          >
            <LogOut size={14} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.45)' }} aria-hidden="true" />
            <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>Sign out</div>
          </button>
        </div>

      </aside>
    </>
  )
}