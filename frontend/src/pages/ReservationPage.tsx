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
import { PageHeader } from '@/components/PageHeader'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'

export function ReservationPage() {
  const { user } = useAuth()
  const canApprove = isAdmin(user) || isStaff(user)
  const [rows,        setRows]       = useState<Reservation[]>([])
  const [assets,      setAssets]     = useState<Asset[]>([])
  const [loading,     setLoading]    = useState(true)
  const [saving,      setSaving]     = useState(false)
  const [createOpen,  setCreateOpen] = useState(false)
  const [form, setForm] = useState({ assetIds: [] as number[], startDate: '', endDate: '', remarks: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null)

  const loadReservations = async () => {
    setLoading(true)
    try {
      const result = await reservationService.list()
      setRows(result.items)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load borrow requests.' })
    } finally { setLoading(false) }
  }

  const openCreate = async () => {
    setCreateOpen(true); setMessage(null)
    try {
      const result = await assetService.list({ status: 'AVAILABLE', per_page: 100 })
      setAssets(result.items)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load available assets.' })
    }
  }

  const handleCreate = async () => {
    if (!form.assetIds.length || !form.startDate || !form.endDate) {
      setMessage({ type: 'error', text: 'Select at least one asset and provide the borrowing dates.' }); return
    }
    if (form.endDate < form.startDate) {
      setMessage({ type: 'error', text: 'End date cannot be before start date.' }); return
    }
    setSaving(true)
    try {
      const res = await reservationService.create({ asset_ids: form.assetIds, start_date: form.startDate, end_date: form.endDate, remarks: form.remarks || undefined })
      setReceipt({ type: 'Reservation', code: res.receipt_code ?? `PSA-RES-${res.id}`, payload: res.receipt_payload ?? `PSA-RES-${res.id}|${res.asset_numbers?.join(',') ?? res.asset_ids?.join(',')}|${res.user_id}`, employee: res.employee_name, assetName: res.asset_names?.join(', '), assetNumber: res.asset_numbers?.join(', '), timestamp: res.created_at, startDate: res.start_date, endDate: res.end_date, status: res.status, authorizedBy: res.authorized_by_name, authorizedAt: res.authorized_at, remarks: res.remarks })
      setCreateOpen(false)
      setForm({ assetIds: [], startDate: '', endDate: '', remarks: '' })
      setMessage({ type: 'success', text: 'Borrow request sent successfully.' })
      notifyDataChanged('all')
      await loadReservations()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to send borrow request.' })
    } finally { setSaving(false) }
  }

  useEffect(() => { void loadReservations() }, [])

  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'reservations') || affectsScope(scope, 'borrowings')) {
      void loadReservations()
    }
  }), [])

  const handleApprove = async (id: number) => {
    try {
      const res = await reservationService.approve(id)
      setReceipt({ type: 'Reservation', code: res.receipt_code ?? `PSA-RES-${res.id}`, payload: res.receipt_payload ?? `PSA-RES-${res.id}|${res.asset_numbers?.join(',') ?? res.asset_ids?.join(',')}|${res.user_id}`, employee: res.employee_name, assetName: res.asset_names?.join(', '), assetNumber: res.asset_numbers?.join(', '), timestamp: res.created_at, startDate: res.start_date, endDate: res.end_date, status: res.status, authorizedBy: res.authorized_by_name, authorizedAt: res.authorized_at, remarks: res.remarks })
      setMessage({ type: 'success', text: 'Borrow request approved successfully.' })
      notifyDataChanged('all')
      await loadReservations()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to approve borrow request.' })
    }
  }

  const handleReject = async (id: number) => {
    try {
      await reservationService.reject(id)
      setMessage({ type: 'success', text: 'Borrow request rejected.' })
      notifyDataChanged('all')
      await loadReservations()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to reject borrow request.' })
    }
  }

  const handleCancel = async (id: number) => {
    try {
      await reservationService.cancel(id)
      setMessage({ type: 'success', text: 'Borrow request cancelled.' })
      notifyDataChanged('all')
      await loadReservations()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to cancel borrow request.' })
    }
  }

  const columns: Column<Reservation>[] = [
    { key: 'id',            header: '#',         render: (r) => <span className="font-mono text-xs text-[#9CA3AF]">#{r.id}</span> },
    { key: 'employee_name', header: 'Employee',  render: (r) => <span className="font-medium text-[#1F2937]">{r.employee_name}</span> },
    { key: 'purpose',       header: 'Purpose',   render: (r) => r.purpose },
    { key: 'status',        header: 'Status',    render: (r) => <Badge tone={reservationStatusTone(r.status)}>{reservationStatusLabel(r.status)}</Badge> },
    { key: 'dates',         header: 'Schedule',  render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.reserved_from} → {r.reserved_until}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setReceipt({ type: 'Reservation', code: r.receipt_code ?? `PSA-RES-${r.id}`, payload: r.receipt_payload ?? `PSA-RES-${r.id}|${r.asset_numbers?.join(',') ?? r.asset_ids?.join(',')}|${r.user_id}`, employee: r.employee_name, assetName: r.asset_names?.join(', '), assetNumber: r.asset_numbers?.join(', '), timestamp: r.created_at, startDate: r.start_date, endDate: r.end_date, status: r.status, authorizedBy: r.authorized_by_name, authorizedAt: r.authorized_at, remarks: r.remarks })}>
            Receipt
          </Button>
          {canApprove && r.status === 'PENDING' && (
            <>
              <Button size="sm" variant="success" onClick={() => handleApprove(r.id)}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => handleReject(r.id)}>Reject</Button>
            </>
          )}
          {!canApprove && r.status === 'PENDING' && (
            <Button size="sm" variant="ghost" onClick={() => handleCancel(r.id)}>Cancel</Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrow Requests"
        subtitle="Send and manage requests to borrow assets."
        actions={<Button onClick={openCreate}>New Borrow Request</Button>}
      />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : (
          <Table
            columns={columns} rows={rows} rowKey={(r) => r.id}
            empty={<div className="py-16"><EmptyState title="No borrow requests found" description="Create a borrow request when you need an available asset." /></div>}
          />
        )}
      </Card>

      {/* ── New Borrow Request modal ── */}
      <Modal
        open={createOpen} title="New Borrow Request" onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Send Borrow Request'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="reservation-assets" className="mb-1.5 block text-[13px] font-medium text-[#1F2937]">Available Assets</label>
            <select
              id="reservation-assets" multiple
              value={form.assetIds.map(String)}
              onChange={(e) => setForm((c) => ({ ...c, assetIds: Array.from(e.target.selectedOptions, (o) => Number(o.value)) }))}
              className="h-32 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#1F2937] focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15"
            >
              {assets.map((a) => <option key={a.id} value={a.id}>{a.asset_number} — {a.name}</option>)}
            </select>
            <p className="mt-1.5 text-[13px] text-[#6B7280]">Hold Ctrl or Shift to select multiple assets.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm((c) => ({ ...c, startDate: e.target.value }))} />
            <Input label="End Date"   type="date" value={form.endDate}   onChange={(e) => setForm((c) => ({ ...c, endDate:   e.target.value }))} />
          </div>
          <Input label="Remarks" value={form.remarks} onChange={(e) => setForm((c) => ({ ...c, remarks: e.target.value }))} placeholder="Purpose or notes for this borrow request" />
        </div>
      </Modal>

      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  )
}
