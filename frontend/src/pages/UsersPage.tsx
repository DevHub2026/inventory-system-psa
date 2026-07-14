import { Card, EmptyState } from '@/components/ui'

export function UsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">Owned by Eman — wire to GET /api/v1/users when integrating RBAC UI.</p>
      </div>
      <Card>
        <EmptyState
          title="Users module placeholder"
          description="Auth/Users API exists. This page is intentionally minimal for the temporary prototype."
        />
      </Card>
    </div>
  )
}
