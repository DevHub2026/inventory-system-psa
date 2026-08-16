import { useEffect, useState, useRef, useMemo } from 'react'
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Activity,
  Calendar,
  AlertTriangle,
  Edit,
  Trash2,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import { Alert, Badge, Button, EmptyState, Input, Modal, Spinner } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { maintenanceService, type CreateMaintenancePayload, type UpdateMaintenancePayload } from '@/services/maintenanceService'
import { assetService } from '@/services/assetService'
import type { MaintenanceRequest } from '@/types'
import { maintenanceStatusTone } from '@/utils/statusTone'
import { maintenanceStatusLabel } from '@/utils/displayLabels'
import { notifyDataChanged } from '@/utils/dataRefresh'

export function MaintenancePage() {
  const [rows,           setRows]           = useState<MaintenanceRequest[]>([])
  const [loading,        setLoading]        = useState(true)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null)
  const [saving,         setSaving]         = useState(false)
  const [message,        setMessage]        = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'preventive' | 'corrective'>('all')

  const [formData, setFormData] = useState<CreateMaintenancePayload>({
    asset_id: 0,
    type: 'corrective',
    status: 'scheduled',
    scheduled_date: new Date().toISOString().split('T')[0],
    description: '',
    cost: undefined,
  })

  // Asset search & selection
  const [assetSearchTerm, setAssetSearchTerm] = useState('')
  const [assetSearchResults, setAssetSearchResults] = useState<Array<{ id: number; asset_number: string; property_number?: string | null; name: string; identifiers?: any[] }>>([])
  const [assetSearchLoading, setAssetSearchLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<{ id: number; label: string; tag?: string; propertyNumber?: string } | null>(null)
  const searchTimer = useRef<number | null>(null)

  const loadMaintenance = async () => {
    setLoading(true)
    try {
      const result = await maintenanceService.list()
      setRows(result.items || [])
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load maintenance records.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMaintenance()
  }, [])

  // Filtered maintenance list
  const filteredRows = useMemo(() => {
    let list = rows
    if (activeTab !== 'all') {
      list = list.filter((r) => r.status === activeTab)
    }
    if (typeFilter !== 'all') {
      list = list.filter((r) => r.type === typeFilter)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      list = list.filter((r) =>
        (r.asset_name && r.asset_name.toLowerCase().includes(term)) ||
        (r.description && r.description.toLowerCase().includes(term))
      )
    }
    return list
  }, [rows, activeTab, typeFilter, searchTerm])

  // Summary counts
  const stats = useMemo(() => {
    const total = rows.length
    const scheduled = rows.filter((r) => r.status === 'scheduled').length
    const inProgress = rows.filter((r) => r.status === 'in_progress').length
    const completed = rows.filter((r) => r.status === 'completed').length
    return { total, scheduled, inProgress, completed }
  }, [rows])

  const handleCreate = () => {
    setEditingRequest(null)
    setFormData({
      asset_id: 0,
      type: 'corrective',
      status: 'scheduled',
      scheduled_date: new Date().toISOString().split('T')[0],
      description: '',
      cost: undefined,
    })
    setSelectedAsset(null)
    setAssetSearchTerm('')
    setModalOpen(true)
  }

  const handleEdit = (r: MaintenanceRequest) => {
    setEditingRequest(r)
    setFormData({
      asset_id: r.asset_id ?? 0,
      type: (r.type as 'preventive' | 'corrective') || 'corrective',
      status: r.status,
      scheduled_date: r.scheduled_at ?? r.scheduled_date ?? '',
      description: r.description,
      cost: r.cost ?? undefined,
    })
    if (r.asset_id) {
      setSelectedAsset({
        id: r.asset_id,
        label: r.asset_name,
        tag: `Asset #${r.asset_id}`,
      })
    } else {
      setSelectedAsset(null)
    }
    setAssetSearchTerm('')
    setModalOpen(true)
  }

  const handleDelete = async (r: MaintenanceRequest) => {
    if (!confirm(`Delete maintenance record for ${r.asset_name}? This action cannot be undone.`)) return
    try {
      await maintenanceService.delete(r.id)
      setMessage({ type: 'success', text: `Maintenance record for "${r.asset_name}" has been deleted.` })
      notifyDataChanged('maintenance')
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete maintenance record.' })
    }
  }

  const handleSubmit = async () => {
    if (!formData.asset_id) {
      setMessage({ type: 'error', text: 'Please select an asset to service or repair.' })
      return
    }
    if (!formData.description?.trim()) {
      setMessage({ type: 'error', text: 'Please provide a description of the problem or maintenance task.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      if (editingRequest) {
        await maintenanceService.update(editingRequest.id, formData as UpdateMaintenancePayload)
        setMessage({ type: 'success', text: 'Maintenance record updated successfully.' })
      } else {
        await maintenanceService.create(formData)
        setMessage({ type: 'success', text: 'Maintenance request created successfully.' })
      }
      setModalOpen(false)
      notifyDataChanged('maintenance')
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to save maintenance details.' })
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (id: number) => {
    if (!confirm('Mark this maintenance work order as completed?')) return
    try {
      await maintenanceService.complete(id)
      setMessage({ type: 'success', text: 'Maintenance work order marked as complete.' })
      notifyDataChanged('maintenance')
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to complete maintenance.' })
    }
  }

  const handleCancel = async (r: MaintenanceRequest) => {
    if (!confirm(`Cancel maintenance request for ${r.asset_name}?`)) return
    try {
      await maintenanceService.update(r.id, { status: 'cancelled' } as UpdateMaintenancePayload)
      setMessage({ type: 'success', text: 'Maintenance request has been cancelled.' })
      notifyDataChanged('maintenance')
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to cancel maintenance.' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* ── Page Header ── */}
      <PageHeader
        title="Maintenance & Repairs"
        subtitle="Track equipment repairs, schedule routine servicing, and log maintenance work orders."
        actions={
          <Button
            variant="primary"
            onClick={handleCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              height: 40,
              paddingInline: 18,
              fontWeight: 700,
              fontSize: 13.5,
              background: '#0B3D91',
            }}
          >
            <Plus size={16} />
            <span>Report a Problem</span>
          </Button>
        }
      />

      {/* Alert message */}
      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ── Summary Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
      }}>
        {/* Total */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#EFF6FF',
            color: '#0B3D91',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Wrench size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Total Requests
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Scheduled */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#FFFBEB',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Scheduled / Pending
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>
              {stats.scheduled}
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#F0F9FF',
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              In Progress
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0284C7', lineHeight: 1.1 }}>
              {stats.inProgress}
            </div>
          </div>
        </div>

        {/* Completed */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#F0FDF4',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Completed
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A', lineHeight: 1.1 }}>
              {stats.completed}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Maintenance Records Section ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
      }}>
        {/* Status Tab Navigation */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '4px 8px',
          gap: 4,
        }}>
          {[
            { id: 'all',         label: 'All Work Orders', count: rows.length },
            { id: 'scheduled',   label: 'Scheduled',       count: rows.filter((r) => r.status === 'scheduled').length },
            { id: 'in_progress', label: 'In Progress',     count: rows.filter((r) => r.status === 'in_progress').length },
            { id: 'completed',   label: 'Completed',       count: rows.filter((r) => r.status === 'completed').length },
            { id: 'cancelled',   label: 'Cancelled',       count: rows.filter((r) => r.status === 'cancelled').length },
          ].map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#0B3D91' : '#64748B',
                  background: active ? '#FFFFFF' : 'transparent',
                  borderRadius: 10,
                  border: active ? '1px solid #CBD5E1' : '1px solid transparent',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  padding: '1px 7px',
                  borderRadius: 999,
                  background: active ? '#EFF6FF' : '#E2E8F0',
                  color: active ? '#0B3D91' : '#475569',
                }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Toolbar: Search & Type Filter */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 380 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by asset name or problem description..."
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 34,
                paddingRight: 14,
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: 13,
                color: '#0F172A',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: 13,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <option value="all">All Service Types</option>
              <option value="corrective">Corrective (Repairs)</option>
              <option value="preventive">Preventive (Routine)</option>
            </select>
          </div>
        </div>

        {/* Maintenance Records Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Spinner label="Loading maintenance history..." />
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: '64px 20px' }}>
            <EmptyState
              title="No maintenance records found"
              description="Click 'Report a Problem' to log equipment repairs, damage inspections, or scheduled servicing."
              action={
                <Button variant="primary" size="sm" onClick={handleCreate} style={{ marginTop: 12 }}>
                  <Plus size={14} style={{ marginRight: 6 }} />
                  Report a Problem
                </Button>
              }
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Item</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>Service Type</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description / Issue</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>Scheduled Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 120 }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Asset Name */}
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>
                        {r.asset_name}
                      </div>
                      {r.asset_id && (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>
                          ID: #{r.asset_id}
                        </div>
                      )}
                    </td>

                    {/* Service Type */}
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 6,
                        background: r.type === 'preventive' ? '#EFF6FF' : '#FFFBEB',
                        color: r.type === 'preventive' ? '#1E40AF' : '#B45309',
                        border: `1px solid ${r.type === 'preventive' ? '#BFDBFE' : '#FDE68A'}`,
                      }}>
                        {r.type === 'preventive' ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                        <span>{r.type === 'preventive' ? 'Preventive' : 'Corrective'}</span>
                      </span>
                    </td>

                    {/* Description */}
                    <td style={{ padding: '12px 18px', color: '#334155', maxWidth: 300 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.description || ''}>
                        {r.description || <span style={{ color: '#CBD5E1' }}>No description provided</span>}
                      </span>
                    </td>

                    {/* Scheduled Date */}
                    <td style={{ padding: '12px 18px', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                        <Calendar size={13} style={{ color: '#94A3B8' }} />
                        <span>{r.scheduled_at || r.scheduled_date || '—'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 18px' }}>
                      <Badge tone={maintenanceStatusTone(r.status)}>
                        {maintenanceStatusLabel(r.status)}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {r.status === 'scheduled' && (
                          <>
                            <button
                              type="button"
                              title="Mark Complete"
                              onClick={() => handleComplete(r.id)}
                              style={{
                                padding: '5px 9px',
                                borderRadius: 6,
                                border: '1px solid #BBF7D0',
                                background: '#F0FDF4',
                                color: '#16A34A',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <CheckCircle2 size={12} />
                              <span>Complete</span>
                            </button>
                            <button
                              type="button"
                              title="Cancel Request"
                              onClick={() => handleCancel(r)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: 6,
                                border: '1px solid #E2E8F0',
                                background: '#FFFFFF',
                                color: '#64748B',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          title="Edit Request"
                          onClick={() => handleEdit(r)}
                          style={{
                            padding: '5px 9px',
                            borderRadius: 6,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: '#0B3D91',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          title="Delete Request"
                          onClick={() => handleDelete(r)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 6,
                            border: '1px solid #FEE2E2',
                            background: '#FFF5F5',
                            color: '#DC2626',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          REPORT A PROBLEM / SCHEDULE MAINTENANCE MODAL (REDESIGNED)
      ════════════════════════════════════════════════════════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRequest ? 'Edit Maintenance Work Order' : 'Report a Problem / Schedule Service'}
        maxWidth={620}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={saving || !formData.asset_id}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Wrench size={14} />
              <span>{saving ? 'Saving...' : editingRequest ? 'Save Changes' : 'Submit Maintenance Request'}</span>
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Asset Selection Section */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Asset Requiring Service <span style={{ color: '#EF4444' }}>*</span>
            </label>

            {selectedAsset ? (
              <div style={{
                borderRadius: 10,
                border: '1.5px solid #BFDBFE',
                background: '#EFF6FF',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: '#0B3D91',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Tag size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                      {selectedAsset.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#1E40AF', marginTop: 2 }}>
                      {selectedAsset.tag} {selectedAsset.propertyNumber ? `• Property #${selectedAsset.propertyNumber}` : ''}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedAsset(null)
                    setFormData({ ...formData, asset_id: 0 })
                  }}
                  style={{ height: 32, fontSize: 12 }}
                >
                  Change Asset
                </Button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={15}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94A3B8',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={assetSearchTerm}
                    placeholder="Search by asset name, tag number, or serial..."
                    onChange={(e) => {
                      const v = e.target.value
                      setAssetSearchTerm(v)
                      if (searchTimer.current) window.clearTimeout(searchTimer.current)
                      searchTimer.current = window.setTimeout(async () => {
                        if (!v || v.trim().length === 0) {
                          setAssetSearchResults([])
                          return
                        }
                        setAssetSearchLoading(true)
                        try {
                          const res = await assetService.list({ per_page: 8, search: v })
                          setAssetSearchResults(
                            res.items.map((i) => ({
                              id: i.id,
                              asset_number: i.asset_number,
                              property_number: i.property_number,
                              name: i.name,
                              identifiers: i.identifiers,
                            }))
                          )
                        } catch {
                          setAssetSearchResults([])
                        } finally {
                          setAssetSearchLoading(false)
                        }
                      }, 200)
                    }}
                    style={{
                      width: '100%',
                      height: 42,
                      paddingLeft: 36,
                      paddingRight: 14,
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: 13.5,
                      color: '#0F172A',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {assetSearchLoading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                    <Spinner label="Searching assets..." />
                  </div>
                )}

                {assetSearchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '46px',
                    zIndex: 60,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 10,
                    boxShadow: '0 10px 28px rgba(15,23,42,0.12)',
                    overflow: 'hidden',
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}>
                    {assetSearchResults.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setSelectedAsset({
                            id: a.id,
                            label: a.name,
                            tag: a.asset_number,
                            propertyNumber: a.property_number ?? undefined,
                          })
                          setFormData({ ...formData, asset_id: a.id })
                          setAssetSearchResults([])
                          setAssetSearchTerm('')
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          width: '100%',
                          border: 'none',
                          borderBottom: '1px solid #F1F5F9',
                          background: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                            {a.name}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                            Tag: <strong>{a.asset_number}</strong> {a.property_number ? `• Prop: ${a.property_number}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0B3D91' }}>
                          Select →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Maintenance Type & Initial Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Maintenance Type <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'corrective' | 'preventive' })}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '0 14px',
                  fontSize: 13.5,
                  color: '#0F172A',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              >
                <option value="corrective">Corrective (Repair / Issue Fix)</option>
                <option value="preventive">Preventive (Routine Servicing)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  padding: '0 14px',
                  fontSize: 13.5,
                  color: '#0F172A',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Scheduled Date & Cost */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Scheduled Service Date
              </label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                style={{
                  height: 42,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: 13.5,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Estimated Cost <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional, ₱)</span>
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.cost ?? ''}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value ? Number(e.target.value) : undefined })}
                style={{
                  height: 42,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: 13.5,
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Problem Symptoms / Work Order Description <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              rows={4}
              value={formData.description ?? ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue, defect symptoms, diagnostic findings, or routine maintenance requirements..."
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                padding: '12px 14px',
                fontSize: 13.5,
                color: '#0F172A',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}