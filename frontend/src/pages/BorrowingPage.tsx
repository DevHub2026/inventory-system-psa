import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Spinner } from '@/components/ui'
import { ReceiptModal, type ReceiptRecord } from '@/components/ReceiptModal'
import { borrowingService } from '@/services/borrowingService'
import type { Borrowing } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel } from '@/utils/displayLabels'
import { PageHeader } from '@/components/PageHeader'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { formatDate, formatTime } from '@/utils/dateFormat'

// ─── helpers ──────────────────────────────────────────────────────────────────

function DateTimeCell({ iso }: { iso?: string | null }) {
  if (!iso) return <span style={{ color: '#CBD5E1' }}>—</span>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontWeight: 500, color: '#0F172A', fontSize: 13 }}>{formatDate(iso)}</span>
      <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{formatTime(iso)}</span>
    </div>
  )
}

function AssetCell({ name, identifier }: { name?: string; identifier?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{name ?? '—'}</span>
      {identifier && (
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 11,
          color: '#475569', background: '#F1F5F9',
          padding: '1px 6px', borderRadius: 4, display: 'inline-block', width: 'fit-content',
        }}>
          {identifier}
        </span>
      )}
    </div>
  )
}

function BorrowerCell({ name, id }: { name?: string; id?: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontWeight: 500, color: '#0F172A', fontSize: 13 }}>{name ?? '—'}</span>
      {id && <span style={{ fontSize: 11, color: '#94A3B8' }}>{id}</span>}
    </div>
  )
}

function DueDateCell({ iso, status }: { iso?: string | null; status: string }) {
  if (!iso) return <span style={{ color: '#CBD5E1' }}>—</span>

  const now = new Date()
  const due = new Date(iso)
  const isOverdue = status !== 'RETURNED' && due < now
  const isDueSoon = !isOverdue && status !== 'RETURNED' && (due.getTime() - now.getTime()) < 1000 * 60 * 60 * 48 // 48 h

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{
        fontWeight: 500, fontSize: 13,
        color: isOverdue ? '#DC2626' : isDueSoon ? '#D97706' : '#0F172A',
      }}>
        {formatDate(iso)}
      </span>
      {isOverdue && (
        <span style={{ fontSize: 10.5, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', borderRadius: 4, padding: '0px 5px', width: 'fit-content' }}>
          OVERDUE
        </span>
      )}
      {isDueSoon && (
        <span style={{ fontSize: 10.5, fontWeight: 600, color: '#D97706', background: '#FFFBEB', borderRadius: 4, padding: '0px 5px', width: 'fit-content' }}>
          DUE SOON
        </span>
      )}
    </div>
  )
}

// ─── table styles ─────────────────────────────────────────────────────────────

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

// ─── page ──────────────────────────────────────────────────────────────────────

export function BorrowingPage() {
  const [rows,    setRows]    = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null)

  const loadBorrowings = async () => {
    setLoading(true)
    try {
      const result = await borrowingService.list({ per_page: 100 })
      setRows(result.items)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load borrowed items.' })
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadBorrowings() }, [])

  useEffect(() => {
    const interval = setInterval(() => { void loadBorrowings() }, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'borrowings')) void loadBorrowings()
  }), [])

  const handleReturn = async (id: number) => {
    if (!confirm('Are you sure you want to return this item?')) return
    try {
      await borrowingService.returnAsset(id)
      setMessage({ type: 'success', text: 'Item returned successfully.' })
      notifyDataChanged('all')
      await loadBorrowings()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to return item.' })
    }
  }

  const openReceipt = (r: Borrowing) =>
    setReceipt({
      type: 'Borrowing',
      code: r.receipt_code ?? `PSA-BOR-${r.id}`,
      payload: r.receipt_payload ?? `PSA-BOR-${r.id}|${r.asset_number ?? r.asset_id}|${r.user_id}`,
      employee: r.employee_name,
      employeeId: r.employee_id,
      assetName: r.asset_name,
      assetNumber: r.asset_number,
      assetCode: r.asset_code,
      quantity: r.quantity,
      timestamp: r.created_at,
      borrowedAt: r.borrowed_at,
      returnedAt: r.returned_at,
      startDate: r.borrow_date,
      endDate: r.due_date,
      status: r.status,
      authorizedBy: r.authorized_by_name,
      authorizedAt: r.authorized_at,
      remarks: r.remarks,
    })

  // ── summary counts ──────────────────────────────────────────────────────────
  const active   = rows.filter(r => r.status === 'BORROWED' || r.status === 'ACTIVE').length
  const overdue  = rows.filter(r => r.status === 'OVERDUE').length
  const returned = rows.filter(r => r.status === 'RETURNED').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Borrowed Items" subtitle="View borrowed assets and process returns." />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* ── Summary chips ── */}
      {!loading && rows.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',    count: rows.length, bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
            { label: 'Active',   count: active,   bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
            { label: 'Overdue',  count: overdue,  bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
            { label: 'Returned', count: returned, bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
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
              title="No borrowed items found"
              description="Borrowed assets will appear here after a request is approved or an item is borrowed."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <colgroup>
                <col style={{ width: 80  }} />   {/* ID */}
                <col />                           {/* Asset (flex) */}
                <col style={{ width: 120 }} />   {/* Borrower */}
                <col style={{ width: 100 }} />   {/* Status */}
                <col style={{ width: 130 }} />   {/* Borrowed */}
                <col style={{ width: 130 }} />   {/* Due */}
                <col style={{ width: 130 }} />   {/* Returned */}
                <col style={{ width: 120 }} />   {/* Authorized by */}
                <col style={{ width: 120 }} />   {/* Actions */}
              </colgroup>

              <thead>
                <tr>
                  <th style={th}>ID</th>
                  <th style={th}>Asset</th>
                  <th style={th}>Borrower</th>
                  <th style={th}>Status</th>
                  <th style={th}>Borrowed</th>
                  <th style={th}>Due Date</th>
                  <th style={th}>Returned</th>
                  <th style={th}>Authorized By</th>
                  <th style={{ ...th, textAlign: 'right', paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => {
                  const canReturn = r.status === 'BORROWED' || r.status === 'ACTIVE' || r.status === 'OVERDUE'
                  return (
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

                      {/* Asset */}
                      <td style={td}>
                        <AssetCell name={r.asset_name} identifier={r.asset_number} />
                      </td>

                      {/* Borrower */}
                      <td style={td}>
                        <BorrowerCell name={r.employee_name} id={r.employee_id} />
                      </td>

                      {/* Status */}
                      <td style={td}>
                        <Badge tone={borrowingStatusTone(r.status)}>
                          {borrowingStatusLabel(r.status)}
                        </Badge>
                      </td>

                      {/* Borrowed date+time */}
                      <td style={td}>
                        <DateTimeCell iso={r.borrowed_at} />
                      </td>

                      {/* Due date */}
                      <td style={td}>
                        <DueDateCell iso={r.due_date} status={r.status} />
                      </td>

                      {/* Returned date+time */}
                      <td style={td}>
                        <DateTimeCell iso={r.returned_at} />
                      </td>

                      {/* Authorized by */}
                      <td style={td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span style={{ fontWeight: 500, fontSize: 13, color: '#0F172A' }}>
                            {r.authorized_by_name ?? '—'}
                          </span>
                          {r.authorized_at && (
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>
                              {formatDate(r.authorized_at)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ ...td, textAlign: 'right', paddingRight: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          {/* Receipt */}
                          <button
                            onClick={() => openReceipt(r)}
                            style={{
                              height: 28, paddingInline: 10, borderRadius: 6,
                              border: '1px solid #E2E8F0', background: '#F8FAFC',
                              color: '#374151', fontSize: 11.5, fontWeight: 600,
                              cursor: 'pointer', fontFamily: 'inherit',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              whiteSpace: 'nowrap',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#EEF2F7' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <polyline points="10,9 9,9 8,9"/>
                            </svg>
                            Receipt
                          </button>

                          {/* Return */}
                          {canReturn ? (
                            <button
                              onClick={() => handleReturn(r.id)}
                              style={{
                                height: 28, paddingInline: 10, borderRadius: 6,
                                border: 'none', background: '#1E40AF',
                                color: '#fff', fontSize: 11.5, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                whiteSpace: 'nowrap',
                                transition: 'background 0.1s',
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1D3FAB' }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1E40AF' }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 4 1 10 7 10"/>
                                <path d="M3.51 15a9 9 0 1 0 .49-3.17"/>
                              </svg>
                              Return
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: '#CBD5E1', paddingInline: 4 }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  )
}
