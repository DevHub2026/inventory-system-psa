import { Bell, LogOut, Menu, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { displayName } from '@/types'
import { getUserRoleCategory } from '@/utils/roleHelpers'

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/assets': 'Assets',
    '/reservations': 'Borrow Requests',
    '/borrowings': 'Borrowed Items',
    '/inventory': 'Inventory',
    '/maintenance': 'Maintenance',
    '/reports': 'Reports',
    '/users': 'Users',
    '/roles': 'Roles & Permissions',
    '/permissions': 'Permissions',
    '/settings': 'Settings',
  }

  const role = getUserRoleCategory(user)
  const roleLabel = role ? `${role[0].toUpperCase()}${role.slice(1)}` : 'Account'
  const initials = displayName(user).slice(0, 1).toUpperCase()

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = search.trim()
    if (q) navigate(`/assets?search=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">

      {/* ── Left: hamburger + page title ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-[#003DA5] hover:bg-blue-50 transition-colors lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Vertical accent bar */}
        <span className="hidden h-7 w-[3px] rounded-full bg-[#003DA5] lg:block" aria-hidden="true" />

        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
            {titles[pathname] ?? 'PSA Inventory'}
          </p>
          <p className="hidden text-[10px] font-medium text-slate-400 sm:block leading-tight">
            PSA Region XII · Asset Management
          </p>
        </div>
      </div>

      {/* ── Right: search + notifications + user chip ── */}
      <div className="flex items-center gap-2">

        {/* Search bar */}
        <form
          onSubmit={submitSearch}
          className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 transition-colors focus-within:border-[#003DA5] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#003DA5]/10 md:flex"
        >
          <Search className="h-3.5 w-3.5 flex-none text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-36 border-0 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 lg:w-48"
            placeholder="Search assets…"
            aria-label="Search assets"
          />
          <kbd className="rounded border border-slate-200 bg-white px-1 py-px text-[9px] text-slate-400 leading-none">
            ↵
          </kbd>
        </form>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#E31C23] ring-2 ring-white" />
        </button>

        {/* User chip */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 sm:flex">
          <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-[#003DA5] text-[11px] font-extrabold text-white shadow-sm">
            {initials}
          </span>
          <span className="leading-tight">
            <span className="block max-w-[7.5rem] truncate text-xs font-semibold text-slate-800">
              {displayName(user)}
            </span>
            <span className="block text-[10px] font-medium text-slate-400">{roleLabel}</span>
          </span>
        </div>

        {/* Sign-out button */}
        <button
          type="button"
          onClick={() => void logout()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-[#E31C23]/40 hover:bg-red-50 hover:text-[#E31C23]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
