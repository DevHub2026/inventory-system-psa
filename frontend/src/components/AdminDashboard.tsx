import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Spinner, Table, Alert, type Column } from '@/components/ui'
import { dashboardService } from '@/services/dashboardService'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import { maintenanceService } from '@/services/maintenanceService'
import type { DashboardStats, ActivityItem, Reservation, Borrowing, MaintenanceRequest } from '@/types'
import { maintenanceStatusTone } from '@/utils/statusTone'

export function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([])
  const [overdueBorrowings, setOverdueBorrowings] = useState<Borrowing[]>([])
  const [pendingMaintenance, setPendingMaintenance] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsResult, activityResult, reservationsResult, borrowingsResult, maintenanceResult] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(),
        reservationService.list(),
        borrowingService.list(),
        maintenanceService.list(),
      ])
      setStats(statsResult)
      setRecentActivity(activityResult)
      setPendingReservations(reservationsResult.items.filter((r) => r.status === 'PENDING'))
      setOverdueBorrowings(borrowingsResult.items.filter((b) => b.status === 'OVERDUE'))
      setPendingMaintenance(maintenanceResult.items.filter((m) => m.status === 'scheduled'))
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load dashboard data.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleApproveReservation = async (reservationId: number) => {
    try {
      await reservationService.approve(reservationId)
      setMessage({ type: 'success', text: 'Reservation approved successfully.' })
      await loadData()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to approve reservation.' })
    }
  }

  const activityColumns: Column<ActivityItem>[] = [
    { key: 'action', header: 'Action', render: (row) => row.action },
    { key: 'user', header: 'User', render: (row) => row.user },
    { key: 'module', header: 'Module', render: (row) => row.module },
    { key: 'created_at', header: 'Time', render: (row) => new Date(row.created_at).toLocaleString() },
  ]

  const reservationColumns: Column<Reservation>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'employee_name', header: 'Employee', render: (row) => row.employee_name },
    { key: 'purpose', header: 'Purpose', render: (row) => row.purpose },
    { key: 'dates', header: 'Schedule', render: (row) => `${row.reserved_from} → ${row.reserved_until}` },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button size="sm" variant="success" onClick={() => handleApproveReservation(row.id)}>
          Approve
        </Button>
      ),
    },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'employee_name', header: 'Employee', render: (row) => row.employee_name },
    { key: 'due_at', header: 'Due', render: (row) => row.due_at },
  ]

  const maintenanceColumns: Column<MaintenanceRequest>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'description', header: 'Description', render: (row) => row.description },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={maintenanceStatusTone(row.status)}>{row.status}</Badge>,
    },
    { key: 'scheduled_at', header: 'Scheduled', render: (row) => row.scheduled_at },
  ]

  const statCards = [
    { label: 'Total Assets', value: stats?.total_assets || 0, accent: 'blue', subtitle: 'All registered assets' },
    { label: 'Available', value: stats?.available || 0, accent: 'green', subtitle: 'Ready for use' },
    { label: 'Borrowed', value: stats?.borrowed || 0, accent: 'blue', subtitle: 'Currently in use' },
    { label: 'Reserved', value: stats?.reserved || 0, accent: 'yellow', subtitle: 'Pending collection' },
    { label: 'Maintenance', value: stats?.maintenance || 0, accent: 'orange', subtitle: 'Requires attention' },
    { label: 'Pending Approvals', value: pendingReservations.length, accent: 'red', subtitle: 'Awaiting action' },
    { label: 'Overdue Items', value: overdueBorrowings.length, accent: 'red', subtitle: 'Past due date' },
    { label: 'Pending Maintenance', value: pendingMaintenance.length, accent: 'orange', subtitle: 'Scheduled repairs' },
  ]

  const utilizationRate = stats?.total_assets ? Math.round(((stats?.borrowed || 0) / stats.total_assets) * 100) : 0
  const healthStatus = overdueBorrowings.length === 0 && pendingReservations.length < 5 ? 'Healthy' : 'Attention Needed'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Full system overview and management controls</p>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-400">{card.subtitle}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Asset Utilization Rate</div>
          <div className="text-3xl font-semibold text-gray-900">{utilizationRate}%</div>
          <div className="text-xs text-gray-400">Percentage of assets currently borrowed</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">System Health</div>
          <div className="text-3xl font-semibold text-gray-900">{healthStatus}</div>
          <div className="text-xs text-gray-400">Based on overdue items and pending approvals</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-500">Latest system actions across all modules</p>
          </div>
          {loading ? (
            <Spinner />
          ) : recentActivity.length === 0 ? (
            <EmptyState title="No recent activity" description="System activity will appear here." />
          ) : (
            <Table
              columns={activityColumns}
              rows={recentActivity}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No recent activity" />}
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Pending Reservations</h2>
            <p className="text-sm text-gray-500">Awaiting admin approval</p>
          </div>
          {loading ? (
            <Spinner />
          ) : pendingReservations.length === 0 ? (
            <EmptyState title="No pending reservations" description="All reservations processed." />
          ) : (
            <Table
              columns={reservationColumns}
              rows={pendingReservations}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No pending reservations" />}
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Overdue Borrowings</h2>
            <p className="text-sm text-gray-500">Items past due date requiring attention</p>
          </div>
          {loading ? (
            <Spinner />
          ) : overdueBorrowings.length === 0 ? (
            <EmptyState title="No overdue items" description="All items returned on time." />
          ) : (
            <Table
              columns={borrowingColumns}
              rows={overdueBorrowings}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No overdue items" />}
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Pending Maintenance</h2>
            <p className="text-sm text-gray-500">Scheduled maintenance requests</p>
          </div>
          {loading ? (
            <Spinner />
          ) : pendingMaintenance.length === 0 ? (
            <EmptyState title="No pending maintenance" description="All maintenance completed." />
          ) : (
            <Table
              columns={maintenanceColumns}
              rows={pendingMaintenance}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No pending maintenance" />}
            />
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <h2 className="text-md font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-500">Access all system management modules</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <Button onClick={() => navigate('/assets')}>Manage Assets</Button>
          <Button variant="secondary" onClick={() => navigate('/reservations')}>
            Reservations
          </Button>
          <Button variant="secondary" onClick={() => navigate('/borrowings')}>
            Borrowings
          </Button>
          <Button variant="secondary" onClick={() => navigate('/inventory')}>
            Inventory
          </Button>
          <Button variant="secondary" onClick={() => navigate('/maintenance')}>
            Maintenance
          </Button>
          <Button variant="secondary" onClick={() => navigate('/reports')}>
            Reports
          </Button>
          <Button variant="secondary" onClick={() => navigate('/users')}>
            User Management
          </Button>
          <Button variant="secondary" onClick={() => navigate('/roles')}>
            Role Management
          </Button>
          <Button variant="secondary" onClick={() => navigate('/settings')}>
            System Settings
          </Button>
        </div>
      </Card>
    </div>
  )
}
