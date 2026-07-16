import { useEffect, useState } from 'react'
import { Badge, Button, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { dashboardService } from '@/services/dashboardService'
import { useAuth } from '@/hooks/useAuth'
import type { ActivityItem, DashboardStats } from '@/types'

export function DashboardPage() {
  const { logout } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void Promise.all([dashboardService.getStats(), dashboardService.getRecentActivity()])
      .then(([nextStats, nextActivity]) => {
        setStats(nextStats)
        setActivity(nextActivity)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <Spinner />
  }

  const cards = [
    { label: 'Total Assets', value: stats?.total_assets ?? 0 },
    { label: 'Available', value: stats?.available ?? 0 },
    { label: 'Borrowed', value: stats?.borrowed ?? 0 },
    { label: 'Reserved', value: stats?.reserved ?? 0 },
    { label: 'Under Maintenance', value: stats?.maintenance ?? 0 },
  ]

  const columns: Column<ActivityItem>[] = [
    { key: 'action', header: 'Action', render: (row) => row.action },
    { key: 'user', header: 'User', render: (row) => row.user },
    {
      key: 'module',
      header: 'Module',
      render: (row) => <Badge tone="blue">{row.module}</Badge>,
    },
    { key: 'created_at', header: 'When', render: (row) => row.created_at },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Temporary overview for backend integration.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => void logout()}>
          Logout
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
          </Card>
        ))}
      </div>

      <Card title="Recent activity">
        <Table
          columns={columns}
          rows={activity}
          rowKey={(row) => row.id}
          empty={<EmptyState title="No recent activity" />}
        />
      </Card>
    </div>
  )
}
