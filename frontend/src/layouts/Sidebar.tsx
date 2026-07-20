import { NavLink, useNavigate } from 'react-router-dom'
import {
  Boxes,
  ClipboardList,
  FileBarChart,
  HandCoins,
  LayoutDashboard,
  Landmark,
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

const allLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'employee'] },
  { to: '/assets', label: 'Assets', icon: Boxes, roles: ['admin', 'staff', 'employee'] },
  { to: '/reservations', label: 'Reservations', icon: ClipboardList, roles: ['admin', 'staff', 'employee'] },
  { to: '/borrowings', label: 'Borrowings', icon: HandCoins, roles: ['admin', 'staff', 'employee'] },
  { to: '/inventory', label: 'Inventory', icon: Package, roles: ['admin', 'staff'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'staff'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['admin', 'staff'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/roles', label: 'Roles', icon: Shield, roles: ['admin'] },
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
    if (isAdmin(user)) {
      return allLinks
    }
    if (isStaff(user)) {
      return allLinks.filter((link) => link.roles.includes('staff'))
    }
    if (isEmployee(user)) {
      return allLinks.filter((link) => link.roles.includes('employee'))
    }
    // Fallback for users without roles
    return allLinks.filter((link) => link.roles.includes('employee'))
  }

  const visibleLinks = getVisibleLinks()

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          aria-label="Close sidebar overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-slate-800 bg-[#071426] text-slate-100 shadow-xl shadow-slate-950/30 transition-transform lg:static lg:w-64 lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5 lg:hidden">
          <span className="text-sm font-semibold text-white">PSA Inventory</span>
          <button type="button" onClick={onClose} aria-label="Close menu">
            <X className="h-4 w-4 text-slate-300" />
          </button>
        </div>

        <div className="hidden border-b border-slate-800 px-5 py-6 lg:block">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-blue-300/20 bg-brand-700 text-white shadow-lg shadow-brand-700/30">
              <Landmark className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">PSA Inventory</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-blue-200/70">Region XII</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-200/50">Main navigation</p>
          {visibleLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white',
                    isActive && 'bg-gradient-to-r from-brand-700 to-[#174b9d] font-semibold text-white shadow-lg shadow-blue-950/25',
                  )
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {link.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="m-3 rounded-xl border border-slate-800 bg-slate-900/35 p-3">
          <button
            type="button"
            onClick={() => { navigate('/settings'); onClose() }}
            className="flex w-full items-center gap-3 rounded-lg text-left"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              {displayName(user).slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white">{displayName(user)}</span>
              <span className="block truncate text-[10px] text-slate-400">Account settings</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-3 flex w-full items-center gap-2 border-t border-slate-800 pt-3 text-xs font-medium text-slate-300 transition-colors hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
