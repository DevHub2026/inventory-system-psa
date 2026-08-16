import { useEffect, useState } from 'react'
import { Modal, Button, Input, Alert, Spinner } from '@/components/ui'
import { workflowService, type WorkflowMetadata } from '@/services/workflowService'
import { userService } from '@/services/userService'
import { roleService, type Role } from '@/services/roleService'
import { setupService, type SetupRecord } from '@/services/setupService'
import type { Workflow, WorkflowApprovalLevel, WorkflowModuleType, WorkflowOptions, User } from '@/types'
import {
  Plus, Trash2, Copy, ArrowDown, ArrowUp, ArrowRight,
  ChevronDown, Sliders, Eye, Layers, Shield, User as UserIcon,
  CheckCircle2, XCircle, Check
} from 'lucide-react'

interface WorkflowEditorModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  workflowToEdit?: Workflow | null
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
}

const inputSelectStyle: React.CSSProperties = {
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
}

export function WorkflowEditorModal({ open, onClose, onSaved, workflowToEdit }: WorkflowEditorModalProps) {
  const [name, setName] = useState('')
  const [moduleType, setModuleType] = useState<WorkflowModuleType>('borrow_request')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [changeSummary, setChangeSummary] = useState('')
  const [showSummaryPrompt, setShowSummaryPrompt] = useState(false)
  const [options, setOptions] = useState<WorkflowOptions>({
    auto_approve_no_approver: true,
    skip_disabled_levels: true,
    allow_rejection_any_level: true,
    allow_request_cancellation: true,
    allow_requester_withdrawal: true,
    require_remarks_on_rejection: true,
    require_remarks_on_approval: false,
  })
  const [levels, setLevels] = useState<WorkflowApprovalLevel[]>([
    { level_order: 1, name: 'Property Verification', roles: ['Property Custodian'], user_ids: [], approval_type: 'any', is_enabled: true },
  ])
  const [meta, setMeta] = useState<WorkflowMetadata | null>(null)
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [offices, setOffices] = useState<SetupRecord[]>([])
  const [departments, setDepartments] = useState<SetupRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'levels' | 'options' | 'preview'>('levels')
  const [expandedLevelIdx, setExpandedLevelIdx] = useState<number>(0)

  const optionEntries: [string, string, string][] = [
    ['auto_approve_no_approver',   'Auto-Approve Without Approver',  'Auto-approves a stage if no active approvers or roles match the scope'],
    ['skip_disabled_levels',       'Skip Disabled Levels',           'Automatically bypasses disabled approval levels in the sequence'],
    ['allow_rejection_any_level',  'Rejection at Any Level',         'Any designated approver in any active tier can reject the request'],
    ['allow_request_cancellation', 'Allow Requester Cancellation',    'The submitting employee can cancel pending unapproved requests'],
    ['allow_requester_withdrawal', 'Allow Pre-Approval Withdrawal',  'Requester can retract their submission before a final decision is reached'],
    ['require_remarks_on_rejection','Mandatory Remarks on Rejection', 'Approver must provide justification when rejecting any request'],
    ['require_remarks_on_approval', 'Mandatory Remarks on Approval',  'Approver must enter explanatory remarks upon granting approval'],
  ]

  useEffect(() => {
    if (!open) return
    const load = async () => {
      setLoading(true)
      try {
        const [mRes, rRes, uRes, oRes, dRes] = await Promise.all([
          workflowService.getModules(),
          roleService.getRoles().then((r) => r.items).catch(() => []),
          userService.getUsers({ per_page: 100 }).then((r) => r.items).catch(() => []),
          setupService.list('offices').catch(() => []),
          setupService.list('departments').catch(() => []),
        ])
        setMeta(mRes)
        setAllRoles(rRes)
        setAllUsers(uRes)
        setOffices(oRes)
        setDepartments(dRes)
        if (workflowToEdit) {
          setName(workflowToEdit.name)
          setModuleType(workflowToEdit.module_type)
          setDescription(workflowToEdit.description || '')
          setIsActive(workflowToEdit.is_active)
          setOptions(workflowToEdit.options || mRes.default_options || {})
          if (workflowToEdit.current_version?.approval_levels?.length) {
            setLevels(workflowToEdit.current_version.approval_levels.map((l) => ({
              level_order: l.level_order,
              name: l.name,
              roles: l.roles || [],
              user_ids: l.user_ids || [],
              office_id: l.office_id || null,
              department_id: l.department_id || null,
              approval_type: l.approval_type || 'any',
              is_enabled: l.is_enabled ?? true,
            })))
          }
        } else {
          setName('')
          setModuleType('borrow_request')
          setDescription('')
          setIsActive(true)
          setOptions(mRes.default_options || {})
          setLevels([{ level_order: 1, name: 'Property Verification', roles: ['Property Custodian'], user_ids: [], approval_type: 'any', is_enabled: true }])
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load workflow data.')
      } finally { setLoading(false) }
    }
    void load()
  }, [open, workflowToEdit])

  const handleAddLevel = () => {
    const next = levels.length + 1
    const updated = [
      ...levels,
      {
        level_order: next,
        name: `Approval Level ${next}`,
        roles: ['Property Custodian'],
        user_ids: [],
        approval_type: 'any' as const,
        is_enabled: true
      }
    ]
    setLevels(updated)
    setExpandedLevelIdx(updated.length - 1)
  }

  const handleRemoveLevel = (i: number) => {
    if (levels.length <= 1) return
    setLevels(levels.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, level_order: idx + 1 })))
    if (expandedLevelIdx >= i && expandedLevelIdx > 0) setExpandedLevelIdx(expandedLevelIdx - 1)
  }

  const handleMoveLevel = (i: number, dir: 'up' | 'down') => {
    const ni = dir === 'up' ? i - 1 : i + 1
    if (ni < 0 || ni >= levels.length) return
    const clone = [...levels];
    [clone[i], clone[ni]] = [clone[ni], clone[i]]
    setLevels(clone.map((l, idx) => ({ ...l, level_order: idx + 1 })))
    setExpandedLevelIdx(ni)
  }

  const handleDuplicateLevel = (i: number) => {
    const clone = [...levels]
    clone.splice(i + 1, 0, { ...levels[i], name: `${levels[i].name} (Copy)` })
    setLevels(clone.map((l, idx) => ({ ...l, level_order: idx + 1 })))
    setExpandedLevelIdx(i + 1)
  }

  const updateLevel = (i: number, patch: Partial<WorkflowApprovalLevel>) => {
    const clone = [...levels]
    clone[i] = { ...clone[i], ...patch }
    setLevels(clone)
  }

  const toggleRoleInLevel = (levelIdx: number, roleName: string) => {
    const currentRoles = levels[levelIdx].roles || []
    const updatedRoles = currentRoles.includes(roleName)
      ? currentRoles.filter((r) => r !== roleName)
      : [...currentRoles, roleName]
    updateLevel(levelIdx, { roles: updatedRoles })
  }

  const toggleUserInLevel = (levelIdx: number, userId: number) => {
    const currentUsers = levels[levelIdx].user_ids || []
    const updatedUsers = currentUsers.includes(userId)
      ? currentUsers.filter((id) => id !== userId)
      : [...currentUsers, userId]
    updateLevel(levelIdx, { user_ids: updatedUsers })
  }

  const handleSaveSubmit = () => {
    if (!name.trim()) { setErrorMsg('Workflow name is required.'); return }
    if (levels.length === 0) { setErrorMsg('At least one approval level is required.'); return }
    if (workflowToEdit) setShowSummaryPrompt(true)
    else void performSave('')
  }

  const performSave = async (summary: string) => {
    setSaving(true)
    setErrorMsg(null)
    try {
      const payload = {
        name: name.trim(),
        module_type: moduleType,
        description: description.trim(),
        is_active: isActive,
        options,
        change_summary: summary || (workflowToEdit ? 'Updated workflow configuration' : 'Initial version created'),
        approval_levels: levels,
      }
      if (workflowToEdit) await workflowService.update(workflowToEdit.id, payload)
      else await workflowService.create(payload)
      setShowSummaryPrompt(false)
      onSaved()
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save workflow.')
    } finally { setSaving(false) }
  }

  const tabs = [
    { id: 'levels'  as const, icon: Layers,  label: 'Approval Levels', count: levels.length },
    { id: 'options' as const, icon: Sliders, label: 'Rules & Options' },
    { id: 'preview' as const, icon: Eye,     label: 'Sequence Preview' },
  ]

  const moduleLabels: Record<string, string> = {
    borrow_request: 'Borrow Request Flow',
    reissuance: 'Accountability Transfer Flow',
    damage_report: 'Damage & Incident Report Flow',
    lost_asset: 'Lost Asset Incident Flow',
    maintenance: 'Maintenance Work Order Flow',
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={workflowToEdit ? `Edit Workflow: ${workflowToEdit.name}` : 'New Approval Workflow'}
      maxWidth={940}
      footer={null}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {errorMsg && (
          <Alert tone="error" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Spinner label="Loading workflow parameters..." />
          </div>
        ) : (
          <>
            {/* ── Top Basic Info Header Form ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1.3fr',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
            }}>
              <div>
                <label style={fieldLabel}>
                  Workflow Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Borrow Request Flow"
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
                <label style={fieldLabel}>Module</label>
                <select
                  value={moduleType}
                  onChange={(e) => setModuleType(e.target.value as WorkflowModuleType)}
                  style={inputSelectStyle}
                >
                  {(meta?.modules || []).map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                  {(!meta?.modules || meta.modules.length === 0) && (
                    <>
                      <option value="borrow_request">Borrow Request</option>
                      <option value="reissuance">Asset Re-Issuance</option>
                      <option value="damage_report">Damage Report</option>
                      <option value="lost_asset">Lost Asset Report</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={fieldLabel}>Description</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief purpose of this workflow"
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

            {/* ── Tabs Segmented Header ── */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #E2E8F0',
              gap: 4,
              paddingBottom: 2,
            }}>
              {tabs.map((tab) => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      border: 'none',
                      background: active ? '#EFF6FF' : 'transparent',
                      cursor: 'pointer',
                      color: active ? '#0B3D91' : '#64748B',
                      borderRadius: 8,
                      borderBottom: active ? '2px solid #0B3D91' : '2px solid transparent',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <tab.icon size={14} style={{ color: active ? '#0B3D91' : '#94A3B8' }} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        background: active ? '#0B3D91' : '#E2E8F0',
                        color: active ? '#FFFFFF' : '#475569',
                        borderRadius: 999,
                        padding: '1px 7px',
                        minWidth: 14,
                        textAlign: 'center',
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* ── TAB 1: APPROVAL LEVELS ── */}
            {activeTab === 'levels' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 12.5, color: '#64748B', margin: 0 }}>
                    Define the sequential approval stages. Requests will advance through each active stage in order.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddLevel}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} />
                    <span>Add Level</span>
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                  {levels.map((lvl, index) => {
                    const isExp = expandedLevelIdx === index
                    const hasRoles = (lvl.roles || []).length > 0
                    const hasUsers = (lvl.user_ids || []).length > 0

                    return (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {index > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              border: '1px solid #E2E8F0',
                              background: '#F8FAFC',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94A3B8',
                            }}>
                              <ArrowDown size={12} />
                            </div>
                          </div>
                        )}

                        <div style={{
                          borderRadius: 10,
                          border: `1px solid ${lvl.is_enabled ? (isExp ? '#93C5FD' : '#E2E8F0') : '#F1F5F9'}`,
                          background: lvl.is_enabled ? '#FFFFFF' : '#FAFAFA',
                          opacity: lvl.is_enabled ? 1 : 0.65,
                          boxShadow: isExp ? '0 2px 10px rgba(11,61,145,0.06)' : '0 1px 2px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease',
                          overflow: 'hidden',
                        }}>
                          {/* Card Header Bar */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              cursor: 'pointer',
                              background: isExp ? '#F8FAFC' : '#FFFFFF',
                              borderBottom: isExp ? '1px solid #E2E8F0' : 'none',
                            }}
                            onClick={() => setExpandedLevelIdx(isExp ? -1 : index)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                              <span style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: lvl.is_enabled ? '#0B3D91' : '#94A3B8',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 800,
                              }}>
                                {lvl.level_order}
                              </span>

                              <input
                                type="text"
                                value={lvl.name}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateLevel(index, { name: e.target.value })}
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  color: '#0F172A',
                                  background: 'transparent',
                                  border: 'none',
                                  borderBottom: '1px dashed #CBD5E1',
                                  outline: 'none',
                                  fontFamily: 'inherit',
                                  padding: '2px 4px',
                                  minWidth: 180,
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderBottom = '1.5px solid #0B3D91' }}
                                onBlur={(e) => { e.currentTarget.style.borderBottom = '1px dashed #CBD5E1' }}
                                placeholder="Stage Name"
                              />

                              {/* Summary Tags */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {hasRoles && (
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: '#EFF6FF',
                                    color: '#1E40AF',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: 6,
                                    padding: '1px 8px',
                                  }}>
                                    {lvl.roles?.join(', ')}
                                  </span>
                                )}
                                {hasUsers && (
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: '#F1F5F9',
                                    color: '#475569',
                                    borderRadius: 6,
                                    padding: '1px 8px',
                                  }}>
                                    {lvl.user_ids?.length} Assigned User{lvl.user_ids && lvl.user_ids.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {!lvl.is_enabled && (
                                  <span style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    borderRadius: 6,
                                    padding: '1px 6px',
                                    textTransform: 'uppercase',
                                  }}>
                                    Disabled
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Toolbar Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                title="Move Up"
                                onClick={() => handleMoveLevel(index, 'up')}
                                disabled={index === 0}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  border: '1px solid #E2E8F0',
                                  background: '#FFFFFF',
                                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: index === 0 ? '#CBD5E1' : '#475569',
                                }}
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                title="Move Down"
                                onClick={() => handleMoveLevel(index, 'down')}
                                disabled={index === levels.length - 1}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  border: '1px solid #E2E8F0',
                                  background: '#FFFFFF',
                                  cursor: index === levels.length - 1 ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: index === levels.length - 1 ? '#CBD5E1' : '#475569',
                                }}
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                type="button"
                                title="Duplicate Stage"
                                onClick={() => handleDuplicateLevel(index)}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  border: '1px solid #E2E8F0',
                                  background: '#FFFFFF',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#475569',
                                }}
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                type="button"
                                title="Remove Stage"
                                onClick={() => handleRemoveLevel(index)}
                                disabled={levels.length <= 1}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  border: '1px solid #E2E8F0',
                                  background: '#FFFFFF',
                                  cursor: levels.length <= 1 ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: levels.length <= 1 ? '#CBD5E1' : '#DC2626',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                              <ChevronDown
                                size={15}
                                style={{
                                  color: '#64748B',
                                  marginLeft: 4,
                                  transform: isExp ? 'rotate(180deg)' : 'none',
                                  transition: 'transform 0.15s',
                                }}
                              />
                            </div>
                          </div>

                          {/* Expanded Form Controls */}
                          {isExp && (
                            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                                {/* Approver Roles Chip Picker */}
                                <div>
                                  <label style={fieldLabel}>
                                    <Shield size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle', color: '#0B3D91' }} />
                                    Approver Roles
                                  </label>
                                  <div style={{
                                    border: '1px solid #CBD5E1',
                                    borderRadius: 10,
                                    padding: '10px 12px',
                                    background: '#FFFFFF',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                    maxHeight: 120,
                                    overflowY: 'auto',
                                  }}>
                                    {allRoles.map((r) => {
                                      const isSelected = (lvl.roles || []).includes(r.name)
                                      return (
                                        <button
                                          key={r.id}
                                          type="button"
                                          onClick={() => toggleRoleInLevel(index, r.name)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            padding: '5px 12px',
                                            borderRadius: 8,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            border: isSelected ? '1.5px solid #0B3D91' : '1px solid #E2E8F0',
                                            background: isSelected ? '#EFF6FF' : '#F8FAFC',
                                            color: isSelected ? '#0B3D91' : '#475569',
                                            transition: 'all 0.12s ease',
                                          }}
                                        >
                                          {isSelected && <Check size={12} />}
                                          <span>{r.name}</span>
                                        </button>
                                      )
                                    })}
                                    {allRoles.length === 0 && (
                                      <span style={{ fontSize: 12, color: '#94A3B8' }}>No roles found</span>
                                    )}
                                  </div>
                                </div>

                                {/* Specific Users Multi-Select */}
                                <div>
                                  <label style={fieldLabel}>
                                    <UserIcon size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle', color: '#0B3D91' }} />
                                    Specific Users <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span>
                                  </label>
                                  <div style={{
                                    border: '1px solid #CBD5E1',
                                    borderRadius: 10,
                                    padding: '10px 12px',
                                    background: '#FFFFFF',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    maxHeight: 120,
                                    overflowY: 'auto',
                                  }}>
                                    {allUsers.map((u) => {
                                      const isSelected = (lvl.user_ids || []).includes(u.id)
                                      return (
                                        <label
                                          key={u.id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontSize: 12,
                                            color: '#334155',
                                            cursor: 'pointer',
                                            padding: '3px 6px',
                                            borderRadius: 6,
                                            background: isSelected ? '#EFF6FF' : 'transparent',
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleUserInLevel(index, u.id)}
                                            style={{ width: 14, height: 14, accentColor: '#0B3D91', cursor: 'pointer' }}
                                          />
                                          <span style={{ fontWeight: isSelected ? 700 : 500 }}>
                                            {u.full_name || u.email}
                                          </span>
                                        </label>
                                      )
                                    })}
                                    {allUsers.length === 0 && (
                                      <span style={{ fontSize: 12, color: '#94A3B8' }}>No users found</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Scope & Approval Logic */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                                <div>
                                  <label style={fieldLabel}>Office Scope</label>
                                  <select
                                    value={lvl.office_id || ''}
                                    onChange={(e) => updateLevel(index, { office_id: e.target.value ? Number(e.target.value) : null })}
                                    style={inputSelectStyle}
                                  >
                                    <option value="">Any Office</option>
                                    {offices.map((o) => (
                                      <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label style={fieldLabel}>Department Scope</label>
                                  <select
                                    value={lvl.department_id || ''}
                                    onChange={(e) => updateLevel(index, { department_id: e.target.value ? Number(e.target.value) : null })}
                                    style={inputSelectStyle}
                                  >
                                    <option value="">Any Department</option>
                                    {departments.map((d) => (
                                      <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label style={fieldLabel}>Approval Rule</label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42 }}>
                                    <select
                                      value={lvl.approval_type || 'any'}
                                      onChange={(e) => updateLevel(index, { approval_type: e.target.value as any })}
                                      style={{ ...inputSelectStyle, flex: 1 }}
                                    >
                                      <option value="any">Any Approver (First to act)</option>
                                      <option value="all">All Approvers (Unanimous)</option>
                                    </select>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                      <input
                                        type="checkbox"
                                        checked={lvl.is_enabled}
                                        onChange={(e) => updateLevel(index, { is_enabled: e.target.checked })}
                                        style={{ width: 15, height: 15, accentColor: '#0B3D91', cursor: 'pointer' }}
                                      />
                                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>Enabled</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── TAB 2: RULES & PROCESSING OPTIONS ── */}
            {activeTab === 'options' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 12.5, color: '#64748B', margin: 0 }}>
                  Configure automatic processing, rejection handling, and requester permissions.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                  {optionEntries.map(([key, label, desc]) => {
                    const checked = Boolean(options[key as keyof WorkflowOptions])
                    return (
                      <label
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '12px 14px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          border: `1px solid ${checked ? '#93C5FD' : '#E2E8F0'}`,
                          background: checked ? '#F0F7FF' : '#FFFFFF',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                          style={{ width: 16, height: 16, marginTop: 2, accentColor: '#0B3D91', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: checked ? '#0B3D91' : '#0F172A' }}>
                            {label}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 1.35 }}>
                            {desc}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── TAB 3: SEQUENCE PREVIEW (CENTERED PIPELINE) ── */}
            {activeTab === 'preview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Workflow Summary Header */}
                <div style={{
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                        {name || 'Untitled Approval Workflow'}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#EFF6FF',
                        color: '#0B3D91',
                        border: '1px solid #BFDBFE',
                      }}>
                        {moduleLabels[moduleType] || moduleType}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {description || 'No description provided'} • {levels.length} Total Stage{levels.length > 1 ? 's' : ''}
                    </div>
                  </div>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: isActive ? '#DCFCE7' : '#F1F5F9',
                    color: isActive ? '#15803D' : '#64748B',
                    border: `1px solid ${isActive ? '#86EFAC' : '#CBD5E1'}`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16A34A' : '#94A3B8' }} />
                    {isActive ? 'Active Pipeline' : 'Draft / Inactive'}
                  </span>
                </div>

                {/* Pipeline Flow Visualization - Centered */}
                <div style={{
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                    Visual Execution Sequence
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: '8px 0',
                  }}>
                    {/* Step 0: Submission */}
                    <div style={{
                      minWidth: 150,
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      background: '#F8FAFC',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#64748B', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                          0
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                          Submitted
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#64748B' }}>Employee initiates request</span>
                    </div>

                    {/* Step 1..N Levels */}
                    {levels.map((lvl, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ArrowRight size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />

                        <div style={{
                          minWidth: 190,
                          borderRadius: 10,
                          border: `1.5px solid ${lvl.is_enabled ? '#3B82F6' : '#E2E8F0'}`,
                          background: lvl.is_enabled ? '#EFF6FF' : '#FAFAFA',
                          padding: '10px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          opacity: lvl.is_enabled ? 1 : 0.6,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: lvl.is_enabled ? '#0B3D91' : '#94A3B8',
                                color: '#FFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                fontWeight: 800,
                              }}>
                                {lvl.level_order}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                                {lvl.name}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {(lvl.roles || []).map((r) => (
                              <span key={r} style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                background: '#DBEAFE',
                                color: '#1E40AF',
                                borderRadius: 4,
                                padding: '1px 6px',
                              }}>
                                {r}
                              </span>
                            ))}
                            {lvl.user_ids && lvl.user_ids.length > 0 && (
                              <span style={{ fontSize: 10.5, color: '#64748B' }}>
                                +{lvl.user_ids.length} User{lvl.user_ids.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 10.5, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #DBEAFE', paddingTop: 4 }}>
                            <span>Rule: <strong>{lvl.approval_type === 'all' ? 'All Approvers' : 'Any Approver'}</strong></span>
                            <span>{lvl.is_enabled ? 'Active' : 'Skipped'}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Step Final: Approved */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ArrowRight size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />

                      <div style={{
                        minWidth: 150,
                        borderRadius: 10,
                        border: '1.5px solid #86EFAC',
                        background: '#F0FDF4',
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#15803D' }}>
                            Approved
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: '#166534' }}>Workflow complete & active</span>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Routing Callout */}
                  <div style={{
                    borderRadius: 8,
                    border: '1px solid #FECACA',
                    background: '#FEF2F2',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12,
                    color: '#991B1B',
                  }}>
                    <XCircle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <div>
                      <strong>Rejection Handling:</strong> If rejected at any stage, request transitions to <strong>REJECTED</strong> and returns to requester with logged remarks.
                    </div>
                  </div>
                </div>

                {/* Level Breakdown Summary Table */}
                <div style={{
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}>
                  <div style={{ padding: '8px 14px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Stage Specification Breakdown
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                        <th style={{ padding: '8px 12px', width: 60 }}>Stage</th>
                        <th style={{ padding: '8px 12px' }}>Name</th>
                        <th style={{ padding: '8px 12px' }}>Approver Roles</th>
                        <th style={{ padding: '8px 12px' }}>Approval Rule</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levels.map((lvl) => (
                        <tr key={lvl.level_order} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0B3D91' }}>#{lvl.level_order}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0F172A' }}>{lvl.name}</td>
                          <td style={{ padding: '8px 12px', color: '#334155' }}>
                            {(lvl.roles || []).join(', ') || 'No role selected'}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>
                            {lvl.approval_type === 'all' ? 'All Approvers (Consensus)' : 'Any Approver (First to act)'}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: lvl.is_enabled ? '#16A34A' : '#94A3B8',
                            }}>
                              {lvl.is_enabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Footer Actions Bar ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: '1px solid #E2E8F0',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#0B3D91', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  Enable Workflow immediately (Set as Active)
                </span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveSubmit}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : workflowToEdit ? 'Publish New Version' : 'Create Workflow'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {showSummaryPrompt && (
        <Modal open={showSummaryPrompt} onClose={() => setShowSummaryPrompt(false)} title="Version Change Summary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
              Provide a brief summary for the version audit trail:
            </p>
            <Input
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="e.g., Added Level 2 Department Head approval"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowSummaryPrompt(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={() => void performSave(changeSummary)} disabled={saving}>
                Publish
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}
