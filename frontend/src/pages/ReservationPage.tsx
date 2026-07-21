import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, Spinner, Table, type Column } from '@/components/ui'
import { ReceiptModal, type ReceiptRecord } from '@/components/ReceiptModal'
import { assetService } from '@/services/assetService'
import { reservationService } from '@/services/reservationService'
import { useAuth } from '@/hooks/useAuth'
import type { Asset, Reservation } from '@/types'
import { reservationStatusTone } from '@/utils/statusTone'
import { isAdmin, isStaff } from '@/utils/roleHelpers'
import { reservationStatusLabel } from '@/utils/displayLabels'

export function ReservationPage() {
  const { user } = useAuth()
  const canApproveReservations = isAdmin(user) || isStaff(user)
  const [rows, setRows] = useState<Reservation[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    assetIds: [] as number[],
    startDate: '',
    endDate: '',
    remarks: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null)

  const loadReservations = async () => {
    setLoading(true)
    try {
      const result = await reservationService.list()
      setRows(result.items)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load borrow requests.' })
    } finally {
      setLoading(false)
    }
  }

  const openCreate = async () => {
    setCreateOpen(true)
    setMessage(null)
    try {
      const result = await assetService.list({ status: 'AVAILABLE', per_page: 100 })
      setAssets(result.items)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load available assets.' })
    }
  }

  const handleCreate = async () => {
    if (!form.assetIds.length || !form.startDate || !form.endDate) {
      setMessage({ type: 'error', text: 'Select at least one asset and provide the borrowing dates.' })
      return
    }

    setSaving(true)
    try {
      const reservation = await reservationService.create({
        asset_ids: form.assetIds,
        start_date: form.startDate,
        end_date: form.endDate,
        remarks: form.remarks || undefined,
      })
      setReceipt({
        type: 'Reservation',
        code: reservation.receipt_code ?? `PSA-RES-${reservation.id}`,
        payload: reservation.receipt_payload ?? `PSA-RES-${reservation.id}|${reservation.asset_numbers?.join(',') ?? reservation.asset_ids?.join(',')}|${reservation.user_id}`,
        employee: reservation.employee_name,
        assetName: reservation.asset_names?.join(', '),
        assetNumber: reservation.asset_numbers?.join(', '),
        timestamp: reservation.created_at,
        startDate: reservation.start_date,
        endDate: reservation.end_date,
        status: reservation.status,
        authorizedBy: reservation.authorized_by_name,
        authorizedAt: reservation.authorized_at,
        remarks: reservation.remarks,
      })
      setCreateOpen(false)
      setForm({ assetIds: [], startDate: '', endDate: '', remarks: '' })
      setMessage({ type: 'success', text: 'Borrow request sent successfully.' })
      await loadReservations()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to send borrow request.' })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    void loadReservations()
  }, [])

  const handleApprove = async (reservationId: number) => {
    try {
      const reservation = await reservationService.approve(reservationId)
      setReceipt({
        type: 'Reservation',
        code: reservation.receipt_code ?? `PSA-RES-${reservation.id}`,
        payload: reservation.receipt_payload ?? `PSA-RES-${reservation.id}|${reservation.asset_numbers?.join(',') ?? reservation.asset_ids?.join(',')}|${reservation.user_id}`,
        employee: reservation.employee_name,
        assetName: reservation.asset_names?.join(', '),
        assetNumber: reservation.asset_numbers?.join(', '),
        timestamp: reservation.created_at,
        startDate: reservation.start_date,
        endDate: reservation.end_date,
        status: reservation.status,
        authorizedBy: reservation.authorized_by_name,
        authorizedAt: reservation.authorized_at,
        remarks: reservation.remarks,
      })
      setMessage({ type: 'success', text: 'Borrow request approved successfully.' })
      await loadReservations()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to approve borrow request.' })
    }
  }

  const columns: Column<Reservation>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'employee_name', header: 'Employee', render: (row) => row.employee_name },
    { key: 'purpose', header: 'Purpose', render: (row) => row.purpose },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={reservationStatusTone(row.status)}>{reservationStatusLabel(row.status)}</Badge>,
    },
    {
      key: 'dates',
      header: 'Schedule',
      render: (row) => `${row.reserved_from} → ${row.reserved_until}`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setReceipt({
                type: 'Reservation',
                code: row.receipt_code ?? `PSA-RES-${row.id}`,
                payload: row.receipt_payload ?? `PSA-RES-${row.id}|${row.asset_numbers?.join(',') ?? row.asset_ids?.join(',')}|${row.user_id}`,
                employee: row.employee_name,
                assetName: row.asset_names?.join(', '),
                assetNumber: row.asset_numbers?.join(', '),
                timestamp: row.created_at,
                startDate: row.start_date,
                endDate: row.end_date,
                status: row.status,
                authorizedBy: row.authorized_by_name,
                authorizedAt: row.authorized_at,
                remarks: row.remarks,
              })
            }
          >
            Receipt
          </Button>
          {canApproveReservations && row.status === 'PENDING' && (
            <Button size="sm" variant="success" onClick={() => handleApprove(row.id)}>
              Approve Request
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Borrow Requests</h1>
          <p className="text-sm text-gray-500">Send and manage requests to borrow assets.</p>
        </div>
        <Button onClick={openCreate}>New Borrow Request</Button>
      </div>
      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}
      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No borrow requests found" description="Create a borrow request when you need an available asset." />}
          />
        )}
      </Card>

      <Modal
        open={createOpen}
        title="New Borrow Request"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Saving...' : 'Send Borrow Request'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="reservation-assets" className="mb-1 block text-sm font-medium text-gray-700">
              Available Assets
            </label>
            <select
              id="reservation-assets"
              multiple
              value={form.assetIds.map(String)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  assetIds: Array.from(event.target.selectedOptions, (option) => Number(option.value)),
                }))
              }
              className="h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_number} - {asset.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Hold Ctrl or Shift to select multiple assets for the same request.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
            />
          </div>
          <Input
            label="Remarks"
            value={form.remarks}
            onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
            placeholder="Purpose or notes for this borrow request"
          />
        </div>
      </Modal>
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  )
}
