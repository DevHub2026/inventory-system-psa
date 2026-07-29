import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ScanLine, CheckCircle2, XCircle, Printer } from 'lucide-react'
import {
  Alert, Badge, Button, ConfirmDialog, Dropdown, SetupDropdown, EmptyState,
  Input, Modal, Pagination, SearchBar, Spinner, Table, type Column,
} from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { assetService, type UpdateAssetPayload } from '@/services/assetService'
import { setupService, type SetupRecord } from '@/services/setupService'
import { api, unwrapData } from '@/services/api'
import { reservationService } from '@/services/reservationService'
import { useAuth } from '@/hooks/useAuth'
import { ReceiptModal, type ReceiptRecord } from '@/components/ReceiptModal'
import { AssetQrScanner } from '@/components/AssetQrScanner'
import { QrCode } from '@/components/QrCode'
import type { Asset, AssetStatus } from '@/types'
import { assetStatusTone } from '@/utils/statusTone'
import { isAdmin, isStaff, hasAnyRole } from '@/utils/roleHelpers'
import { assetStatusLabel } from '@/utils/displayLabels'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { PrintableDocumentModal } from '@/components/documents/PrintableDocumentModal'
import { ReissueAssetModal } from '@/components/assets/ReissueAssetModal'


/* ── shared select / textarea style ── */
const SELECT_CLS =
  'w-full h-11 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#1F2937] ' +
  'shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors duration-200 ' +
  'focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15'

const TEXTAREA_CLS =
  'block w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-[14px] text-[#1F2937] ' +
  'placeholder:text-[#9CA3AF] shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors duration-200 ' +
  'focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15'

const LABEL_CLS = 'mb-1.5 block text-[13px] font-medium text-[#1F2937]'

export function AssetPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const canManageAssets     = isAdmin(user)
  const canCompleteBorrowing = isAdmin(user) || isStaff(user)

  const [rows,      setRows]      = useState<Asset[]>([])
  const [page,      setPage]      = useState(1)
  const [lastPage,  setLastPage]  = useState(1)
  const [total,     setTotal]     = useState(0)
  const [search,    setSearch]    = useState(searchParams.get('search') ?? '')
  const [status,    setStatus]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [message,   setMessage]   = useState<string | null>(null)
  const [deleteId,  setDeleteId]  = useState<number | null>(null)
  const [borrowId,  setBorrowId]  = useState<number | null>(null)
  const [reserveId, setReserveId] = useState<number | null>(null)
  const [returnId,  setReturnId]  = useState<number | null>(null)
  const [returnNotes,    setReturnNotes]    = useState('')
  const [borrowNotes,    setBorrowNotes]    = useState('')
  const [borrowDueDays,  setBorrowDueDays]  = useState<number | undefined>(undefined)
  const [reserveStartDate, setReserveStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [reserveEndDate,   setReserveEndDate]   = useState(new Date().toISOString().slice(0, 10))
  const [reserveRemarks,   setReserveRemarks]   = useState('')
  const [receipt,    setReceipt]    = useState<ReceiptRecord | null>(null)
  const [viewAsset,  setViewAsset]  = useState<Asset | null>(null)
  const [qrAsset,    setQrAsset]    = useState<Asset | null>(null)
  const [scannerOpen,setScannerOpen]= useState(false)
  const [editAsset,  setEditAsset]  = useState<Asset | null>(null)
  const [saving,     setSaving]     = useState(false)

  // Printable issuance receipt
  const [printIssuanceId, setPrintIssuanceId] = useState<number | null>(null)

  // Re-issuance State
  const [reissueAsset, setReissueAsset] = useState<Asset | null>(null)
  const [detailTab, setDetailTab] = useState<'info' | 'history'>('info')
  const [issuanceHistory, setIssuanceHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Setup options for Quick Add / Quick Edit dropdowns
  const [offices, setOffices] = useState<SetupRecord[]>([])
  const [locations, setLocations] = useState<SetupRecord[]>([])
  const [assetCategories, setAssetCategories] = useState<SetupRecord[]>([])
  const [manufacturers, setManufacturers] = useState<SetupRecord[]>([])

  // Live item code validation state
  const [codeValidation, setCodeValidation] = useState<{ exists: boolean; message: string } | null>(null)

  const [editForm,   setEditForm]   = useState<UpdateAssetPayload>({
    asset_number: '', name: '', description: '', model: '', status: 'AVAILABLE', condition_status: '', remarks: '',
    asset_category_id: null, manufacturer_id: null, office_id: null, location_id: null,
    issued_to: '', date_issued: '',
  })

  const loadSetupOptions = useCallback(async () => {
    try {
      const [offs, locs, cats, mans] = await Promise.all([
        setupService.list('offices'),
        setupService.list('locations'),
        setupService.list('asset-categories'),
        setupService.list('manufacturers'),
      ])
      setOffices(offs)
      setLocations(locs)
      setAssetCategories(cats)
      setManufacturers(mans)
    } catch { /* best effort */ }
  }, [])

  useEffect(() => {
    void loadSetupOptions()
  }, [loadSetupOptions])

  const validateCodeLive = useCallback(async (code: string, ignoreId?: number) => {
    if (!code.trim()) { setCodeValidation(null); return }
    try {
      const { data } = await api.get('/assets/validate-code', {
        params: { code: code.trim(), ignore_id: ignoreId }
      })
      setCodeValidation(unwrapData(data))
    } catch {
      setCodeValidation(null)
    }
  }, [])

  async function load(nextPage = page, nextSearch = search) {
    setLoading(true)
    try {
      const result = await assetService.list({ page: nextPage, search: nextSearch || undefined, status: status || undefined })
      setRows(result.items)
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
      setTotal(result.meta.total)
    } finally {
      setLoading(false)
    }
  }

  async function openView(id: number) {
    setMessage(null)
    setDetailTab('info')
    setIssuanceHistory([])
    try {
      const assetData = await assetService.show(id)
      setViewAsset(assetData)
      
      setLoadingHistory(true)
      const historyData = await assetService.getIssuanceHistory(id)
      setIssuanceHistory(historyData)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Unable to load asset details.')
    } finally {
      setLoadingHistory(false)
    }
  }

  async function openEdit(id: number) {
    if (!canManageAssets) { setMessage('Only administrators can edit asset records.'); return }
    setMessage(null)
    setCodeValidation(null)
    try {
      await loadSetupOptions()
      const a = await assetService.show(id)
      setEditAsset(a)
      setEditForm({
        asset_number: a.asset_number,
        name: a.name,
        description: a.description ?? '',
        asset_category_id: a.asset_category_id ?? null,
        manufacturer_id: a.manufacturer_id ?? null,
        office_id: a.office_id ?? null,
        location_id: a.location_id ?? null,
        model: a.model ?? '',
        status: a.status,
        condition_status: a.condition_status ?? '',
        remarks: a.remarks ?? '',
        issued_to: a.issued_to ?? '',
        date_issued: a.date_issued ?? '',
      })
    } catch (e: unknown) { setMessage(e instanceof Error ? e.message : 'Unable to load asset for editing.') }
  }

  async function openQrLabel(id: number) {
    setMessage(null)
    try { setQrAsset(await assetService.show(id)) }
    catch (e: unknown) { setMessage(e instanceof Error ? e.message : 'Unable to load PSA QR label.') }
  }

  async function submitEdit() {
    if (!editAsset) return
    if (codeValidation?.exists) {
      setMessage('Please fix the duplicate Item Code before saving.')
      return
    }
    setSaving(true); setMessage(null)
    try {
      await assetService.update(editAsset.id, {
        ...editForm,
        asset_number: editForm.asset_number?.trim() || undefined,
        description: editForm.description || null,
        model: editForm.model || null,
        condition_status: editForm.condition_status || null,
        remarks: editForm.remarks || null,
        issued_to: editForm.issued_to || null,
        date_issued: editForm.date_issued || null,
      })
      setEditAsset(null)
      setMessage('Asset updated successfully.')
      await load(page)
    } catch (e: unknown) { setMessage(e instanceof Error ? e.message : 'Unable to update asset.') }
    finally { setSaving(false) }
  }

  useEffect(() => { void load(1) }, [status])
  useEffect(() => {
    const q = searchParams.get('search') ?? ''
    setSearch(q); void load(1, q)
  }, [searchParams])

  /* Cross-component data refresh subscription */
  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'assets') || affectsScope(scope, 'borrowings') || affectsScope(scope, 'reservations')) {
      void load(page)
      if (viewAsset) void openView(viewAsset.id)
      if (qrAsset)   void openQrLabel(qrAsset.id)
    }
  }), [page, search, status, viewAsset?.id, qrAsset?.id])

  const columns: Column<Asset>[] = useMemo(() => [
    { key: 'asset_number', header: 'Asset No.',  render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.asset_number}</span> },
    { key: 'name',         header: 'Name',       render: (r) => <span className="font-medium text-[#1F2937]">{r.name}</span> },
    { key: 'category',     header: 'Category',   render: (r) => r.category ?? '—' },
    { key: 'status',       header: 'Status',     render: (r) => <Badge tone={assetStatusTone(r.status)}>{assetStatusLabel(r.status)}</Badge> },
    { key: 'location',     header: 'Location',   render: (r) => r.location ?? '—' },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
          {/* Info actions */}
          <Button size="sm" variant="ghost" onClick={() => void openView(r.id)}>View</Button>
          <Button size="sm" variant="ghost" onClick={() => void openQrLabel(r.id)}>QR Label</Button>

          {/* Divider */}
          <span style={{ width: 1, height: 20, background: '#e2e8f0', flexShrink: 0 }} />

          {/* Edit */}
          {canManageAssets && (
            <Button size="sm" variant="secondary" onClick={() => void openEdit(r.id)}>Edit</Button>
          )}

          {/* Status-based primary action */}
          {r.status === 'AVAILABLE' && canCompleteBorrowing && (
            <Button size="sm" variant="primary" onClick={() => setBorrowId(r.id)}>Borrow</Button>
          )}
          {r.status === 'AVAILABLE' && (
            <Button size="sm" variant="outline" onClick={() => setReserveId(r.id)}>Request</Button>
          )}
          {r.status === 'BORROWED' && canCompleteBorrowing && (
            <Button size="sm" variant="success" onClick={() => setReturnId(r.id)}>Return</Button>
          )}

          {/* Danger */}
          {canManageAssets && (
            <Button size="sm" variant="danger" onClick={() => setDeleteId(r.id)}>Delete</Button>
          )}
        </div>
      ),
    },
  ], [canManageAssets, canCompleteBorrowing])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Assets"
        subtitle="Search, scan, borrow, and view PSA-tracked assets."
        actions={
          <Button onClick={() => setScannerOpen(true)}>
            <ScanLine className="h-4 w-4" />
            Scan Asset QR
          </Button>
        }
      />

      {message && <Alert tone="info" onClose={() => setMessage(null)}>{message}</Alert>}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #f1f5f9', padding: '14px 20px' }}>
          <SearchBar
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void load(1) }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Dropdown
              options={[
                { label: 'Available',   value: 'AVAILABLE' },
                { label: 'Borrowed',    value: 'BORROWED' },
                { label: 'Reserved',    value: 'RESERVED' },
                { label: 'Maintenance', value: 'MAINTENANCE' },
              ]}
              placeholder="All statuses"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
            <Button variant="secondary" onClick={() => void load(1)}>Search</Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : (
          <>
            <Table
              columns={columns} rows={rows} rowKey={(r) => r.id}
              empty={<div className="py-16"><EmptyState title="No assets found" description="Try another search term or clear the status filter." /></div>}
            />
            <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 20px' }}>
              <Pagination page={page} lastPage={lastPage} total={total} onPageChange={(p) => void load(p)} />
            </div>
          </>
        )}
      </div>

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={deleteId !== null} title="Archive Asset"
        message="Are you sure you want to archive this asset? It will no longer appear as an active item."
        confirmLabel="Archive Item"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId === null) return
          void assetService.remove(deleteId).then(() => { setDeleteId(null); setMessage('Asset archived.'); void load(page) })
        }}
      />

      <ConfirmDialog
        open={returnId !== null} title="Return Item"
        message={
          <div className="space-y-3">
            <p className="text-[14px] text-[#374151]">Return this borrowed item and mark it available again?</p>
            <div>
              <label className={LABEL_CLS}>Return Notes</label>
              <textarea className={TEXTAREA_CLS} rows={2} placeholder="Optional return notes" value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} />
            </div>
          </div>
        }
        confirmLabel="Return Item" tone="primary"
        onCancel={() => { setReturnId(null); setReturnNotes('') }}
        onConfirm={() => {
          if (returnId === null) return
          void assetService.returnAsset(returnId, returnNotes).then(() => {
            setReturnId(null)
            setReturnNotes('')
            setMessage('Item returned successfully.')
            notifyDataChanged('all')
            void load(page)
          })
        }}
      />

      <ConfirmDialog
        open={borrowId !== null} title="Borrow Item"
        message={
          <div className="space-y-3">
            <p className="text-[14px] text-[#374151]">Borrow this item now? A receipt will be generated for the transaction.</p>
            <div>
              <label className={LABEL_CLS}>Due Date (days)</label>
              <input type="number" min="1" className={SELECT_CLS} placeholder="Optional" value={borrowDueDays ?? ''} onChange={(e) => setBorrowDueDays(e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Notes</label>
              <textarea className={TEXTAREA_CLS} rows={2} placeholder="Optional notes" value={borrowNotes} onChange={(e) => setBorrowNotes(e.target.value)} />
            </div>
          </div>
        }
        confirmLabel="Borrow Item"
        onCancel={() => { setBorrowId(null); setBorrowNotes(''); setBorrowDueDays(undefined) }}
        onConfirm={() => {
          if (borrowId === null) return
          void assetService.borrow(borrowId, borrowDueDays, borrowNotes).then((b) => {
            setBorrowId(null); setBorrowNotes(''); setBorrowDueDays(undefined)
            setReceipt({ type: 'Borrowing', code: b.receipt_code ?? `PSA-BOR-${b.id}`, payload: b.receipt_payload ?? `PSA-BOR-${b.id}|${b.asset_number ?? b.asset_id}|${b.user_id}`, employee: b.employee_name, assetName: b.asset_name, assetNumber: b.asset_number, timestamp: b.created_at, startDate: b.borrow_date, endDate: b.due_date, status: b.status, authorizedBy: b.authorized_by_name, authorizedAt: b.authorized_at, remarks: b.remarks })
            setMessage('Item borrowed successfully. Your receipt is ready.')
            notifyDataChanged('all')
            void load(page)
          })
        }}
      />

      <ConfirmDialog
        open={reserveId !== null} title="Send Borrow Request"
        message={
          <div className="space-y-3">
            <p className="text-[14px] text-[#374151]">Send a request to borrow this asset later. Staff will approve it before release.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Start Date</label>
                <input type="date" className={SELECT_CLS} value={reserveStartDate} onChange={(e) => setReserveStartDate(e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLS}>End Date</label>
                <input type="date" className={SELECT_CLS} value={reserveEndDate} onChange={(e) => setReserveEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Purpose / Notes</label>
              <textarea className={TEXTAREA_CLS} rows={2} placeholder="Optional borrow request purpose" value={reserveRemarks} onChange={(e) => setReserveRemarks(e.target.value)} />
            </div>
          </div>
        }
        confirmLabel="Send Request"
        onCancel={() => { setReserveId(null); setReserveRemarks('') }}
        onConfirm={() => {
          if (reserveId === null) return
          void reservationService
            .create({
              asset_ids: [reserveId],
              start_date: reserveStartDate,
              end_date: reserveEndDate,
              remarks: reserveRemarks || undefined,
            })
            .then((res) => {
              setReserveId(null)
              setReserveRemarks('')
              setReceipt({
                type: 'Reservation',
                code: res.receipt_code ?? `PSA-RES-${res.id}`,
                payload: res.receipt_payload ?? `PSA-RES-${res.id}|${res.asset_numbers?.join(',') ?? res.asset_ids?.join(',')}|${res.user_id}`,
                employee: res.employee_name,
                assetName: res.asset_names?.join(', '),
                assetNumber: res.asset_numbers?.join(', '),
                timestamp: res.created_at,
                startDate: res.start_date,
                endDate: res.end_date,
                status: res.status,
                authorizedBy: res.authorized_by_name,
                authorizedAt: res.authorized_at,
                remarks: res.remarks,
              })
              setMessage('Borrow request sent successfully. Present the receipt QR/reference to staff for approval.')
              notifyDataChanged('all')
              void load(page)
            })
        }}
      />

      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      <AssetQrScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onCompleted={() => void load(page)} />

      {/* ── View Asset ── */}
      <Modal
        open={viewAsset !== null}
        title="Asset Details"
        onClose={() => setViewAsset(null)}
        footer={
          viewAsset ? (
            <div className="flex items-center justify-between w-full">
              <div>
                {viewAsset.issued_to &&
                  hasAnyRole(user, ['Super Administrator', 'System Administrator', 'Property Custodian', 'Inventory Officer']) &&
                  viewAsset.status !== 'BORROWED' &&
                  viewAsset.status !== 'RESERVED' &&
                  viewAsset.status !== 'MAINTENANCE' &&
                  !['RETIRED', 'DISPOSED'].includes(viewAsset.status) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setReissueAsset(viewAsset)
                        setViewAsset(null)
                      }}
                    >
                      Re-Issue Asset
                    </Button>
                  )}
              </div>
              {viewAsset.issued_to && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPrintIssuanceId(viewAsset.id)
                    setViewAsset(null)
                  }}
                >
                  <Printer size={14} className="mr-1.5" /> Print Issuance Receipt (PAR)
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {viewAsset && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                className={`flex-1 pb-2.5 text-center text-sm font-semibold border-b-2 transition-all ${
                  detailTab === 'info'
                    ? 'border-[#0D47A1] text-[#0D47A1]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setDetailTab('info')}
              >
                General Info
              </button>
              <button
                type="button"
                className={`flex-1 pb-2.5 text-center text-sm font-semibold border-b-2 transition-all ${
                  detailTab === 'history'
                    ? 'border-[#0D47A1] text-[#0D47A1]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setDetailTab('history')}
              >
                Issuance History
              </button>
            </div>

            {detailTab === 'info' ? (
              <dl className="grid gap-4 text-sm sm:grid-cols-2 mt-2">
                {[
                  { label: 'Asset Number', value: viewAsset.asset_number, mono: true },
                  { label: 'Status',       value: <Badge tone={assetStatusTone(viewAsset.status)}>{assetStatusLabel(viewAsset.status)}</Badge> },
                  { label: 'Name',         value: viewAsset.name },
                  { label: 'Category',     value: viewAsset.category ?? '—' },
                  { label: 'Office',       value: viewAsset.office ?? '—' },
                  { label: 'Location',     value: viewAsset.location ?? '—' },
                  { label: 'Model',        value: viewAsset.model ?? '—' },
                  { label: 'Condition',    value: viewAsset.condition_status ?? '—' },
                  { label: 'Description',  value: viewAsset.description ?? '—', full: true },
                  { label: 'Remarks',      value: viewAsset.remarks ?? '—',     full: true },
                  { label: 'Issued To',    value: viewAsset.issued_to ?? '—' },
                  { label: 'Issued By',    value: viewAsset.issued_by_name ?? '—' },
                  { label: 'Date Issued',  value: viewAsset.date_issued ?? '—', full: true },
                ].map((item) => (
                  <div key={item.label} className={item.full ? 'sm:col-span-2' : ''}>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">{item.label}</dt>
                    <dd className={`mt-0.5 font-medium text-[#1F2937] ${item.mono ? 'font-mono text-xs' : 'text-[14px]'}`}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-2 space-y-4">
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Spinner label="Loading history logs..." />
                  </div>
                ) : issuanceHistory.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 italic">
                    No re-issuance history logs recorded for this asset.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 py-2">
                    {issuanceHistory.map((h, idx) => (
                      <div key={h.id || idx} className="relative">
                        {/* Dot */}
                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-[#0D47A1]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0D47A1]" />
                        </span>
                        
                        <div className="text-[11px] font-semibold text-slate-400">{h.transfer_date}</div>
                        <div className="mt-0.5 text-sm font-medium text-slate-800">
                          Accountability reassigned to <strong className="text-[#0D47A1]">{h.new_employee?.full_name || h.new_employee || 'N/A'}</strong>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Previous Holder: {h.previous_employee?.full_name || h.previous_employee || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-400">
                          Authorized by: {h.officer?.full_name || h.officer || 'N/A'}
                        </div>
                        {h.reason && (
                          <div className="mt-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 max-w-md">
                            <strong>Reason:</strong> {h.reason}
                          </div>
                        )}
                        {h.remarks && (
                          <div className="mt-1 text-[11px] text-slate-400 italic">
                            Remarks: {h.remarks}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── QR Label ── */}
      <Modal
        open={qrAsset !== null} title="PSA Asset QR Label" onClose={() => setQrAsset(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setQrAsset(null)}>Close</Button>
            <Button onClick={() => window.print()}>Print QR Label</Button>
          </>
        }
      >
        {qrAsset && (
          <div className="asset-qr-print-area" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            borderRadius: 16, border: '1px solid #e2e8f0', background: '#ffffff',
            padding: '32px 28px', textAlign: 'center',
          }}>
            {/* Header */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.2em', color: '#0B3D91',
                background: '#EEF4FF', border: '1px solid #C5D8FF',
                borderRadius: 20, padding: '4px 14px',
                marginBottom: 10,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <rect x="7" y="7" width="3" height="3" />
                  <rect x="14" y="7" width="3" height="3" />
                  <rect x="7" y="14" width="3" height="3" />
                  <rect x="14" y="14" width="3" height="3" />
                </svg>
                PSA Inventory
              </div>
              <h3 style={{
                fontSize: 20, fontWeight: 700, color: '#1e293b',
                margin: '0 0 4px', lineHeight: 1.25,
              }}>
                {qrAsset.name}
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                Permanent organization-owned asset identifier
              </p>
            </div>

            {/* Divider */}
            <div style={{ width: 60, height: 2, background: '#e2e8f0', borderRadius: 1 }} />

            {/* QR Code */}
            <div style={{
              borderRadius: 14, border: '1px solid #e2e8f0', background: '#ffffff',
              padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <QrCode value={qrAsset.psa_qr_payload ?? qrAsset.psa_qr_identifier ?? qrAsset.asset_number} />
            </div>

            {/* Identifier */}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', letterSpacing: '0.02em' }}>
                {qrAsset.psa_qr_identifier ?? 'PSA QR not generated'}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                Asset No: {qrAsset.asset_number}
              </div>
            </div>

            {/* Identifiers list */}
            <div style={{
              width: '100%', borderRadius: 10, background: '#f8fafc',
              border: '1px solid #f1f5f9', padding: 14, textAlign: 'left',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                Supported scan identifiers
              </div>
              {(qrAsset.identifiers ?? []).length > 0 ? (
                <ul style={{
                  margin: 0, padding: 0, listStyle: 'none',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {(qrAsset.identifiers ?? []).map((id) => (
                    <li key={id.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 12, color: '#64748b',
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#0B3D91', flexShrink: 0,
                      }} />
                      <span style={{ fontWeight: 600, color: '#334155' }}>{id.identifier_type}:</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{id.identifier_value}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>No additional identifiers registered.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Asset Modal ── */}
      <Modal
        open={editAsset !== null}
        title={`Edit Asset: ${editAsset?.name ?? ''}`}
        onClose={() => setEditAsset(null)}
        maxWidth={700}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditAsset(null)}>Cancel</Button>
            <Button onClick={() => void submitEdit()} disabled={saving || Boolean(codeValidation?.exists)}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Section 1: Basic Information */}
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">1. Basic Information</p>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Item Name"
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <div>
                  <label className={LABEL_CLS}>Item Code / SKU</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={SELECT_CLS}
                      value={editForm.asset_number ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setEditForm({ ...editForm, asset_number: val })
                        void validateCodeLive(val, editAsset?.id)
                      }}
                      placeholder="e.g. AST-2026-001"
                    />
                    {codeValidation && (
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        {codeValidation.exists ? (
                          <span className="flex items-center gap-1 font-medium text-red-600">
                            <XCircle size={14} /> ❌ Already exists
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-medium text-emerald-600">
                            <CheckCircle2 size={14} /> ✓ Available
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>Description</label>
                <textarea
                  className={TEXTAREA_CLS}
                  rows={2}
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Asset description..."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SetupDropdown
                  label="Asset Category"
                  resource="asset-categories"
                  options={assetCategories.map((c) => ({ label: c.name, value: c.id, raw: c }))}
                  value={editForm.asset_category_id}
                  onChange={(val) => setEditForm({ ...editForm, asset_category_id: val })}
                  onRefreshNeeded={loadSetupOptions}
                  placeholder="Select Category"
                />
                <SetupDropdown
                  label="Manufacturer"
                  resource="manufacturers"
                  options={manufacturers.map((m) => ({ label: m.name, value: m.id, raw: m }))}
                  value={editForm.manufacturer_id}
                  onChange={(val) => setEditForm({ ...editForm, manufacturer_id: val })}
                  onRefreshNeeded={loadSetupOptions}
                  placeholder="Select Manufacturer"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SetupDropdown
                  label="Office"
                  resource="offices"
                  options={offices.map((o) => ({ label: o.name, value: o.id, raw: o }))}
                  value={editForm.office_id}
                  onChange={(val) => setEditForm({ ...editForm, office_id: val, location_id: null })}
                  onRefreshNeeded={loadSetupOptions}
                  placeholder="Select Office"
                />
                <SetupDropdown
                  label="Location"
                  resource="locations"
                  options={locations
                    .filter((l) => !editForm.office_id || l.office_id === editForm.office_id)
                    .map((l) => ({ label: l.name, value: l.id, raw: l }))}
                  value={editForm.location_id}
                  onChange={(val) => setEditForm({ ...editForm, location_id: val })}
                  onRefreshNeeded={loadSetupOptions}
                  needsOffice
                  currentOfficeId={editForm.office_id}
                  placeholder="Select Location"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Inventory */}
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">2. Inventory</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Available Quantity (Current Stock)</label>
                <input
                  type="text"
                  readOnly
                  value="1"
                  className="w-full h-11 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] px-3.5 text-[14px] text-[#6B7280] shadow-[0_1px_2px_rgba(0,0,0,.05)] cursor-not-allowed select-all font-semibold"
                  title="Available Quantity is read-only. Stock changes are managed via inventory transactions."
                />
                <p className="mt-1 text-[11px] text-[#94A3B8]">
                  Read-only. Stock adjustments are managed via inventory transactions.
                </p>
              </div>
              <Input
                label="Remarks / Internal Notes"
                value={editForm.remarks ?? ''}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
              />
            </div>
          </div>

          {/* Section 3: Asset Information */}
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">3. Asset Information</p>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Model Number"
                  value={editForm.model ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                />
                <div>
                  <label className={LABEL_CLS}>Condition</label>
                  <Input
                    value={editForm.condition_status ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, condition_status: e.target.value })}
                    placeholder="GOOD, FAIR, DAMAGED"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Status</label>
                  <select
                    className={SELECT_CLS}
                    value={editForm.status ?? 'AVAILABLE'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AssetStatus })}
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
              </div>
            </div>
          </div>

          {/* Section 4: Permanent Issuance Information */}
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">4. Permanent Issuance Information</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Issued To"
                value={editForm.issued_to ?? ''}
                onChange={(e) => setEditForm({ ...editForm, issued_to: e.target.value })}
                placeholder="Full Name / Accountable Officer"
              />
              <div>
                <label className={LABEL_CLS}>Date Issued</label>
                <input
                  type="date"
                  className={SELECT_CLS}
                  value={editForm.date_issued ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, date_issued: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Audit Information */}
          {editAsset && (
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3.5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">5. Audit Information</p>
              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-slate-700">Created By:</span>{' '}
                  {editAsset.created_by_name || 'System'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Created At:</span>{' '}
                  {editAsset.created_at ? new Date(editAsset.created_at).toLocaleString() : '—'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Updated By:</span>{' '}
                  {editAsset.updated_by_name || '—'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Updated At:</span>{' '}
                  {editAsset.updated_at ? new Date(editAsset.updated_at).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Issuance Receipt / PAR Printable Document Modal */}
      <PrintableDocumentModal
        open={printIssuanceId !== null}
        onClose={() => setPrintIssuanceId(null)}
        documentType="issuance"
        targetId={printIssuanceId}
        title="Property Acknowledgement Receipt (PAR)"
      />

      {/* Asset Re-Issuance Wizard Modal */}
      {reissueAsset && (
        <ReissueAssetModal
          open={reissueAsset !== null}
          onClose={() => setReissueAsset(null)}
          asset={reissueAsset}
          onSuccess={() => void load(page)}
        />
      )}
    </div>
  )
}
