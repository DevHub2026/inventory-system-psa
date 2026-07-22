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
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'employee'] },
  { to: '/assets', label: 'Assets', icon: Boxes, roles: ['admin', 'staff', 'employee'] },
  { to: '/reservations', label: 'Borrow Requests', icon: ClipboardList, roles: ['admin', 'staff', 'employee'] },
  { to: '/borrowings', label: 'Borrowed Items', icon: HandCoins, roles: ['admin', 'staff', 'employee'] },
  { to: '/inventory', label: 'Inventory', icon: Package, roles: ['admin', 'staff'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'staff'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['admin', 'staff'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/roles', label: 'Roles & Permissions', icon: Shield, roles: ['admin'] },
  { to: '/system-setup', label: 'System Setup', icon: SlidersHorizontal, roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'staff', 'employee'] },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const getVisibleLinks = () => {
    if (isAdmin(user)) return allLinks
    if (isStaff(user)) return allLinks.filter((l) => l.roles.includes('staff'))
    if (isEmployee(user)) return allLinks.filter((l) => l.roles.includes('employee'))
    return allLinks.filter((l) => l.roles.includes('employee'))
  }

  const visibleLinks = getVisibleLinks()
  const initials = displayName(user).slice(0, 1).toUpperCase()

  return (
    <>
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
          'fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col transition-transform lg:static lg:w-64 lg:translate-x-0',
          'bg-[#003DA5] text-white shadow-2xl',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* ── Top colour bar ── */}
        <div className="flex h-1 flex-none">
          <span className="flex-1 bg-[#003DA5]" />
          <span className="w-10 bg-[#FFD400]" />
          <span className="w-6 bg-[#E31C23]" />
        </div>

        {/* ── Mobile header ── */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-5 lg:hidden">
          <span className="text-sm font-bold tracking-tight">PSA Inventory</span>
          <button type="button" onClick={onClose} aria-label="Close menu"
            className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
            <X className="h-4 w-4 text-white/80" />
          </button>
        </div>

        {/* ── Brand ── */}
        <div className="hidden border-b border-white/10 px-5 py-5 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 shadow-lg">
              <img src={logo} alt="PSA" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight leading-tight">PSA Inventory</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-200/80">Region XII</p>
            </div>
          </div>
          {/* PSA colour accent strip */}
          <div className="mt-4 flex gap-1.5">
            <span className="h-0.5 flex-1 rounded-full bg-white/30" />
            <span className="h-0.5 w-8 rounded-full bg-[#FFD400]" />
            <span className="h-0.5 w-4 rounded-full bg-[#E31C23]" />
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-200/50">
            Navigation
          </p>
          <div className="space-y-0.5">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'group flex min-h-[2.375rem] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-white text-[#003DA5] font-semibold shadow-md shadow-black/20'
                        : 'text-blue-100/80 hover:bg-white/10 hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('h-[17px] w-[17px] flex-none transition-colors',
                        isActive ? 'text-[#003DA5]' : 'text-blue-200/70 group-hover:text-white')} />
                      <span className="truncate">{link.label}</span>
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FFD400] flex-none" />
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* ── User footer ── */}
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => { navigate('/settings'); onClose() }}
            className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-white/10 transition-colors"
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#FFD400] text-sm font-extrabold text-[#003DA5] shadow-md">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white">{displayName(user)}</span>
              <span className="block truncate text-[10px] text-blue-200/60">Account settings</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-200/70 transition-colors hover:bg-[#E31C23]/20 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5 flex-none" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
