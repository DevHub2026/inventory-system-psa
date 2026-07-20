import { LogOut, Menu, UserRound } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { displayName } from '@/types'
import { Button } from '@/components/ui'
import { getUserRoleCategory } from '@/utils/roleHelpers'

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard', '/assets': 'Assets', '/reservations': 'Reservations', '/borrowings': 'Borrowings',
    '/inventory': 'Inventory', '/maintenance': 'Maintenance', '/reports': 'Reports', '/users': 'Users',
    '/roles': 'Roles & Permissions', '/permissions': 'Permissions', '/settings': 'Settings',
  }
  const role = getUserRoleCategory(user)
  const roleLabel = role ? `${role[0].toUpperCase()}${role.slice(1)}` : 'Account'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900">{titles[pathname] ?? 'PSA Inventory'}</p>
          <p className="hidden text-[11px] text-slate-500 sm:block">PSA Region XII · Asset Management</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 sm:flex">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-100 text-brand-700">
            <UserRound className="h-4 w-4" />
          </span>
          <span className="leading-tight">
            <span className="block max-w-32 truncate text-xs font-semibold text-slate-700">{displayName(user)}</span>
            <span className="block text-[10px] font-medium text-slate-400">{roleLabel}</span>
          </span>
        </div>

        <Button size="sm" variant="secondary" onClick={() => void logout()}>
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}
