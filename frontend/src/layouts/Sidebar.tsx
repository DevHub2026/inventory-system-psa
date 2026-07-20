import { NavLink } from 'react-router-dom'
import {
  Boxes,
  ClipboardList,
  FileBarChart,
  HandCoins,
  LayoutDashboard,
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
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4 lg:hidden">
          <span className="text-sm font-semibold text-gray-800">Menu</span>
          <button type="button" onClick={onClose} aria-label="Close menu">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100',
                    isActive && 'bg-brand-50 font-medium text-brand-800',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
