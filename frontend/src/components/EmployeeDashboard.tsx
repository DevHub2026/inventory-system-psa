import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Spinner, Table, Alert, type Column } from '@/components/ui'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import type { Reservation, Borrowing } from '@/types'
import { reservationStatusTone, borrowingStatusTone } from '@/utils/statusTone'

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

  const handleReturnBorrowing = async (borrowingId: number) => {
    try {
      await borrowingService.returnAsset(borrowingId)
      setMessage({ type: 'success', text: 'Item returned successfully.' })
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
      render: (row) => <Badge tone={reservationStatusTone(row.status)}>{row.status}</Badge>,
    },
    { key: 'dates', header: 'Schedule', render: (row) => `${row.reserved_from} → ${row.reserved_until}` },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={borrowingStatusTone(row.status)}>{row.status}</Badge>,
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
      render: (row) => <Badge tone={borrowingStatusTone(row.status)}>{row.status}</Badge>,
    },
    { key: 'due_at', header: 'Due', render: (row) => row.due_at },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button size="sm" variant="primary" onClick={() => handleReturnBorrowing(row.id)}>
          Return
        </Button>
      ),
    },
  ]

  const statCards = [
    { label: 'My Reservations', value: myReservations.length, accent: 'blue', subtitle: 'Total requests' },
    { label: 'Active Items', value: activeBorrowings.length, accent: 'green', subtitle: 'Currently borrowed' },
    { label: 'Total Borrowed', value: myBorrowings.length, accent: 'yellow', subtitle: 'All time' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">My Dashboard</h1>
        <p className="text-sm text-gray-500">Manage your asset reservations and borrowings</p>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-400">{card.subtitle}</div>
          </Card>
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
              empty={<EmptyState title="No active borrowings" />}
            />
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">My Reservations</h2>
            <p className="text-sm text-gray-500">Track your asset reservation requests</p>
          </div>
          {loading ? (
            <Spinner />
          ) : myReservations.length === 0 ? (
            <EmptyState title="No reservations" description="You don't have any reservations yet." />
          ) : (
            <Table
              columns={reservationColumns}
              rows={myReservations}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No reservations" />}
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Borrowing History</h2>
            <p className="text-sm text-gray-500">View your past and current borrowings</p>
          </div>
          {loading ? (
            <Spinner />
          ) : myBorrowings.length === 0 ? (
            <EmptyState title="No borrowings" description="You haven't borrowed any items yet." />
          ) : (
            <Table
              columns={borrowingColumns}
              rows={myBorrowings}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No borrowings" />}
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
            Make New Reservation
          </Button>
          <Button variant="secondary" onClick={() => navigate('/borrowings')}>
            View All My Borrowings
          </Button>
          <Button variant="secondary" onClick={() => navigate('/settings')}>
            My Profile Settings
          </Button>
        </div>
      </Card>
    </div>
  )
}
