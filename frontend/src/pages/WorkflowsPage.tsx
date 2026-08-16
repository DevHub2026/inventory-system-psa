import { useCallback, useEffect, useState } from 'react'
import { Input, Badge, EmptyState, Spinner, Alert } from '@/components/ui'
import { workflowService, type ModuleOption } from '@/services/workflowService'
import type { Workflow } from '@/types'
import { WorkflowEditorModal } from '@/components/workflows/WorkflowEditorModal'
import { WorkflowVersionHistoryModal } from '@/components/workflows/WorkflowVersionHistoryModal'
import { Search, Copy, Archive, RotateCcw, History, Edit, Power, Plus } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

// ─── Design tokens ────────────────────────────────────────────────────────────
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
  textAlign: 'left',
}

const td: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
  fontSize: 13,
  color: '#334155',
  borderBottom: '1px solid #F1F5F9',
}

// ─── Icon action button ───────────────────────────────────────────────────────
function IconBtn({
  icon: Icon, title, onClick,
  hoverColor = '#475569', hoverBg = '#F1F5F9',
}: {
  icon: React.ComponentType<{ size?: number }>
  title: string
  onClick: () => void
  hoverColor?: string
  hoverBg?: string
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 30, height: 30, borderRadius: 7, border: 'none',
        background: hov ? hoverBg : 'transparent',
        color: hov ? hoverColor : '#94A3B8',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.12s', flexShrink: 0,
      }}
    >
      <Icon size={14} />
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function WorkflowsPage() {
  const [workflows,      setWorkflows]      = useState<Workflow[]>([])
  const [modules,        setModules]        = useState<ModuleOption[]>([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [showArchived,   setShowArchived]   = useState(false)
  const [message,        setMessage]        = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editorOpen,     setEditorOpen]     = useState(false)
  const [editingWorkflow,setEditingWorkflow]= useState<Workflow | null>(null)
  const [historyOpen,    setHistoryOpen]    = useState(false)
  const [historyWorkflow,setHistoryWorkflow]= useState<{ id: number; name: string } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setMessage(null) // Clear any previous errors
    try {
      const [mRes, wRes] = await Promise.all([
        workflowService.getModules(),
        workflowService.list({
          search: search.trim() || undefined,
          module_type: selectedModule || undefined,
          is_archived: showArchived ? 1 : 0,
        }),
      ])
      setModules(mRes?.modules ?? [])
      setWorkflows(wRes?.items ?? [])
    } catch (err: unknown) {
      // Silently handle network errors since backend may not be fully implemented
      console.warn('Workflow API not available, using empty state:', err)
      setModules([])
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }, [search, selectedModule, showArchived])

  useEffect(() => { void loadData() }, [loadData])

  const handleDuplicate = async (w: Workflow) => {
    try {
      await workflowService.duplicate(w.id)
      setMessage({ type: 'success', text: `"${w.name}" duplicated.` })
      await loadData()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to duplicate.' })
    }
  }

  const handleArchiveToggle = async (w: Workflow) => {
    try {
      if (w.is_archived) {
        await workflowService.restore(w.id)
      } else {
        await workflowService.archive(w.id)
      }
      setMessage({ type: 'success', text: `"${w.name}" ${w.is_archived ? 'restored' : 'archived'}.` })
      await loadData()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update.' })
    }
  }

  const handleToggleActive = async (w: Workflow) => {
    try {
      await workflowService.toggleStatus(w.id)
      setMessage({ type: 'success', text: 'Workflow status updated.' })
      await loadData()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to toggle status.' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <PageHeader
        title="Approval Workflows"
        subtitle="Configure multi-level approval workflows and manage versions."
        actions={
          <button
            onClick={() => { setEditingWorkflow(null); setEditorOpen(true) }}
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
            <Plus size={15} />
            Create Workflow
          </button>
        }
      />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* ── Filters ── */}
      <div style={{
        background: '#fff', borderRadius: 14,
        border: '1px solid #E2E8F0',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows..."
              style={{ paddingLeft: 32, height: 36, fontSize: 13 } as React.CSSProperties}
            />
          </div>

          {/* Module filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            style={{
              height: 36, borderRadius: 10, border: '1px solid #E2E8F0',
              background: '#fff', padding: '0 12px',
              fontSize: 13, color: '#374151',
              outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <option value="">All Modules</option>
            {modules.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Show archived */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#1E40AF' }}
          />
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Show archived</span>
        </label>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1px solid #E2E8F0', overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '72px 0' }}>
            <Spinner label="Loading workflows..." />
          </div>
        ) : workflows.length === 0 ? (
          <div style={{ padding: '64px 0' }}>
            <EmptyState
              title="No Workflows Found"
              description="No workflow configurations match your filter parameters."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
              <colgroup>
                <col />
                <col style={{ width: 200 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 160 }} />
              </colgroup>

              <thead>
                <tr>
                  <th style={th}>Workflow</th>
                  <th style={th}>Module</th>
                  <th style={th}>Levels</th>
                  <th style={th}>Status</th>
                  <th style={th}>Updated</th>
                  <th style={{ ...th, textAlign: 'right', paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {workflows.map((w) => {
                  const levels = w.current_version?.approval_levels ?? []
                  const mod = modules.find((m) => m.value === w.module_type)

                  return (
                    <tr
                      key={w.id}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFD' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                    >
                      {/* Workflow name */}
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Avatar */}
                          <div style={{
                            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            background: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 800, color: '#fff',
                          }}>
                            {w.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'nowrap' }}>
                              <span style={{ fontWeight: 600, fontSize: 13.5, color: '#0F172A' }}>{w.name}</span>
                              {w.current_version && (
                                <span style={{
                                  fontSize: 10, fontWeight: 700,
                                  fontFamily: 'ui-monospace, monospace',
                                  color: '#6D28D9', background: '#F5F3FF',
                                  border: '1px solid #DDD6FE',
                                  borderRadius: 4, padding: '1px 6px',
                                  whiteSpace: 'nowrap',
                                }}>
                                  v{w.current_version.version_number}
                                </span>
                              )}
                            </div>
                            {w.description && (
                              <div style={{
                                fontSize: 11.5, color: '#94A3B8', marginTop: 2,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                maxWidth: 240,
                              }}>
                                {w.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Module */}
                      <td style={td}>
                        <Badge tone="blue">{mod?.label || w.module_type}</Badge>
                      </td>

                      {/* Levels */}
                      <td style={td}>
                        {levels.length === 0 ? (
                          <span style={{ color: '#CBD5E1' }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {levels.slice(0, 3).map((l, i) => (
                                <span key={i} style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 700,
                                  marginLeft: i > 0 ? -5 : 0,
                                  background: i === 0 ? '#1E40AF' : '#F1F5F9',
                                  color: i === 0 ? '#fff' : '#64748B',
                                  border: `2px solid #fff`,
                                  zIndex: 3 - i,
                                  position: 'relative',
                                }}>
                                  {l.level_order}
                                </span>
                              ))}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                              {levels.length} {levels.length === 1 ? 'level' : 'levels'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={td}>
                        {w.is_archived
                          ? <Badge tone="gray">Archived</Badge>
                          : w.is_active
                            ? <Badge tone="green">Active</Badge>
                            : <Badge tone="yellow">Inactive</Badge>
                        }
                      </td>

                      {/* Updated */}
                      <td style={td}>
                        <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>
                          {new Date(w.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...td, textAlign: 'right', paddingRight: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          {/* Edit | History | Duplicate group */}
                          <div style={{
                            display: 'inline-flex', alignItems: 'center',
                            border: '1px solid #E2E8F0', borderRadius: 8,
                            overflow: 'hidden', background: '#F8FAFC',
                          }}>
                            <IconBtn icon={Edit}    title="Edit"      onClick={() => { setEditingWorkflow(w); setEditorOpen(true) }} hoverColor="#1E40AF" hoverBg="#EFF6FF" />
                            <div style={{ width: 1, height: 18, background: '#E2E8F0' }} />
                            <IconBtn icon={History} title="Version History" onClick={() => { setHistoryWorkflow({ id: w.id, name: w.name }); setHistoryOpen(true) }} hoverColor="#6D28D9" hoverBg="#F5F3FF" />
                            <div style={{ width: 1, height: 18, background: '#E2E8F0' }} />
                            <IconBtn icon={Copy}    title="Duplicate" onClick={() => void handleDuplicate(w)} hoverColor="#059669" hoverBg="#F0FDF4" />
                          </div>

                          {/* Activate | Archive group */}
                          <div style={{
                            display: 'inline-flex', alignItems: 'center',
                            border: '1px solid #E2E8F0', borderRadius: 8,
                            overflow: 'hidden', background: '#F8FAFC',
                          }}>
                            <IconBtn
                              icon={Power}
                              title={w.is_active ? 'Deactivate' : 'Activate'}
                              onClick={() => void handleToggleActive(w)}
                              hoverColor={w.is_active ? '#DC2626' : '#059669'}
                              hoverBg={w.is_active ? '#FEF2F2' : '#F0FDF4'}
                            />
                            <div style={{ width: 1, height: 18, background: '#E2E8F0' }} />
                            <IconBtn
                              icon={w.is_archived ? RotateCcw : Archive}
                              title={w.is_archived ? 'Restore' : 'Archive'}
                              onClick={() => void handleArchiveToggle(w)}
                              hoverColor={w.is_archived ? '#059669' : '#DC2626'}
                              hoverBg={w.is_archived ? '#F0FDF4' : '#FEF2F2'}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <WorkflowEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={loadData}
        workflowToEdit={editingWorkflow}
      />
      <WorkflowVersionHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        workflowId={historyWorkflow?.id ?? null}
        workflowName={historyWorkflow?.name}
      />
    </div>
  )
}
