import { Card, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { displayName } from '@/types'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Temporary profile display. Profile updates: PUT /api/v1/profile.</p>
      </div>
      <Card title="Profile (read-only placeholder)">
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Name" value={displayName(user)} readOnly />
          <Input label="Email" value={user?.email ?? ''} readOnly />
        </div>
      </Card>
    </div>
  )
}
