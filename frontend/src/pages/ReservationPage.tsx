import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, Spinner } from '@/components/ui'
import { ReceiptModal, type ReceiptRecord } from '@/components/ReceiptModal'
import { assetService } from '@/services/assetService'
import { reservationService } from '@/services/reservationService'
import { useAuth } from '@/hooks/useAuth'
import type { Asset, Reservation } from '@/types'
import { reservationStatusTone } from '@/utils/statusTone'
import { isAdmin, isStaff } from '@/utils/roleHelpers'
import { reservationStatusLabel } from '@/utils/displayLabels'
import { PageHeader } from '@/components/PageHeader'
import { ApprovalHistoryTimeline } from '@/components/workflows/ApprovalHistoryTimeline'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { formatDate } from '@/utils/dateFormat'

// ─── table styles (shared with BorrowingPage) ─────────────────────────────────

const th: React.CSSProperties = {
  padding: '11px 16px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: '#94A3B8',
  whiteSpace: 'nowrap',
  background: '#F8FAFC',
  borderBottom: '1px solid #E2E8F0',
}

const td: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
  fontSize: 13,
  color: '#334155',
  borderBottom: '1px solid #F1F5F9',
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function ScheduleCell({ from, until }: { from?: string; until?: string }) {
  if (!from && !until) return <span style={{ color: '#CBD5E1' }}>—</span>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, whiteSpace: 'nowrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#64748B',
          background: '#F1F5F9', borderRadius: 4, padding: '1px 5px',
          minWidth: 36, textAlign: 'center', flexShrink: 0,
        }}>
          FROM
        </span>
        <span style={{ fontWeight: 500, color: '#0F172A', fontSize: 12.5 }}>
          {from ? formatDate(from) : '—'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#64748B',
          background: '#F1F5F9', borderRadius: 4, padding: '1px 5px',
          minWidth: 36, textAlign: 'center', flexShrink: 0,
        }}>
          UNTIL
        </span>
        <span style={{ fontWeight: 500, color: '#0F172A', fontSize: 12.5 }}>
          {until ? formatDate(until) : '—'}
        </span>
      </div>
    </div>
  )
}

function AssetListCell({ names, numbers }: { names?: string[]; numbers?: string[] }) {
  if (!names?.length) return <span style={{ color: '#CBD5E1' }}>—</span>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {names.map((name, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{name}</span>
          {numbers?.[i] && (
            <span style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 11,
              color: '#475569', background: '#F1F5F9',
              padding: '1px 6px', borderRadius: 4, display: 'inline-block', width: 'fit-content',
            }}>
              {numbers[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function PurposeCell({ text, remarks }: { text?: string; remarks?: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontWeight: 500, color: '#0F172A', fontSize: 13 }}>
        {text || 'Reservation request'}
      </span>
      {remarks && remarks !== text && (
        <span style={{
          fontSize: 11.5, color: '#94A3B8',
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', maxWidth: 240,
          display: 'block',
        }}>
          {remarks}
        </span>
      )}
    </div>
  )
}

// ─── inline action button ────────────────────────────────────────────────────

function ActionBtn({
  label, onClick, variant = 'default', icon,
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'ghost'
  icon?: React.ReactNode
}) {
  const map = {
    default:  { bg: '#F8FAFC', bgH: '#EEF2F7', color: '#374151', border: '1px solid #E2E8F0' },
    primary:  { bg: '#1E40AF', bgH: '#1D3FAB', color: '#fff',     border: 'none'              },
    success:  { bg: '#166534', bgH: '#14532D', color: '#fff',     border: 'none'              },
    danger:   { bg: '#FEF2F2', bgH: '#FEE2E2', color: '#DC2626',  border: '1px solid #FECACA' },
    ghost:    { bg: 'transparent', bgH: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' },
  }
  const s = map[variant]
  return (
    <button
      onClick={onClick}
      style={{
        height: 28, paddingInline: 10, borderRadius: 6,
        border: s.border, background: s.bg, color: s.color,
        fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        whiteSpace: 'nowrap',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = s.bgH }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = s.bg  }}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

const ReceiptIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const CheckIcon = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XIcon = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// ─── page ──────────────────────────────────────────────────────────────────────

export function ReservationPage() {
  const { user } = useAuth()
  const canApprove = isAdmin(user) || isStaff(user)

  const [rows,       setRows]       = useState<Reservation[]>([])
  const [assets,     setAssets]     = useState<Asset[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ assetIds: [] as number[], startDate: '', endDate: '', remarks: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null)
  const [historyModalId, setHistoryModalId] = useState<number | null>(null)

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

  const buildReceipt = (res: Reservation): ReceiptRecord => ({
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

  const handleCreate = async () => {
    if (!form.assetIds.length || !form.startDate || !form.endDate) {
      setMessage({ type: 'error', text: 'Select at least one asset and provide the borrowing dates.' }); return
    }
    if (form.endDate < form.startDate) {
      setMessage({ type: 'error', text: 'End date cannot be before start date.' }); return
    }
    setSaving(true)
    try {
      const res = await reservationService.create({
        asset_ids: form.assetIds, start_date: form.startDate,
        end_date: form.endDate, remarks: form.remarks || undefined,
      })
      setReceipt(buildReceipt(res))
      setCreateOpen(false)
      setForm({ assetIds: [], startDate: '', endDate: '', remarks: '' })
      setMessage({ type: 'success', text: 'Borrow request sent successfully.' })
      notifyDataChanged('all')
      await loadReservations()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to send borrow request.' })
    } finally { setSaving(false) }
  }

  const handleApprove = async (id: number) => {
    try {
      const res = await reservationService.approve(id)
      setReceipt(buildReceipt(res))
      setMessage({ type: 'success', text: 'Borrow request approved.' })
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

  useEffect(() => { void loadReservations() }, [])

  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'reservations') || affectsScope(scope, 'borrowings')) {
      void loadReservations()
    }
  }), [])

  // ── summary counts ──────────────────────────────────────────────────────────
  const pending  = rows.filter(r => r.status === 'PENDING').length
  const approved = rows.filter(r => r.status === 'APPROVED').length
  const rejected = rows.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Borrow Requests"
        subtitle="Send and manage requests to borrow assets."
        actions={
          <button
            onClick={openCreate}
            style={{
              height: 38, paddingInline: 18, borderRadius: 10,
              border: 'none', background: '#1E40AF', color: '#fff',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 7,
              boxShadow: '0 2px 8px rgba(30,64,175,0.25)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1D3FAB' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1E40AF' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Borrow Request
          </button>
        }
      />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* ── Summary chips ── */}
      {!loading && rows.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',    count: rows.length, bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
            { label: 'Pending',  count: pending,  bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
            { label: 'Approved', count: approved, bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
            { label: 'Rejected / Cancelled', count: rejected, bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
          ].map(({ label, count, bg, color, dot }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: bg, color,
              border: `1px solid ${color}22`,
              borderRadius: 8, padding: '6px 14px',
              fontSize: 12.5, fontWeight: 600,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
              {label}: {count}
            </div>
          ))}
        </div>
      )}

      {/* ── Table card ── */}
      <Card noPadding>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><Spinner /></div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '64px 0' }}>
            <EmptyState
              title="No borrow requests found"
              description="Create a borrow request when you need an available asset."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <colgroup>
                <col style={{ width: 70  }} />   {/* ID */}
                <col style={{ width: 140 }} />   {/* Employee */}
                <col />                           {/* Asset (flex) */}
                <col style={{ width: 240 }} />   {/* Purpose */}
                <col style={{ width: 100 }} />   {/* Status */}
                <col style={{ width: 180 }} />   {/* Schedule */}
                <col style={{ width: 150 }} />   {/* Actions */}
              </colgroup>

              <thead>
                <tr>
                  <th style={th}>ID</th>
                  <th style={th}>Employee</th>
                  <th style={th}>Asset</th>
                  <th style={th}>Purpose</th>
                  <th style={th}>Status</th>
                  <th style={th}>Schedule</th>
                  <th style={{ ...th, textAlign: 'right', paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFD' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                  >
                    {/* ID */}
                    <td style={td}>
                      <span style={{
                        fontFamily: 'ui-monospace, monospace', fontSize: 12,
                        fontWeight: 700, color: '#1E40AF',
                        background: '#EFF6FF', borderRadius: 5,
                        padding: '2px 7px', display: 'inline-block',
                      }}>
                        #{r.id}
                      </span>
                    </td>

                    {/* Employee */}
                    <td style={td}>
                      <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>
                        {r.employee_name ?? '—'}
                      </span>
                    </td>

                    {/* Asset */}
                    <td style={td}>
                      <AssetListCell names={r.asset_names} numbers={r.asset_numbers} />
                    </td>

                    {/* Purpose */}
                    <td style={td}>
                      <PurposeCell text={r.purpose} remarks={r.remarks} />
                    </td>

                    {/* Status */}
                    <td style={td}>
                      <Badge tone={reservationStatusTone(r.status)}>
                        {reservationStatusLabel(r.status)}
                      </Badge>
                    </td>

                    {/* Schedule */}
                    <td style={td}>
                      <ScheduleCell from={r.reserved_from ?? r.start_date} until={r.reserved_until ?? r.end_date} />
                    </td>

                    {/* Actions */}
                    <td style={{ ...td, textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, flexWrap: 'wrap' }}>
                        <ActionBtn
                          label="History"
                          onClick={() => setHistoryModalId(r.id)}
                          variant="ghost"
                          icon={ReceiptIcon}
                        />
                        <ActionBtn
                          label="Receipt"
                          onClick={() => setReceipt(buildReceipt(r))}
                          icon={ReceiptIcon}
                        />
                        {canApprove && r.status === 'PENDING' && (
                          <>
                            <ActionBtn label="Approve" onClick={() => handleApprove(r.id)} variant="success" icon={CheckIcon} />
                            <ActionBtn label="Reject"  onClick={() => handleReject(r.id)}  variant="danger"  icon={XIcon} />
                          </>
                        )}
                        {!canApprove && r.status === 'PENDING' && (
                          <ActionBtn label="Cancel" onClick={() => handleCancel(r.id)} variant="ghost" icon={XIcon} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Asset picker ── */}
          <div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                Select Assets
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                Choose one or more assets to borrow. Click to select, click again to deselect.
              </div>
            </div>

            {assets.length === 0 ? (
              <div style={{
                padding: '20px 16px', borderRadius: 10,
                border: '1px dashed #E2E8F0', background: '#F8FAFC',
                textAlign: 'center', fontSize: 13, color: '#94A3B8',
              }}>
                No available assets at the moment.
              </div>
            ) : (
              <div style={{
                maxHeight: 220, overflowY: 'auto',
                border: '1px solid #E2E8F0', borderRadius: 10,
                background: '#fff',
              }}>
                {assets.map((a, i) => {
                  const selected = form.assetIds.includes(a.id)
                  return (
                    <div
                      key={a.id}
                      onClick={() =>
                        setForm((c) => ({
                          ...c,
                          assetIds: selected
                            ? c.assetIds.filter((id) => id !== a.id)
                            : [...c.assetIds, a.id],
                        }))
                      }
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px',
                        borderBottom: i < assets.length - 1 ? '1px solid #F1F5F9' : 'none',
                        cursor: 'pointer',
                        background: selected ? '#EFF6FF' : 'transparent',
                        transition: 'background 0.1s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                      }}
                    >
                      {/* Checkbox indicator */}
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: selected ? 'none' : '1.5px solid #CBD5E1',
                        background: selected ? '#1E40AF' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.1s',
                      }}>
                        {selected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>

                      {/* Asset info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: selected ? '#1E40AF' : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.name}
                        </div>
                        <div style={{
                          fontFamily: 'ui-monospace, monospace', fontSize: 11,
                          color: selected ? '#3B82F6' : '#64748B',
                          marginTop: 2,
                        }}>
                          {a.asset_number}
                        </div>
                      </div>

                      {selected && (
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, color: '#1E40AF',
                          background: '#DBEAFE', borderRadius: 4, padding: '1px 7px',
                          flexShrink: 0,
                        }}>
                          Selected
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {form.assetIds.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#1E40AF', fontWeight: 500 }}>
                {form.assetIds.length} asset{form.assetIds.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* ── Date range ── */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
              Borrowing Period
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((c) => ({ ...c, startDate: e.target.value }))}
              />
              <Input
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((c) => ({ ...c, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* ── Remarks ── */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
              Purpose / Remarks
              <span style={{ fontWeight: 400, color: '#94A3B8', marginLeft: 6 }}>(optional)</span>
            </label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm((c) => ({ ...c, remarks: e.target.value }))}
              placeholder="Describe the purpose of this borrow request or any relevant notes…"
              rows={3}
              style={{
                width: '100%', borderRadius: 10, border: '1px solid #E2E8F0',
                background: '#fff', padding: '10px 14px',
                fontSize: 13.5, color: '#1E293B', fontFamily: 'inherit',
                resize: 'vertical', outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1E40AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.1)' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)' }}
            />
          </div>

        </div>
      </Modal>

      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />

      {historyModalId && (
        <Modal
          open={Boolean(historyModalId)}
          onClose={() => setHistoryModalId(null)}
          title={`Borrow Request #${historyModalId} — Approval Trail`}
          maxWidth="max-w-xl"
        >
          <ApprovalHistoryTimeline
            requestType="App\Modules\Reservation\Models\Reservation"
            requestId={historyModalId}
          />
        </Modal>
      )}
    </div>
  )
}
