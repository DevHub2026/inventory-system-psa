import { NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpen,
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
import { hasPermission, canManageIssuance } from '@/utils/roleHelpers'
import { displayName } from '@/types'
import logo from '@/assets/logo.png'

const allLinks = [
  { to: '/dashboard',              label: 'Dashboard',              icon: LayoutDashboard,     permission: 'nav.dashboard' },
  { to: '/qr',                     label: 'QR Scanner',             icon: QrCode,              permission: 'always' },
  { to: '/assets',                 label: 'Assets',                 icon: Boxes,               permission: 'nav.assets' },
  { to: '/reservations',           label: 'Borrow Requests',        icon: ClipboardList,       permission: 'nav.reservations' },
  { to: '/borrowings',             label: 'Borrowed Items',         icon: HandCoins,           permission: 'nav.borrowings' },
  { to: '/issued-assets',          label: 'Issued Assets',         icon: Briefcase,           permission: 'nav.issued_assets' },
  { to: '/extension-requests',     label: 'Extension Requests',     icon: CalendarClock,       permission: 'nav.extension_requests' },
  { to: '/inventory',              label: 'Inventory',              icon: Package,             permission: 'nav.inventory' },
  { to: '/maintenance',            label: 'Maintenance',            icon: Wrench,              permission: 'nav.maintenance' },
  { to: '/reports',                label: 'Reports',                icon: FileBarChart,        permission: 'nav.reports' },
  { to: '/history',                label: 'History',                icon: History,             permission: 'nav.history' },
  { to: '/audit-logs',             label: 'Audit Logs',             icon: Shield,              permission: 'nav.audit_logs' },
  { to: '/users',                  label: 'Users',                  icon: Users,               permission: 'nav.users' },
  { to: '/roles',                  label: 'Roles & Permissions',    icon: Shield,              permission: 'nav.roles' },
  { to: '/faqs',                   label: 'FAQ Management',         icon: BookOpen,            permission: 'nav.faqs' },
  { to: '/system-setup',           label: 'System Setup',           icon: SlidersHorizontal,   permission: 'nav.system_setup' },
  { to: '/workflows',              label: 'Approval Workflows',     icon: GitMerge,            permission: 'nav.workflows' },
  { to: '/qr-scan-history',        label: 'QR Scan Audit History',  icon: History,             permission: 'nav.qr_scan_history' },
  { to: '/document-templates',     label: 'Document Templates',     icon: FileText,            permission: 'nav.system_setup' },
  { to: '/settings',               label: 'Settings',               icon: Settings,            permission: 'always' },
  { to: '/sessions',               label: 'Active Sessions',        icon: LogOut,              permission: 'always' },
  { to: '/privacy',                label: 'Privacy Notice',         icon: Shield,              permission: 'always' },
  { to: '/developers',             label: 'Development Team',       icon: Code2,               permission: 'always' },
]


const NAV_GROUPS = [
  { label: 'Self Service', paths: ['/qr'] },
  { label: 'Main Menu',  paths: ['/dashboard', '/assets', '/reservations', '/borrowings'] },
  { label: 'Operations', paths: ['/issued-assets', '/extension-requests', '/inventory', '/maintenance', '/reports', '/history'] },
  { label: 'Admin',      paths: ['/users', '/roles', '/faqs', '/system-setup', '/workflows', '/audit-logs', '/qr-scan-history', '/document-templates'] },
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

  const getVisibleLinks = () => {
    const links = allLinks.filter((l) => {
      if (l.permission === 'always') return true
      return hasPermission(user, l.permission)
    })
    
    // Add fallback if no permissions matched
    if (links.length === 0) {
      return allLinks.filter((l) => l.permission === 'always' || l.to === '/dashboard')
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
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        width: open ? 260 : 72,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0B3D91 0%, #0A3580 50%, #082A6A 100%)',
        transform: 'translateX(0)',
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 30,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
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
        zIndex: 40,
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
            zIndex: 39,
          }}
        />
      )}

      <aside className="psa-sidebar" data-open={open} style={sidebarStyle}>

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
          <div style={{ minWidth: 0, flex: 1, display: open || !isDesktop ? 'block' : 'none' }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: '#ffffff',
              lineHeight: 1.3, letterSpacing: '0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              PSA Inventory
            </div>
            <div style={{
              fontSize: 10, fontWeight: 600,
              color: 'rgba(255,255,255,0.88)',
              textTransform: 'uppercase', letterSpacing: '0.18em',
              lineHeight: 1.3, marginTop: 2,
            }}>
              Saragani-Gensan
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
                color: 'rgba(255,255,255,0.78)', cursor: 'pointer',
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
                  color: 'rgba(255,255,255,0.60)',
                  padding: '0 10px', marginBottom: 4, lineHeight: 1,
                  display: open || !isDesktop ? 'block' : 'none',
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
                          onClick={() => { if (!isDesktop) onClose() }}
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
                            color: isActive ? '#0B3D91' : 'rgba(255,255,255,0.88)',
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
                                  color: isActive ? '#0B3D91' : 'rgba(255,255,255,0.72)',
                                  transition: 'color 0.15s',
                                }}
                                strokeWidth={isActive ? 2.25 : 1.75}
                                aria-hidden="true"
                              />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: open || !isDesktop ? 'inline' : 'none' }}>
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
            onClick={() => { navigate('/settings'); if (!isDesktop) onClose() }}
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
            <div style={{ minWidth: 0, flex: 1, display: open || !isDesktop ? 'block' : 'none' }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#ffffff',
                lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {name}
              </div>
              <div style={{
                fontSize: 10.5, color: 'rgba(255,255,255,0.68)',
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
            <LogOut size={14} style={{ flexShrink: 0, color: 'rgba(255,255,255,0.68)' }} aria-hidden="true" />
            <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.68)' }}>Sign out</div>
          </button>
        </div>

      </aside>
    </>
  )
}