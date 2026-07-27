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
  const [searchFocused, setSearchFocused] = useState(false)
  const [signOutHover, setSignOutHover] = useState(false)

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
    <header style={{
      display: 'flex',
      height: 64,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderBottom: '1px solid #e2e8f0',
      background: '#ffffff',
      padding: '0 20px',
      boxSizing: 'border-box',
    }}>

      {/* ── Left: hamburger + page title ── */}
      <div style={{ display: 'flex', minWidth: 0, alignItems: 'center', gap: 12 }}>

        {/* Hamburger — hidden on desktop via media query class */}
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="md:hidden"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, flexShrink: 0,
            borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', color: '#64748b',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <Menu size={20} />
        </button>

        {/* Page title */}
        <div style={{ display: 'flex', minWidth: 0, alignItems: 'center', gap: 10 }}>
          {/* PSA blue accent bar — desktop only */}
          <span
            className="hidden lg:block"
            style={{ width: 3, height: 20, flexShrink: 0, borderRadius: 99, background: '#0B3D91' }}
            aria-hidden="true"
          />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: '#1e293b',
              lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {PAGE_TITLES[pathname] ?? 'PSA Inventory'}
            </div>
            <div
              className="hidden sm:block"
              style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.25, marginTop: 1 }}
            >
              PSA Region XII · Asset Management
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: search + bell + user + sign-out ── */}
      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8 }}>

        {/* Search bar — md+ */}
        <form
          onSubmit={submitSearch}
          className="hidden md:flex"
          style={{
            height: 36,
            alignItems: 'center',
            gap: 6,
            borderRadius: 10,
            border: searchFocused ? '1.5px solid #0B3D91' : '1.5px solid #e2e8f0',
            background: searchFocused ? '#ffffff' : '#f8fafc',
            padding: '0 12px',
            transition: 'border-color 0.15s, background 0.15s',
            boxShadow: searchFocused ? '0 0 0 3px rgba(11,61,145,0.10)' : 'none',
            boxSizing: 'border-box',
          }}
        >
          <Search size={14} style={{ flexShrink: 0, color: '#94a3b8' }} aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: 140,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: '#1e293b',
              fontFamily: 'inherit',
            }}
            placeholder="Search assets…"
            aria-label="Search assets"
          />
        </form>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          style={{
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: 8,
            border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <Bell size={17} />
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 7, height: 7, borderRadius: '50%',
            background: '#ef4444',
            border: '2px solid #ffffff',
          }} aria-label="Unread notifications" />
        </button>

        {/* Divider */}
        <span
          className="hidden sm:block"
          style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0 }}
          aria-hidden="true"
        />

        {/* User avatar + name */}
        <div
          className="hidden sm:flex"
          style={{ alignItems: 'center', gap: 8 }}
        >
          {/* Avatar */}
          <span style={{
            display: 'grid', width: 30, height: 30, flexShrink: 0,
            placeItems: 'center', borderRadius: '50%',
            background: '#0B3D91',
            fontSize: 11, fontWeight: 700, color: '#ffffff',
            letterSpacing: '0.02em',
          }}>
            {initials}
          </span>
          {/* Name + role — lg+ */}
          <div className="hidden lg:block" style={{ lineHeight: 1.25 }}>
            <div style={{
              maxWidth: 130, fontSize: 13, fontWeight: 600, color: '#1e293b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {name}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
              {roleLabel}
            </div>
          </div>
        </div>

        {/* Sign out button */}
        <button
          type="button"
          onClick={() => void logout()}
          title="Sign out"
          onMouseEnter={() => setSignOutHover(true)}
          onMouseLeave={() => setSignOutHover(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 34,
            paddingInline: 12,
            borderRadius: 8,
            border: signOutHover ? '1px solid #fecaca' : '1px solid #e2e8f0',
            background: signOutHover ? '#fef2f2' : '#ffffff',
            color: signOutHover ? '#dc2626' : '#64748b',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            boxSizing: 'border-box',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <LogOut size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span className="hidden sm:inline">Sign out</span>
        </button>

      </div>
    </header>
  )
}
