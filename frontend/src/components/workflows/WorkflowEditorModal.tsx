import { useEffect, useState } from 'react'
import { Modal, Button, Input, Alert, Badge, Spinner } from '@/components/ui'
import { workflowService, type WorkflowMetadata } from '@/services/workflowService'
import { userService } from '@/services/userService'
import { roleService, type Role } from '@/services/roleService'
import { setupService, type SetupRecord } from '@/services/setupService'
import type { Workflow, WorkflowApprovalLevel, WorkflowModuleType, WorkflowOptions, User } from '@/types'
import {
  Plus,
  Trash2,
  Copy,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Sliders,
  Eye,
  Layers,
  Shield,
  User as UserIcon,
  Building,
  CheckCircle,
} from 'lucide-react'

interface WorkflowEditorModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  workflowToEdit?: Workflow | null
}

export function WorkflowEditorModal({
  open,
  onClose,
  onSaved,
  workflowToEdit,
}: WorkflowEditorModalProps) {
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
    {
      level_order: 1,
      name: 'Initial Review',
      roles: ['Property Custodian'],
      user_ids: [],
      approval_type: 'any',
      is_enabled: true,
    },
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

  useEffect(() => {
    if (!open) return
    const loadMetadata = async () => {
      setLoading(true)
      try {
        const [mRes, rRes, uRes, oRes, dRes] = await Promise.all([
          workflowService.getModules(),
          roleService.getRoles().then((res) => res.items).catch(() => []),
          userService.getUsers({ per_page: 100 }).then((res) => res.items).catch(() => []),
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
            setLevels(
              workflowToEdit.current_version.approval_levels.map((l) => ({
                level_order: l.level_order,
                name: l.name,
                roles: l.roles || [],
                user_ids: l.user_ids || [],
                office_id: l.office_id || null,
                department_id: l.department_id || null,
                approval_type: l.approval_type || 'single',
                is_enabled: l.is_enabled ?? true,
              }))
            )
          }
        } else {
          setName('')
          setModuleType('borrow_request')
          setDescription('')
          setIsActive(true)
          setOptions(mRes.default_options || {})
          setLevels([
            {
              level_order: 1,
              name: 'Property Verification',
              roles: ['Property Custodian'],
              user_ids: [],
              approval_type: 'any',
              is_enabled: true,
            },
          ])
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load workflow dependencies.')
      } finally {
        setLoading(false)
      }
    }
    void loadMetadata()
  }, [open, workflowToEdit])

  const handleAddLevel = () => {
    const nextOrder = levels.length + 1
    setLevels([
      ...levels,
      {
        level_order: nextOrder,
        name: `Approval Level ${nextOrder}`,
        roles: ['Property Custodian'],
        user_ids: [],
        approval_type: 'any',
        is_enabled: true,
      },
    ])
  }

  const handleRemoveLevel = (index: number) => {
    if (levels.length <= 1) return
    const next = levels
      .filter((_, idx) => idx !== index)
      .map((l, idx) => ({ ...l, level_order: idx + 1 }))
    setLevels(next)
  }

  const handleMoveLevel = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= levels.length) return
    const clone = [...levels]
    const temp = clone[index]
    clone[index] = clone[newIdx]
    clone[newIdx] = temp
    setLevels(clone.map((l, idx) => ({ ...l, level_order: idx + 1 })))
  }

  const handleDuplicateLevel = (index: number) => {
    const target = levels[index]
    const clone = [...levels]
    clone.splice(index + 1, 0, {
      ...target,
      name: `${target.name} (Copy)`,
    })
    setLevels(clone.map((l, idx) => ({ ...l, level_order: idx + 1 })))
  }

  const updateLevel = (index: number, patch: Partial<WorkflowApprovalLevel>) => {
    const clone = [...levels]
    clone[index] = { ...clone[index], ...patch }
    setLevels(clone)
  }

  const handleSaveSubmit = () => {
    if (!name.trim()) {
      setErrorMsg('Workflow name is required.')
      return
    }
    if (levels.length === 0) {
      setErrorMsg('At least one approval level is required.')
      return
    }

    if (workflowToEdit) {
      setShowSummaryPrompt(true)
    } else {
      void performSave('')
    }
  }

  const performSave = async (summaryText: string) => {
    setSaving(true)
    setErrorMsg(null)
    try {
      const payload = {
        name,
        module_type: moduleType,
        description,
        is_active: isActive,
        options,
        change_summary: summaryText || (workflowToEdit ? 'Updated workflow version' : 'Initial version'),
        approval_levels: levels,
      }

      if (workflowToEdit) {
        await workflowService.update(workflowToEdit.id, payload)
      } else {
        await workflowService.create(payload)
      }

      setShowSummaryPrompt(false)
      onSaved()
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save workflow.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={workflowToEdit ? `Edit Workflow — ${workflowToEdit.name}` : 'Create New Approval Workflow'}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {errorMsg && <Alert tone="error">{errorMsg}</Alert>}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner label="Loading workflow configuration editor..." />
          </div>
        ) : (
          <>
            {/* Top Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Workflow Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Borrow Request Standard Flow" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Module *</label>
                <select
                  value={moduleType}
                  onChange={(e) => setModuleType(e.target.value as WorkflowModuleType)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {(meta?.modules || []).map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief summary of workflow purpose" />
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('levels')}
                className={`pb-2.5 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'levels' ? 'border-[#0D47A1] text-[#0D47A1]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={15} /> Approval Sequence ({levels.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('options')}
                className={`pb-2.5 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'options' ? 'border-[#0D47A1] text-[#0D47A1]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders size={15} /> Workflow Rules & Options
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`pb-2.5 text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'preview' ? 'border-[#0D47A1] text-[#0D47A1]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye size={15} /> Live Sequence Preview
              </button>
            </div>

            {/* TAB 1: LEVELS BUILDER */}
            {activeTab === 'levels' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Configure ordered approval stages. Requests will progress sequentially level-by-level.
                  </p>
                  <Button size="sm" onClick={handleAddLevel}>
                    <Plus size={15} className="mr-1" /> Add Approval Level
                  </Button>
                </div>

                <div className="space-y-4">
                  {levels.map((lvl, index) => (
                    <div key={index} className="relative">
                      {/* Connector Arrow */}
                      {index > 0 && (
                        <div className="flex justify-center -my-2.5 relative z-10">
                          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-full p-1 shadow-2xs">
                            <ArrowDown size={14} />
                          </div>
                        </div>
                      )}

                      <div
                        className={`rounded-xl border p-4 transition-all ${
                          lvl.is_enabled ? 'border-slate-200 bg-white shadow-2xs' : 'border-slate-200 bg-slate-50/70 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0D47A1] text-white font-bold text-xs">
                              {lvl.level_order}
                            </span>
                            <input
                              type="text"
                              value={lvl.name}
                              onChange={(e) => updateLevel(index, { name: e.target.value })}
                              className="font-bold text-slate-800 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#0D47A1] focus:outline-none px-1 py-0.5 rounded"
                              placeholder="Level Name"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMoveLevel(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveLevel(index, 'down')}
                              disabled={index === levels.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateLevel(index)}
                              className="p-1 text-slate-400 hover:text-blue-600 ml-1"
                              title="Duplicate Level"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLevel(index)}
                              disabled={levels.length <= 1}
                              className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 ml-1"
                              title="Remove Level"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          {/* Role Selection */}
                          <div>
                            <label className="font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                              <Shield size={12} /> Assigned Role(s)
                            </label>
                            <select
                              multiple
                              value={lvl.roles || []}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value)
                                updateLevel(index, { roles: selected })
                              }}
                              className="w-full h-20 border border-slate-200 rounded-lg p-1.5 bg-white text-xs"
                            >
                              {allRoles.map((r) => (
                                <option key={r.id} value={r.name}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Specific User Assignment */}
                          <div>
                            <label className="font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                              <UserIcon size={12} /> Specific User(s) (Optional)
                            </label>
                            <select
                              multiple
                              value={(lvl.user_ids || []).map(String)}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (opt) => Number(opt.value))
                                updateLevel(index, { user_ids: selected })
                              }}
                              className="w-full h-20 border border-slate-200 rounded-lg p-1.5 bg-white text-xs"
                            >
                              {allUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.full_name || u.email}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Scope: Office / Department */}
                          <div className="space-y-2">
                            <div>
                              <label className="font-semibold text-slate-600 block mb-1 flex items-center gap-1">
                                <Building size={12} /> Office Scope
                              </label>
                              <select
                                value={lvl.office_id || ''}
                                onChange={(e) => updateLevel(index, { office_id: e.target.value ? Number(e.target.value) : null })}
                                className="w-full border border-slate-200 rounded-lg p-1.5 bg-white text-xs"
                              >
                                <option value="">Any Office</option>
                                {offices.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="font-semibold text-slate-600 block mb-1">Department Scope</label>
                              <select
                                value={lvl.department_id || ''}
                                onChange={(e) => updateLevel(index, { department_id: e.target.value ? Number(e.target.value) : null })}
                                className="w-full border border-slate-200 rounded-lg p-1.5 bg-white text-xs"
                              >
                                <option value="">Any Department</option>
                                {departments.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Approval Type & Status */}
                          <div className="space-y-3">
                            <div>
                              <label className="font-semibold text-slate-600 block mb-1">Approval Type</label>
                              <select
                                value={lvl.approval_type}
                                onChange={(e) => updateLevel(index, { approval_type: e.target.value as any })}
                                className="w-full border border-slate-200 rounded-lg p-1.5 bg-white text-xs"
                              >
                                {(meta?.approval_types || []).map((at) => (
                                  <option key={at.value} value={at.value}>
                                    {at.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="checkbox"
                                id={`enabled-${index}`}
                                checked={lvl.is_enabled}
                                onChange={(e) => updateLevel(index, { is_enabled: e.target.checked })}
                                className="rounded border-slate-300 text-[#0D47A1]"
                              />
                              <label htmlFor={`enabled-${index}`} className="text-xs font-semibold text-slate-700">
                                Level Enabled
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: OPTIONS */}
            {activeTab === 'options' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {Object.entries({
                  auto_approve_no_approver: 'Auto-approve if no approvers exist for request',
                  skip_disabled_levels: 'Skip disabled approval levels automatically',
                  allow_rejection_any_level: 'Allow rejection at any approval level',
                  allow_request_cancellation: 'Allow requester to cancel pending request',
                  allow_requester_withdrawal: 'Allow requester to withdraw request before decision',
                  require_remarks_on_rejection: 'Require remarks/reason when rejecting request',
                  require_remarks_on_approval: 'Require remarks/reason when approving request',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/80">
                    <input
                      type="checkbox"
                      id={`opt-${key}`}
                      checked={Boolean(options[key as keyof WorkflowOptions])}
                      onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-[#0D47A1]"
                    />
                    <label htmlFor={`opt-${key}`} className="text-xs font-medium text-slate-800 cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: LIVE PREVIEW */}
            {activeTab === 'preview' && (
              <div className="p-4 bg-slate-900 rounded-xl text-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Approval Sequence Diagram — {name || 'Untitled Workflow'}
                  </h4>
                  <Badge tone="blue">{moduleType}</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 overflow-x-auto py-4">
                  <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-xs font-mono text-emerald-400">
                    <span>1. Request Submitted</span>
                  </div>

                  {levels.map((l, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <ArrowRight size={16} className="text-slate-600" />
                      <div
                        className={`flex flex-col gap-0.5 border px-3.5 py-2 rounded-lg text-xs ${
                          l.is_enabled ? 'bg-blue-950/80 border-blue-600 text-blue-100' : 'bg-slate-800/50 border-slate-700 text-slate-500'
                        }`}
                      >
                        <span className="font-bold text-white">
                          Level {l.level_order}: {l.name}
                        </span>
                        <span className="text-[11px] text-slate-300">
                          Roles: {(l.roles || []).join(', ') || 'Any'}
                        </span>
                      </div>
                    </div>
                  ))}

                  <ArrowRight size={16} className="text-slate-600" />
                  <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-600 px-3 py-2 rounded-lg text-xs font-bold text-emerald-300">
                    <CheckCircle size={14} /> Approved & Processed
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wf-is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-[#0D47A1]"
                />
                <label htmlFor="wf-is-active" className="text-xs font-semibold text-slate-800">
                  Active (Enable for new requests)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSubmit} disabled={saving}>
                  {saving ? 'Publishing...' : workflowToEdit ? 'Publish New Version' : 'Create Workflow'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Change Summary Prompt Modal for Editing Published Workflows */}
      {showSummaryPrompt && (
        <Modal open={showSummaryPrompt} onClose={() => setShowSummaryPrompt(false)} title="Version Change Summary">
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Publishing changes will create a new workflow version. Provide a change summary for the version audit trail:
            </p>
            <Input
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="e.g., Added Level 2 Department Head approval"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowSummaryPrompt(false)}>
                Cancel
              </Button>
              <Button onClick={() => void performSave(changeSummary)}>Publish Version</Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}
