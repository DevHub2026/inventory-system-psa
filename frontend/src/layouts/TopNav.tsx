import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { displayName } from '@/types'
import { getUserRoleCategory } from '@/utils/roleHelpers'

interface TopNavProps {
  onMenuClick: () => void
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/assets':       'Assets',
  '/reservations': 'Borrow Requests',
  '/borrowings':   'Borrowed Items',
  '/inventory':    'Inventory',
  '/maintenance':  'Maintenance',
  '/reports':      'Reports',
  '/users':        'Users',
  '/roles':        'Roles & Permissions',
  '/permissions':  'Permissions',
  '/system-setup': 'System Setup',
  '/settings':     'Settings',
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth()
  const { pathname }     = useLocation()
  const navigate         = useNavigate()
  const [search, setSearch] = useState('')

  const role      = getUserRoleCategory(user)
  const roleLabel = role ? role[0].toUpperCase() + role.slice(1) : 'Account'
  const name      = displayName(user)
  const initials  = name.slice(0, 1).toUpperCase()

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = search.trim()
    if (q) navigate(`/assets?search=${encodeURIComponent(q)}`)
  }

  return (
    /*
     * Height: 60px — fixed, slim, consistent.
     * Sits at the top of the main column (never overlaps sidebar).
     * Light white surface, single bottom border, no heavy shadow.
     */
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-5">

      {/* ── Left: hamburger (mobile) + page title ── */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title — desktop vertical accent */}
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="hidden h-5 w-[2px] shrink-0 rounded-full bg-[#0B3D91] lg:block" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-semibold leading-tight text-slate-800">
              {PAGE_TITLES[pathname] ?? 'PSA Inventory'}
            </h2>
            <p className="hidden text-[11px] leading-tight text-slate-400 sm:block">
              PSA Region XII · Asset Management
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: search + notifications + user ── */}
      <div className="flex shrink-0 items-center gap-2">

        {/* Search — visible on md+ */}
        <form
          onSubmit={submitSearch}
          className="hidden md:flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-32 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400 lg:w-44"
            placeholder="Search assets…"
            aria-label="Search assets"
          />
        </form>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white"
            aria-label="Unread notifications"
          />
        </button>

        {/* Divider */}
        <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />

        {/* User info */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0B3D91] text-[11px] font-bold text-white">
            {initials}
          </span>
          <div className="hidden leading-tight lg:block">
            <p className="max-w-[120px] truncate text-[13px] font-semibold text-slate-700">{name}</p>
            <p className="text-[11px] text-slate-400">{roleLabel}</p>
          </div>
        </div>

        {/* Sign-out */}
        <button
          type="button"
          onClick={() => void logout()}
          title="Sign out"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
