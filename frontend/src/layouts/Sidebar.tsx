import { NavLink } from 'react-router-dom'
import {
  Boxes,
  ClipboardList,
  FileBarChart,
  HandCoins,
  LayoutDashboard,
  Landmark,
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
  const { user } = useAuth()

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
          'fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-900/5 transition-transform lg:static lg:w-64 lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5 lg:hidden">
          <span className="text-sm font-semibold text-slate-800">Navigation</span>
          <button type="button" onClick={onClose} aria-label="Close menu">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="hidden border-b border-slate-100 px-5 py-6 lg:block">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-700 text-white shadow-lg shadow-brand-700/20">
              <Landmark className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">PSA Inventory</p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Region XII</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Workspace</p>
          {visibleLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    isActive && 'bg-brand-50 font-semibold text-brand-800 shadow-sm',
                  )
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                {link.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
