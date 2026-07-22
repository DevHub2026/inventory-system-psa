import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarDays, ClipboardList, HandCoins } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Spinner, Table, Alert, type Column } from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import type { Reservation, Borrowing } from '@/types'
import { reservationStatusTone, borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel, reservationStatusLabel } from '@/utils/displayLabels'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'

export function EmployeeDashboard() {
  const navigate = useNavigate()
  const [myReservations, setMyReservations] = useState<Reservation[]>([])
  const [myBorrowings, setMyBorrowings] = useState<Borrowing[]>([])
  const [activeBorrowings, setActiveBorrowings] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [reservationsResult, borrowingsResult] = await Promise.all([
        reservationService.list(),
        borrowingService.list(),
      ])
      setMyReservations(reservationsResult.items)
      setMyBorrowings(borrowingsResult.items)
      setActiveBorrowings(
        borrowingsResult.items.filter((b) => b.status === 'BORROWED' || b.status === 'ACTIVE' || b.status === 'OVERDUE'),
      )
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load your data.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'borrowings') || affectsScope(scope, 'reservations')) {
      void loadData()
    }
  }), [])

  const handleReturnBorrowing = async (borrowingId: number) => {
    try {
      await borrowingService.returnAsset(borrowingId)
      setMessage({ type: 'success', text: 'Item returned successfully.' })
      notifyDataChanged('all')
      await loadData()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to return item.' })
    }
  }

  const reservationColumns: Column<Reservation>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'purpose', header: 'Purpose', render: (row) => row.purpose },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={reservationStatusTone(row.status)}>{reservationStatusLabel(row.status)}</Badge>,
    },
    { key: 'dates', header: 'Schedule', render: (row) => `${row.reserved_from} → ${row.reserved_until}` },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={borrowingStatusTone(row.status)}>{borrowingStatusLabel(row.status)}</Badge>,
    },
    { key: 'borrowed_at', header: 'Borrowed', render: (row) => row.borrowed_at },
    { key: 'due_at', header: 'Due', render: (row) => row.due_at },
  ]

  const activeColumns: Column<Borrowing>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={borrowingStatusTone(row.status)}>{borrowingStatusLabel(row.status)}</Badge>,
    },
    { key: 'due_at', header: 'Due', render: (row) => row.due_at },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button size="sm" variant="primary" onClick={() => handleReturnBorrowing(row.id)}>
          Return Item
        </Button>
      ),
    },
  ]

  const overdueItems = activeBorrowings.filter((borrowing) => borrowing.status === 'OVERDUE').length
  const dueSoonItems = activeBorrowings.filter((borrowing) => borrowing.status !== 'OVERDUE').length
  const statCards = [
    { label: 'My Borrow Requests', value: myReservations.length, description: 'Requests you submitted', icon: ClipboardList, tone: 'blue' as const },
    { label: 'My Borrowed Items', value: activeBorrowings.length, description: 'Items currently borrowed', icon: HandCoins, tone: 'green' as const },
    { label: 'Due Soon', value: dueSoonItems, description: 'Active items to monitor', icon: CalendarDays, tone: 'amber' as const },
    { label: 'Overdue', value: overdueItems, description: 'Items needing return', icon: AlertTriangle, tone: 'red' as const },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1>Employee Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back. Here is your asset activity overview.</p>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <DashboardStatCard key={card.label} {...card} />
        ))}
      </div>

      {activeBorrowings.length > 0 && (
        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Items Currently Borrowed</h2>
            <p className="text-sm text-gray-500">Return items when you're done using them</p>
          </div>
          {loading ? (
            <Spinner />
          ) : (
            <Table
              columns={activeColumns}
              rows={activeBorrowings}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No borrowed items" />}
            />
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">My Borrow Requests</h2>
            <p className="text-sm text-gray-500">Track requests you sent for asset borrowing.</p>
          </div>
          {loading ? (
            <Spinner />
          ) : myReservations.length === 0 ? (
            <EmptyState title="No borrow requests yet" description="Send a borrow request when you need an available asset." />
          ) : (
            <Table
              columns={reservationColumns}
              rows={myReservations}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No borrow requests yet" />}
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Borrowed Item History</h2>
            <p className="text-sm text-gray-500">View your past and current borrowed items.</p>
          </div>
          {loading ? (
            <Spinner />
          ) : myBorrowings.length === 0 ? (
            <EmptyState title="No borrowed items yet" description="Items you borrow will appear here." />
          ) : (
            <Table
              columns={borrowingColumns}
              rows={myBorrowings}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No borrowed items yet" />}
            />
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <h2 className="text-md font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-500">Common tasks for asset management</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Button onClick={() => navigate('/assets')}>Browse Available Assets</Button>
          <Button variant="secondary" onClick={() => navigate('/reservations')}>
            Send Borrow Request
          </Button>
          <Button variant="secondary" onClick={() => navigate('/borrowings')}>
            View My Borrowed Items
          </Button>
          <Button variant="secondary" onClick={() => navigate('/settings')}>
            My Profile Settings
          </Button>
        </div>
      </Card>
    </div>
  )
}
