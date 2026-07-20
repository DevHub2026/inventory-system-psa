import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Input,
  Modal,
  Pagination,
  SearchBar,
  Spinner,
  Table,
  type Column,
} from '@/components/ui'
import { assetService, type UpdateAssetPayload } from '@/services/assetService'
import { reservationService } from '@/services/reservationService'
import { useAuth } from '@/hooks/useAuth'
import { ReceiptModal, type ReceiptRecord } from '@/components/ReceiptModal'
import { AssetQrScanner } from '@/components/AssetQrScanner'
import { QrCode } from '@/components/QrCode'
import type { Asset, AssetStatus } from '@/types'
import { assetStatusTone } from '@/utils/statusTone'
import { isAdmin } from '@/utils/roleHelpers'

export function AssetPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const canManageAssets = isAdmin(user)
  const [rows, setRows] = useState<Asset[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [borrowId, setBorrowId] = useState<number | null>(null)
  const [reserveId, setReserveId] = useState<number | null>(null)
  const [returnId, setReturnId] = useState<number | null>(null)
  const [returnNotes, setReturnNotes] = useState('')
  const [borrowNotes, setBorrowNotes] = useState('')
  const [borrowDueDays, setBorrowDueDays] = useState<number | undefined>(undefined)
  const [reserveStartDate, setReserveStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [reserveEndDate, setReserveEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [reserveRemarks, setReserveRemarks] = useState('')
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null)
  const [viewAsset, setViewAsset] = useState<Asset | null>(null)
  const [qrAsset, setQrAsset] = useState<Asset | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<UpdateAssetPayload>({
    name: '',
    description: '',
    model: '',
    status: 'AVAILABLE',
    condition_status: '',
    remarks: '',
  })

  async function load(nextPage = page, nextSearch = search) {
    setLoading(true)
    try {
      const result = await assetService.list({
        page: nextPage,
        search: nextSearch || undefined,
        status: status || undefined,
      })
      setRows(result.items)
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
      setTotal(result.meta.total)
    } finally {
      setLoading(false)
    }
  }

  async function openView(assetId: number) {
    setMessage(null)
    try {
      setViewAsset(await assetService.show(assetId))
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Unable to load asset details.')
    }
  }

  async function openEdit(assetId: number) {
    if (!canManageAssets) {
      setMessage('Only administrators can edit asset records.')
      return
    }

    setMessage(null)
    try {
      const asset = await assetService.show(assetId)
      setEditAsset(asset)
      setEditForm({
        name: asset.name,
        description: asset.description ?? '',
        model: asset.model ?? '',
        status: asset.status,
        condition_status: asset.condition_status ?? '',
        remarks: asset.remarks ?? '',
      })
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Unable to load asset for editing.')
    }
  }

  async function openQrLabel(assetId: number) {
    setMessage(null)
    try {
      setQrAsset(await assetService.show(assetId))
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Unable to load PSA QR label.')
    }
  }

  async function submitEdit() {
    if (!editAsset) return

    setSaving(true)
    setMessage(null)
    try {
      await assetService.update(editAsset.id, {
        ...editForm,
        description: editForm.description || null,
        model: editForm.model || null,
        condition_status: editForm.condition_status || null,
        remarks: editForm.remarks || null,
      })
      setEditAsset(null)
      setMessage('Asset updated successfully.')
      await load(page)
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Unable to update asset.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    void load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    const nextSearch = searchParams.get('search') ?? ''
    setSearch(nextSearch)
    void load(1, nextSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const columns: Column<Asset>[] = useMemo(
    () => [
      { key: 'asset_number', header: 'Asset Code', render: (row) => row.asset_number },
      { key: 'name', header: 'Name', render: (row) => row.name },
      { key: 'category', header: 'Category', render: (row) => row.category ?? '—' },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge tone={assetStatusTone(row.status)}>{row.status}</Badge>,
      },
      { key: 'location', header: 'Location', render: (row) => row.location ?? '—' },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="secondary" onClick={() => void openView(row.id)}>
              View
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void openQrLabel(row.id)}>
              PSA QR
            </Button>
            {canManageAssets && (
              <Button size="sm" variant="secondary" onClick={() => void openEdit(row.id)}>
                Edit
              </Button>
            )}
            {row.status === 'AVAILABLE' && (
              <>
                <Button size="sm" variant="primary" onClick={() => setBorrowId(row.id)}>
                  Borrow
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setReserveId(row.id)}>
                  Reserve
                </Button>
              </>
            )}
            {row.status === 'BORROWED' && (
              <Button size="sm" variant="success" onClick={() => setReturnId(row.id)}>
                Return
              </Button>
            )}
            {canManageAssets && (
              <Button size="sm" variant="danger" onClick={() => setDeleteId(row.id)}>
                Delete
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canManageAssets],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Assets</h1>
          <p className="text-sm text-gray-500">Connected to GET /api/v1/assets when backend is available.</p>
        </div>
        <Button onClick={() => setScannerOpen(true)}>Scan Asset QR</Button>
      </div>

      {message && (
        <Alert tone="info" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <SearchBar
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load(1)
            }}
          />
          <div className="flex w-full max-w-xs gap-2">
            <Dropdown
              options={[
                { label: 'Available', value: 'AVAILABLE' },
                { label: 'Borrowed', value: 'BORROWED' },
                { label: 'Reserved', value: 'RESERVED' },
                { label: 'Maintenance', value: 'MAINTENANCE' },
              ]}
              placeholder="All statuses"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
            <Button variant="secondary" onClick={() => void load(1)}>
              Search
            </Button>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <>
            <Table
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No assets found" />}
            />
            <Pagination page={page} lastPage={lastPage} total={total} onPageChange={(p) => void load(p)} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete asset"
        message="Soft-delete / archive this asset? This calls DELETE /api/v1/assets/{asset}."
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId === null) return
          void assetService.remove(deleteId).then(() => {
            setDeleteId(null)
            setMessage('Asset delete requested.')
            void load(page)
          })
        }}
      />

      <ConfirmDialog
        open={returnId !== null}
        title="Return asset"
        message={
          <div className="space-y-3">
            <p>Return this borrowed asset and mark it available again?</p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Return Notes</label>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={2}
                placeholder="Optional return notes"
              />
            </div>
          </div>
        }
        confirmLabel="Return"
        tone="primary"
        onCancel={() => {
          setReturnId(null)
          setReturnNotes('')
        }}
        onConfirm={() => {
          if (returnId === null) return
          void assetService.returnAsset(returnId, returnNotes).then(() => {
            setReturnId(null)
            setReturnNotes('')
            setMessage('Asset returned successfully.')
            void load(page)
          })
        }}
      />

      <ConfirmDialog
        open={borrowId !== null}
        title="Borrow asset"
        message={
          <div className="space-y-3">
            <p>Borrow this asset? An email notification will be sent to the admin.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date (days)</label>
              <input
                type="number"
                min="1"
                value={borrowDueDays ?? ''}
                onChange={(e) => setBorrowDueDays(e.target.value ? Number(e.target.value) : undefined)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={borrowNotes}
                onChange={(e) => setBorrowNotes(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={2}
                placeholder="Optional notes"
              />
            </div>
          </div>
        }
        confirmLabel="Borrow"
        onCancel={() => {
          setBorrowId(null)
          setBorrowNotes('')
          setBorrowDueDays(undefined)
        }}
        onConfirm={() => {
          if (borrowId === null) return
          void assetService.borrow(borrowId, borrowDueDays, borrowNotes).then((borrowing) => {
            setBorrowId(null)
            setBorrowNotes('')
            setBorrowDueDays(undefined)
            setReceipt({
              type: 'Borrowing',
              code: borrowing.receipt_code ?? `PSA-BOR-${borrowing.id}`,
              payload: borrowing.receipt_payload ?? `PSA-BOR-${borrowing.id}|${borrowing.asset_number ?? borrowing.asset_id}|${borrowing.user_id}`,
              employee: borrowing.employee_name,
              assetName: borrowing.asset_name,
              assetNumber: borrowing.asset_number,
              timestamp: borrowing.created_at,
              startDate: borrowing.borrow_date,
              endDate: borrowing.due_date,
              status: borrowing.status,
              authorizedBy: borrowing.authorized_by_name,
              authorizedAt: borrowing.authorized_at,
              remarks: borrowing.remarks,
            })
            setMessage('Asset borrowed successfully. Admin has been notified.')
            void load(page)
          })
        }}
      />

      <ConfirmDialog
        open={reserveId !== null}
        title="Reserve asset"
        message={
          <div className="space-y-3">
            <p>Reserve this asset for later pickup. Staff will approve it and convert it into a borrowing.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={reserveStartDate}
                  onChange={(e) => setReserveStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={reserveEndDate}
                  onChange={(e) => setReserveEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Purpose / Notes</label>
              <textarea
                value={reserveRemarks}
                onChange={(e) => setReserveRemarks(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={2}
                placeholder="Optional reservation purpose"
              />
            </div>
          </div>
        }
        confirmLabel="Reserve"
        onCancel={() => {
          setReserveId(null)
          setReserveRemarks('')
        }}
        onConfirm={() => {
          if (reserveId === null) return
          void reservationService
            .create({
              asset_ids: [reserveId],
              start_date: reserveStartDate,
              end_date: reserveEndDate,
              remarks: reserveRemarks || undefined,
            })
            .then((reservation) => {
              setReserveId(null)
              setReserveRemarks('')
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
              setMessage('Reservation created successfully. Present the receipt QR/reference to staff for approval.')
              void load(page)
            })
        }}
      />

      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      <AssetQrScanner open={scannerOpen} onClose={() => setScannerOpen(false)} />

      <Modal open={viewAsset !== null} title="Asset details" onClose={() => setViewAsset(null)}>
        {viewAsset && (
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-gray-500">Asset Number</dt>
              <dd className="font-medium text-gray-900">{viewAsset.asset_number}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <Badge tone={assetStatusTone(viewAsset.status)}>{viewAsset.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{viewAsset.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Category</dt>
              <dd>{viewAsset.category ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Office</dt>
              <dd>{viewAsset.office ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Location</dt>
              <dd>{viewAsset.location ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Model</dt>
              <dd>{viewAsset.model ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Condition</dt>
              <dd>{viewAsset.condition_status ?? 'Not set'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-gray-500">Description</dt>
              <dd>{viewAsset.description ?? 'No description'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-gray-500">Remarks</dt>
              <dd>{viewAsset.remarks ?? 'No remarks'}</dd>
            </div>
          </dl>
        )}
      </Modal>

      <Modal
        open={qrAsset !== null}
        title="PSA Asset QR Label"
        onClose={() => setQrAsset(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setQrAsset(null)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>Print QR Label</Button>
          </>
        }
      >
        {qrAsset && (
          <div className="asset-qr-print-area flex flex-col items-center gap-4 rounded-md border border-gray-200 bg-white p-6 text-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-brand-700">PSA Inventory</div>
              <h3 className="mt-1 text-xl font-semibold text-gray-900">{qrAsset.name}</h3>
              <p className="text-sm text-gray-500">Permanent organization-owned asset identifier</p>
            </div>
            <QrCode
              value={qrAsset.psa_qr_payload ?? qrAsset.psa_qr_identifier ?? qrAsset.asset_number}
              className="rounded border border-gray-300 bg-white p-2 text-gray-950"
            />
            <div>
              <div className="text-lg font-bold tracking-wide text-gray-900">
                {qrAsset.psa_qr_identifier ?? 'PSA QR not generated'}
              </div>
              <div className="text-sm text-gray-600">Asset No: {qrAsset.asset_number}</div>
            </div>
            <div className="w-full rounded bg-gray-50 p-3 text-left text-xs text-gray-600">
              <div className="font-semibold text-gray-700">Supported scan identifiers remain separate:</div>
              <ul className="mt-1 list-inside list-disc">
                {(qrAsset.identifiers ?? []).map((identifier) => (
                  <li key={identifier.id}>
                    {identifier.identifier_type}: {identifier.identifier_value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={editAsset !== null}
        title="Edit asset"
        onClose={() => setEditAsset(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditAsset(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitEdit()} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Asset Name"
            value={editForm.name ?? ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Input
            label="Model"
            value={editForm.model ?? ''}
            onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={editForm.status ?? 'AVAILABLE'}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AssetStatus })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="BORROWED">Borrowed</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="RETIRED">Retired</option>
              <option value="DISPOSED">Disposed</option>
            </select>
          </div>
          <Input
            label="Condition"
            value={editForm.condition_status ?? ''}
            onChange={(e) => setEditForm({ ...editForm, condition_status: e.target.value })}
            placeholder="GOOD, FAIR, DAMAGED, LOST, UNDER_REPAIR"
          />
          <Input
            label="Description"
            value={editForm.description ?? ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
          <Input
            label="Remarks"
            value={editForm.remarks ?? ''}
            onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  )
}
