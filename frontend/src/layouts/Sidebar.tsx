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

const allLinks = [
  { to: '/dashboard',   label: 'Dashboard',         icon: LayoutDashboard,  roles: ['admin', 'staff', 'employee'] },
  { to: '/assets',      label: 'Assets',             icon: Boxes,            roles: ['admin', 'staff', 'employee'] },
  { to: '/reservations',label: 'Borrow Requests',    icon: ClipboardList,    roles: ['admin', 'staff', 'employee'] },
  { to: '/borrowings',  label: 'Borrowed Items',     icon: HandCoins,        roles: ['admin', 'staff', 'employee'] },
  { to: '/inventory',   label: 'Inventory',          icon: Package,          roles: ['admin', 'staff'] },
  { to: '/maintenance', label: 'Maintenance',        icon: Wrench,           roles: ['admin', 'staff'] },
  { to: '/reports',     label: 'Reports',            icon: FileBarChart,     roles: ['admin', 'staff'] },
  { to: '/users',       label: 'Users',              icon: Users,            roles: ['admin'] },
  { to: '/roles',       label: 'Roles & Permissions',icon: Shield,           roles: ['admin'] },
  { to: '/system-setup',label: 'System Setup',       icon: SlidersHorizontal,roles: ['admin'] },
  { to: '/settings',    label: 'Settings',           icon: Settings,         roles: ['admin', 'staff', 'employee'] },
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
  const initials = displayName(user).slice(0, 1).toUpperCase()

  return (
    <>
      {/* ── Mobile overlay ── */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          aria-label="Close sidebar overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          /* sizing */
          'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col',
          /* desktop: static in flow */
          'lg:static lg:w-[260px] lg:translate-x-0',
          /* background + brand colour */
          'bg-[#0D47A1] text-white',
          /* shadow */
          'shadow-[4px_0_24px_rgba(0,0,0,.15)]',
          /* mobile slide */
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* ── PSA top colour bar ── */}
        <div className="flex h-1 shrink-0">
          <span className="flex-1 bg-[#0D47A1]" />
          <span className="w-10 bg-[#FFD400]" />
          <span className="w-6  bg-[#E31C23]" />
        </div>

        {/* ── Mobile header (close button) ── */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5 lg:hidden">
          <span className="text-[14px] font-bold tracking-tight">PSA Inventory</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Brand block (desktop) ── */}
        <div className="hidden shrink-0 border-b border-white/10 px-5 py-5 lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20 shadow-lg">
              <img src={logo} alt="PSA logo" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <p className="text-[14px] font-extrabold leading-tight tracking-tight">PSA Inventory</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-200/70">
                Region XII
              </p>
            </div>
          </div>
          {/* PSA colour accent strip */}
          <div className="mt-4 flex gap-1.5">
            <span className="h-0.5 flex-1 rounded-full bg-white/25" />
            <span className="h-0.5 w-8 rounded-full bg-[#FFD400]" />
            <span className="h-0.5 w-4 rounded-full bg-[#E31C23]" />
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/50">
            Navigation
          </p>

          <ul className="space-y-0.5" role="list">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              return (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        /* base — height 52px, icon 20px, gap 12px */
                        'group flex h-[52px] items-center gap-[12px] rounded-xl px-3',
                        'text-[14px] font-medium',
                        'transition-all duration-200',
                        isActive
                          ? /* active: white bg, primary text, subtle shadow */
                            'bg-white text-[#0D47A1] font-semibold shadow-[0_2px_8px_rgba(0,0,0,.12)]'
                          : /* inactive */
                            'text-blue-100/80 hover:bg-white/12 hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'h-5 w-5 shrink-0 transition-colors duration-200',
                            isActive
                              ? 'text-[#0D47A1]'
                              : 'text-blue-200/70 group-hover:text-white',
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{link.label}</span>
                        {isActive && (
                          <span
                            className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFD400]"
                            aria-hidden="true"
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── User footer ── */}
        <div className="shrink-0 border-t border-white/10 p-3">
          {/* Settings shortcut */}
          <button
            type="button"
            onClick={() => { navigate('/settings'); onClose() }}
            className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors duration-200 hover:bg-white/10"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFD400] text-[13px] font-extrabold text-[#0D47A1] shadow">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-white">
                {displayName(user)}
              </span>
              <span className="block text-[11px] text-blue-200/60">Account settings</span>
            </span>
          </button>

          {/* Sign out */}
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-blue-200/70 transition-colors duration-200 hover:bg-[#E31C23]/20 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
