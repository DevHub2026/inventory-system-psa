import { Bell, LogOut, Menu, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { displayName } from '@/types'
import { getUserRoleCategory } from '@/utils/roleHelpers'

interface TopNavProps {
  onMenuClick: () => void
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/assets':      'Assets',
  '/reservations':'Borrow Requests',
  '/borrowings':  'Borrowed Items',
  '/inventory':   'Inventory',
  '/maintenance': 'Maintenance',
  '/reports':     'Reports',
  '/users':       'Users',
  '/roles':       'Roles & Permissions',
  '/permissions': 'Permissions',
  '/system-setup':'System Setup',
  '/settings':    'Settings',
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const role      = getUserRoleCategory(user)
  const roleLabel = role ? role[0].toUpperCase() + role.slice(1) : 'Account'
  const initials  = displayName(user).slice(0, 1).toUpperCase()
  const pageTitle = PAGE_TITLES[pathname] ?? 'PSA Inventory'

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = search.trim()
    if (q) navigate(`/assets?search=${encodeURIComponent(q)}`)
  }

  return (
    /* h-16 = 64px, sticky, white, border-bottom */
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white px-4 shadow-[0_1px_4px_rgba(0,0,0,.06)] sm:px-6">

      {/* ── Left: hamburger + page title ── */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="shrink-0 rounded-[10px] p-2 text-[#0D47A1] transition-colors duration-200 hover:bg-[#EEF4FF] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Vertical PSA accent bar — desktop only */}
        <span
          className="hidden h-7 w-[3px] shrink-0 rounded-full bg-[#0D47A1] lg:block"
          aria-hidden="true"
        />

        {/* Page title block */}
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold tracking-tight text-[#1F2937] leading-tight">
            {pageTitle}
          </p>
          <p className="hidden text-[11px] font-medium leading-tight text-[#9CA3AF] sm:block">
            PSA Region XII · Asset Management
          </p>
        </div>
      </div>

      {/* ── Right: search + bell + user chip + sign-out ── */}
      <div className="flex shrink-0 items-center gap-2">

        {/* Search bar — hidden on small screens, h-[42px] radius-[12px] */}
        <form
          onSubmit={submitSearch}
          className={[
            'hidden md:flex items-center gap-2',
            'h-[42px] rounded-[12px]',
            'border border-[#E5E7EB] bg-[#F9FAFB] px-3',
            'transition-all duration-200',
            'focus-within:border-[#0D47A1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0D47A1]/15',
          ].join(' ')}
        >
          <Search className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-36 border-0 bg-transparent text-[13px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] lg:w-48"
            placeholder="Search assets…"
            aria-label="Search assets"
          />
          <kbd className="hidden rounded border border-[#E5E7EB] bg-white px-1 py-px text-[10px] text-[#9CA3AF] leading-none lg:inline">
            ↵
          </kbd>
        </form>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative h-10 w-10 rounded-[10px] text-[#6B7280] transition-colors duration-200 hover:bg-[#F3F4F6] hover:text-[#1F2937] flex items-center justify-center"
        >
          <Bell className="h-4 w-4" />
          {/* Unread dot */}
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E31C23] ring-2 ring-white"
            aria-label="Unread notifications"
          />
        </button>

        {/* User chip — hidden on xs */}
        <div className="hidden items-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1.5 sm:flex">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#0D47A1] text-[11px] font-extrabold text-white shadow-sm">
            {initials}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block max-w-[7.5rem] truncate text-[13px] font-semibold text-[#1F2937]">
              {displayName(user)}
            </span>
            <span className="block text-[11px] font-medium text-[#9CA3AF]">{roleLabel}</span>
          </span>
        </div>

        {/* Sign-out button */}
        <button
          type="button"
          onClick={() => void logout()}
          className={[
            'flex h-10 items-center gap-1.5 rounded-[10px]',
            'border border-[#E5E7EB] bg-white px-3',
            'text-[13px] font-semibold text-[#6B7280]',
            'shadow-[0_1px_2px_rgba(0,0,0,.05)]',
            'transition-all duration-200',
            'hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#D32F2F]',
          ].join(' ')}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
