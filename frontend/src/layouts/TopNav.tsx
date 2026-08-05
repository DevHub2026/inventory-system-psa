import { Menu, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { NotificationBell } from '@/components/NotificationBell'

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
  const { pathname }     = useLocation()
  const navigate         = useNavigate()
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

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
      padding: '0 24px',
      boxSizing: 'border-box',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>

      {/* ── Left: hamburger + page title ── */}
      <div style={{ display: 'flex', minWidth: 0, alignItems: 'center', gap: 14 }}>

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
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <Menu size={20} />
        </button>

        {/* Page title */}
        <div style={{ display: 'flex', minWidth: 0, alignItems: 'center', gap: 12 }}>
          {/* PSA blue accent bar — desktop only */}
          <span
            className="hidden lg:block"
            style={{ width: 3, height: 22, flexShrink: 0, borderRadius: 99, background: '#0B3D91' }}
            aria-hidden="true"
          />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 700, color: '#0F172A',
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

      {/* ── Right: search + bell ── */}
      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 10 }}>

        {/* Search bar — md+ */}
        <form
          onSubmit={submitSearch}
          className="hidden md:flex"
          style={{
            height: 36,
            alignItems: 'center',
            gap: 6,
            borderRadius: 8,
            border: searchFocused ? '1.5px solid #0B3D91' : '1.5px solid #e2e8f0',
            background: searchFocused ? '#ffffff' : '#f8fafc',
            padding: '0 10px',
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
              width: 180,
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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34,
          borderRadius: 8,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          transition: 'background 0.15s',
        }}>
          <NotificationBell />
        </div>

      </div>
    </header>
  )
}