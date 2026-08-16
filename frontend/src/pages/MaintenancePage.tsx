import { useEffect, useState, useRef } from 'react'
import { Wrench, Plus } from 'lucide-react'
import { Badge, Button, EmptyState, Input, Modal, Spinner, Table, type Column } from '@/components/ui'
import { maintenanceService, type CreateMaintenancePayload, type UpdateMaintenancePayload } from '@/services/maintenanceService'
import { assetService } from '@/services/assetService'
import type { MaintenanceRequest } from '@/types'
import { maintenanceStatusTone } from '@/utils/statusTone'
import { maintenanceStatusLabel } from '@/utils/displayLabels'
import { notifyDataChanged } from '@/utils/dataRefresh'

/* ── Design tokens ── */
const T = {
  text:       '#0F172A',
  textMid:    '#475569',
  textMuted:  '#94A3B8',
  border:     '#E2E8F0',
  borderLight:'#F1F5F9',
  white:      '#FFFFFF',
  bg:         '#F8FAFC',
  accent:     '#003DA5',
  accentBg:   '#EFF6FF',
  amberBg:    '#FFFBEB',
  amberText:  '#B45309',
  surface:    '#F1F5F9',
  blue:       '#003DA5',
  yellow:     '#FFD400',
  red:        '#E31C23',
}

/* ── Section card with PSA tri-color accent ── */
function Section({
  icon, iconBg, iconColor, title, subtitle, children,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {/* PSA tri-color top accent */}
      <div style={{ height: 4, display: 'flex' }}>
        <div style={{ flex: 1, background: T.blue }} />
        <div style={{ flex: 1, background: T.yellow }} />
        <div style={{ flex: 1, background: T.red }} />
      </div>

      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: subtitle ? `1px solid ${T.borderLight}` : 'none',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3, lineHeight: 1.4 }}>{subtitle}</div>}
        </div>
        <div style={{
          display: 'grid', width: 40, height: 40, placeItems: 'center',
          borderRadius: 12, background: iconBg, flexShrink: 0,
        }}>
          <span style={{ color: iconColor, display: 'flex' }}>{icon}</span>
        </div>
      </div>

      {/* Section body */}
      <div style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  )
}

const LABEL_CLS = 'mb-1.5 block text-[13px] font-medium text-[#1F2937]'
const SELECT_CLS =
  'w-full h-11 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#1F2937] ' +
  'shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors duration-200 ' +
  'focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15'

type MaintenanceFormStatus = CreateMaintenancePayload['status']
type AssetSearchResult = {
  id: number
  asset_number: string
  property_number?: string | null
  name: string
  identifiers?: Array<{ identifier_value: string }>
}

export function MaintenancePage() {
  const [rows,           setRows]           = useState<MaintenanceRequest[]>([])
  const [loading,        setLoading]        = useState(true)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null)
  const [saving,         setSaving]         = useState(false)
  const [message,        setMessage]        = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState<CreateMaintenancePayload>({
    asset_id: 0, type: 'preventive', status: 'scheduled', scheduled_date: '', description: '',
  })

  // Asset search/select state for the modal
  const [assetSearchTerm, setAssetSearchTerm] = useState('')
  const [assetSearchResults, setAssetSearchResults] = useState<AssetSearchResult[]>([])
  const [assetSearchLoading, setAssetSearchLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<{ id: number; label: string } | null>(null)
  const searchTimer = useRef<number | null>(null)

  const loadMaintenance = async () => {
    setLoading(true)
    try {
      const result = await maintenanceService.list()
      setRows(result.items)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load maintenance records.' })
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadMaintenance() }, [])

  const handleCreate = () => {
    setEditingRequest(null)
    setFormData({ asset_id: 0, type: 'preventive', status: 'scheduled', scheduled_date: '', description: '' })
    setSelectedAsset(null)
    setAssetSearchTerm('')
    setModalOpen(true)
  }

  const handleEdit = (r: MaintenanceRequest) => {
    setEditingRequest(r)
    // Preserve the linked asset if present
    setFormData({ asset_id: r.asset_id ?? 0, type: 'preventive', status: 'scheduled', scheduled_date: r.scheduled_at ?? r.scheduled_date ?? '', description: r.description })
    if (r.asset_id) {
      setSelectedAsset({ id: r.asset_id, label: `${r.asset_name}${r.asset_id ? ' · #' + r.asset_id : ''}` })
    } else {
      setSelectedAsset(null)
    }
    setAssetSearchTerm('')
    setModalOpen(true)
  }

  const handleDelete = async (r: MaintenanceRequest) => {
    if (!confirm(`Delete maintenance record for ${r.asset_name}?`)) return
    try {
      await maintenanceService.delete(r.id)
      setMessage({ type: 'success', text: 'Maintenance request deleted.' })
      notifyDataChanged('maintenance')
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true); setMessage(null)
    try {
      if (editingRequest) { await maintenanceService.update(editingRequest.id, formData as UpdateMaintenancePayload); setMessage({ type: 'success', text: 'Maintenance request updated.' }) }
      else                { await maintenanceService.create(formData);                                                 setMessage({ type: 'success', text: 'Maintenance request created.' }) }
      setModalOpen(false)
      notifyDataChanged('maintenance')
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to save maintenance details.' })
    } finally { setSaving(false) }
  }

  const handleComplete = async (id: number) => {
    if (!confirm('Mark this maintenance as complete?')) return
    try {
      await maintenanceService.complete(id)
      setMessage({ type: 'success', text: 'Maintenance completed.' })
      notifyDataChanged('maintenance')
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to complete maintenance.' })
    }
  }

  const handleCancel = async (r: MaintenanceRequest) => {
    if (!confirm(`Cancel maintenance for ${r.asset_name}?`)) return
    try {
      await maintenanceService.update(r.id, { status: 'cancelled' } as UpdateMaintenancePayload)
      setMessage({ type: 'success', text: 'Maintenance cancelled.' })
      notifyDataChanged('maintenance')
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to cancel maintenance.' })
    }
  }

  const columns: Column<MaintenanceRequest>[] = [
    { key: 'asset_name',  header: 'Asset',       render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-[#6B7280]">{r.description}</span> },
    { key: 'status',      header: 'Status',      render: (r) => <Badge tone={maintenanceStatusTone(r.status)}>{maintenanceStatusLabel(r.status)}</Badge> },
    { key: 'scheduled_at',header: 'Scheduled',   render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.scheduled_at}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {r.status === 'scheduled' && (
            <>
              <Button size="sm" variant="success" onClick={() => handleComplete(r.id)}>Complete</Button>
              <Button size="sm" variant="danger"  onClick={() => handleCancel(r)}>Cancel</Button>
            </>
          )}
          <Button size="sm" variant="secondary" onClick={() => handleEdit(r)}>Edit</Button>
          <Button size="sm" variant="danger"    onClick={() => handleDelete(r)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{
          margin: 0,
          fontSize: 26,
          fontWeight: 800,
          color: T.text,
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        }}>
          Maintenance
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: T.textMuted, lineHeight: 1.4 }}>
          Track asset repairs, inspections, and maintenance history
        </p>
      </div>

      {/* Alert message */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 12,
          background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          color: message.type === 'success' ? '#166534' : '#991B1B',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 16, lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MAINTENANCE RECORDS
      ════════════════════════════════════════════════════════ */}
      <Section
        icon={<Wrench size={20} />}
        iconBg={T.accentBg}
        iconColor={T.accent}
        title="Maintenance Records"
        subtitle="View and manage all maintenance requests"
      >
        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button onClick={handleCreate}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Report a Problem
          </Button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No maintenance records found"
            description="Report a problem or schedule maintenance when an asset needs attention."
          />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
          />
        )}
      </Section>

      {/* ════════════════════════════════════════════════════════
          MODAL
      ════════════════════════════════════════════════════════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRequest ? 'Edit Maintenance' : 'Report a Problem'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : editingRequest ? 'Save Changes' : 'Create Request'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Asset search/select - supports name, asset_number, property number, identifiers (serial) */}
          <div style={{ position: 'relative' }}>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1F2937]">Asset</label>
            {selectedAsset ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <input className="w-full h-11 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#1F2937]" value={selectedAsset.label} readOnly />
                </div>
                <div>
                  <Button variant="secondary" size="sm" onClick={() => { setSelectedAsset(null); setFormData({ ...formData, asset_id: 0 }) }}>Change</Button>
                </div>
              </div>
            ) : (
              <>
                <input
                  className="w-full h-11 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#1F2937]"
                  value={assetSearchTerm}
                  placeholder="Search by name, asset number, property number, or serial"
                  onChange={(e) => {
                    const v = e.target.value
                    setAssetSearchTerm(v)
                    // debounce
                    if (searchTimer.current) window.clearTimeout(searchTimer.current)
                    searchTimer.current = window.setTimeout(async () => {
                      if (!v || v.trim().length === 0) { setAssetSearchResults([]); return }
                      setAssetSearchLoading(true)
                      try {
                        const res = await assetService.list({ per_page: 8, search: v })
                        setAssetSearchResults(res.items.map(i => ({ id: i.id, asset_number: i.asset_number, property_number: i.property_number, name: i.name, identifiers: i.identifiers })))
                      } catch (_e) {
                        setAssetSearchResults([])
                      } finally { setAssetSearchLoading(false) }
                    }, 250)
                  }}
                />
                {assetSearchLoading && <div style={{ marginTop: 8 }}><Spinner /></div>}
                {assetSearchResults.length > 0 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '56px', zIndex: 60, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    {assetSearchResults.map(a => (
                      <button key={a.id} type="button" onClick={() => {
                        // select
                        setSelectedAsset({ id: a.id, label: `${a.name} · ${a.asset_number}${a.property_number ? ' · ' + a.property_number : ''}` })
                        setFormData({ ...formData, asset_id: a.id })
                        setAssetSearchResults([])
                        setAssetSearchTerm('')
                      }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#1F2937' }}>{a.name}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{a.asset_number}{a.property_number ? ` · ${a.property_number}` : ''}{a.identifiers && a.identifiers.length ? ` · ${a.identifiers.map((id) => id.identifier_value).join(', ')}` : ''}</div>
                        </div>
                        <div style={{ color: '#94A3B8', fontSize: 12 }}>Select</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <label className={LABEL_CLS}>Type</label>
              <select className={SELECT_CLS} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'corrective' | 'preventive' })}>
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Status</label>
              <select className={SELECT_CLS} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceFormStatus })}>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <Input label="Scheduled Date" type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })} />
          <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
