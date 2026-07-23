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
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin, isStaff, isEmployee } from '@/utils/roleHelpers'
import { displayName } from '@/types'
import logo from '@/assets/logo.png'

/*
 * Sidebar width:  240px on desktop (lg+)
 * On mobile:      fixed drawer that slides in over content
 * Active item:    white pill with primary-blue text — stands out on dark bg
 * Inactive item:  muted white/60, hover white/90 bg
 * Nav item height: 40px — compact but touchable
 */

const allLinks = [
  { to: '/dashboard',    label: 'Dashboard',          icon: LayoutDashboard,   roles: ['admin', 'staff', 'employee'] },
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

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const getVisibleLinks = () => {
    if (isAdmin(user))    return allLinks
    if (isStaff(user))    return allLinks.filter((l) => l.roles.includes('staff'))
    if (isEmployee(user)) return allLinks.filter((l) => l.roles.includes('employee'))
    return allLinks.filter((l) => l.roles.includes('employee'))
  }

  const visibleLinks = getVisibleLinks()
  const name     = displayName(user)
  const initials = name.slice(0, 1).toUpperCase()

  return (
    <>
      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/*
       * SIDEBAR ELEMENT
       * Desktop: static (in flex flow), w-60 (240px), full height via parent h-screen
       * Mobile:  fixed drawer, slides from left, z-40 above backdrop
       */}
      <aside
        className={cn(
          /* layout */
          'flex h-full w-60 shrink-0 flex-col',
          /* colour */
          'bg-[#0B3D91]',
          /* desktop: always visible and in flow */
          'lg:static lg:translate-x-0',
          /* mobile: fixed overlay */
          'fixed inset-y-0 left-0 z-40',
          'transition-transform duration-250 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* ── Brand header ── */}
        <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/10 px-4">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15">
            <img src={logo} alt="PSA" className="h-5 w-5 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold leading-tight text-white">
              PSA Inventory
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/50">
              Region XII
            </p>
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
          {/* Section label */}
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Menu
          </p>

          <ul className="space-y-px" role="list">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              return (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group flex h-10 items-center gap-3 rounded-lg px-3',
                        'text-[13px] font-medium',
                        'transition-colors duration-150',
                        isActive
                          ? 'bg-white text-[#0B3D91] font-semibold'
                          : 'text-white/70 hover:bg-white/10 hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0',
                            isActive
                              ? 'text-[#0B3D91]'
                              : 'text-white/50 group-hover:text-white',
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{link.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── User footer ── */}
        <div className="shrink-0 border-t border-white/10 p-2">
          {/* Profile row */}
          <button
            type="button"
            onClick={() => { navigate('/settings'); onClose() }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-white/10"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FFD400] text-[11px] font-black text-[#0B3D91]">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-white">{name}</span>
              <span className="block text-[10px] text-white/40">Account settings</span>
            </span>
          </button>

          {/* Sign out */}
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-white/50 transition-colors duration-150 hover:bg-white/10 hover:text-white/80"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
