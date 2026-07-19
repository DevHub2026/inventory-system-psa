import { Menu, UserRound } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { displayName } from '@/types'
import { Button } from '@/components/ui'

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-brand-800">PSA Inventory System</p>
          <p className="text-[11px] text-gray-500">Temporary frontend prototype</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border border-gray-200 px-2 py-1 sm:flex">
          <UserRound className="h-4 w-4 text-gray-500" />
          <span className="text-xs text-gray-700">{displayName(user)}</span>
        </div>

        <Button size="sm" variant="secondary" onClick={() => void logout()}>
          Logout
        </Button>
      </div>
    </header>
  )
}
