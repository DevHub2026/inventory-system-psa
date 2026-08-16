import { useEffect, useState } from 'react'
import { Modal, Button, Input, Alert, Badge, Spinner } from '@/components/ui'
import { workflowService, type WorkflowMetadata } from '@/services/workflowService'
import { userService } from '@/services/userService'
import { roleService, type Role } from '@/services/roleService'
import { setupService, type SetupRecord } from '@/services/setupService'
import type { ApprovalType, Workflow, WorkflowApprovalLevel, WorkflowModuleType, WorkflowOptions, User } from '@/types'
import {
  Plus, Trash2, Copy, ArrowDown, ArrowUp, ArrowRight,
  ChevronDown, Sliders, Eye, Layers, Shield, User as UserIcon,
  Building, CheckCircle,
} from 'lucide-react'

interface WorkflowEditorModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  workflowToEdit?: Workflow | null
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: 11.5, fontWeight: 700,
  color: '#475569', marginBottom: 6, letterSpacing: '0.01em',
}

const selectStyle: React.CSSProperties = {
  width: '100%', borderRadius: 10, border: '1px solid #E2E8F0',
  background: '#fff', padding: '0 12px', height: 38,
  fontSize: 13, color: '#1E293B', outline: 'none',
  fontFamily: 'inherit', cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}

const multiSelectStyle: React.CSSProperties = {
  width: '100%', borderRadius: 10, border: '1px solid #E2E8F0',
  background: '#fff', padding: '6px 8px', height: 90,
  fontSize: 12.5, color: '#1E293B', outline: 'none',
  fontFamily: 'inherit',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
}

export function WorkflowEditorModal({ open, onClose, onSaved, workflowToEdit }: WorkflowEditorModalProps) {
  const [name, setName] = useState('')
  const [moduleType, setModuleType] = useState<WorkflowModuleType>('borrow_request')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [changeSummary, setChangeSummary] = useState('')
  const [showSummaryPrompt, setShowSummaryPrompt] = useState(false)
  const [options, setOptions] = useState<WorkflowOptions>({
    auto_approve_no_approver: true, skip_disabled_levels: true,
    allow_rejection_any_level: true, allow_request_cancellation: true,
    allow_requester_withdrawal: true, require_remarks_on_rejection: true,
    require_remarks_on_approval: false,
  })
  const [levels, setLevels] = useState<WorkflowApprovalLevel[]>([
    { level_order: 1, name: 'Initial Review', roles: ['Property Custodian'], user_ids: [], approval_type: 'any', is_enabled: true },
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
    ['auto_approve_no_approver',   'Auto-Approve Without Approver',  'Auto-approves if no approvers are assigned'],
    ['skip_disabled_levels',       'Skip Disabled Levels',           'Bypasses disabled approval levels automatically'],
    ['allow_rejection_any_level',  'Rejection at Any Level',         'Any approver can reject, not just the current level'],
    ['allow_request_cancellation', 'Allow Cancellation',             'Requester can cancel pending requests'],
    ['allow_requester_withdrawal', 'Allow Withdrawal',               'Requester can withdraw before a decision is made'],
    ['require_remarks_on_rejection','Remarks on Rejection',          'Require a reason when rejecting'],
    ['require_remarks_on_approval', 'Remarks on Approval',           'Require a reason when approving'],
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
        setMeta(mRes); setAllRoles(rRes); setAllUsers(uRes); setOffices(oRes); setDepartments(dRes)
        if (workflowToEdit) {
          setName(workflowToEdit.name); setModuleType(workflowToEdit.module_type)
          setDescription(workflowToEdit.description || ''); setIsActive(workflowToEdit.is_active)
          setOptions(workflowToEdit.options || mRes.default_options || {})
          if (workflowToEdit.current_version?.approval_levels?.length) {
            setLevels(workflowToEdit.current_version.approval_levels.map((l) => ({
              level_order: l.level_order, name: l.name, roles: l.roles || [],
              user_ids: l.user_ids || [], office_id: l.office_id || null,
              department_id: l.department_id || null,
              approval_type: l.approval_type || 'single', is_enabled: l.is_enabled ?? true,
            })))
          }
        } else {
          setName(''); setModuleType('borrow_request'); setDescription(''); setIsActive(true)
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
    const updated = [...levels, { level_order: next, name: `Approval Level ${next}`, roles: ['Property Custodian'], user_ids: [], approval_type: 'any' as const, is_enabled: true }]
    setLevels(updated); setExpandedLevelIdx(updated.length - 1)
  }
  const handleRemoveLevel = (i: number) => {
    if (levels.length <= 1) return
    setLevels(levels.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, level_order: idx + 1 })))
    if (expandedLevelIdx >= i && expandedLevelIdx > 0) setExpandedLevelIdx(expandedLevelIdx - 1)
  }
  const handleMoveLevel = (i: number, dir: 'up' | 'down') => {
    const ni = dir === 'up' ? i - 1 : i + 1
    if (ni < 0 || ni >= levels.length) return
    const clone = [...levels]; [clone[i], clone[ni]] = [clone[ni], clone[i]]
    setLevels(clone.map((l, idx) => ({ ...l, level_order: idx + 1 }))); setExpandedLevelIdx(ni)
  }
  const handleDuplicateLevel = (i: number) => {
    const clone = [...levels]; clone.splice(i + 1, 0, { ...levels[i], name: `${levels[i].name} (Copy)` })
    setLevels(clone.map((l, idx) => ({ ...l, level_order: idx + 1 }))); setExpandedLevelIdx(i + 1)
  }
  const updateLevel = (i: number, patch: Partial<WorkflowApprovalLevel>) => {
    const clone = [...levels]; clone[i] = { ...clone[i], ...patch }; setLevels(clone)
  }
  const handleSaveSubmit = () => {
    if (!name.trim()) { setErrorMsg('Workflow name is required.'); return }
    if (levels.length === 0) { setErrorMsg('At least one approval level is required.'); return }
    if (workflowToEdit) setShowSummaryPrompt(true)
    else void performSave('')
  }
  const performSave = async (summary: string) => {
    setSaving(true); setErrorMsg(null)
    try {
      const payload = { name, module_type: moduleType, description, is_active: isActive, options,
        change_summary: summary || (workflowToEdit ? 'Updated workflow' : 'Initial version'), approval_levels: levels }
      if (workflowToEdit) await workflowService.update(workflowToEdit.id, payload)
      else await workflowService.create(payload)
      setShowSummaryPrompt(false); onSaved(); onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save workflow.')
    } finally { setSaving(false) }
  }

  const tabs = [
    { id: 'levels'  as const, icon: Layers,  label: 'Approval Levels', count: levels.length },
    { id: 'options' as const, icon: Sliders, label: 'Rules & Options' },
    { id: 'preview' as const, icon: Eye,     label: 'Sequence Preview' },
  ]

  return (
    <Modal open={open} onClose={onClose}
      title={workflowToEdit ? `Edit: ${workflowToEdit.name}` : 'New Approval Workflow'}
      maxWidth="min(768px, calc(100vw - 24px))"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {errorMsg && <div style={{ marginBottom: 16 }}><Alert tone="error">{errorMsg}</Alert></div>}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Spinner label="Loading editor..." /></div>
        ) : (
          <>
            {/* ── Basic Info ── */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20,
            }}>
              <div>
                <label style={fieldLabel}>Workflow Name <span style={{ color: '#EF4444' }}>*</span></label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Borrow Request Flow" />
              </div>
              <div>
                <label style={fieldLabel}>Module</label>
                <select value={moduleType} onChange={(e) => setModuleType(e.target.value as WorkflowModuleType)} style={selectStyle}>
                  {(meta?.modules || []).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief purpose of this workflow" />
              </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 20, gap: 0, overflowX: 'auto' }}>
              {tabs.map((tab) => {
                const active = activeTab === tab.id
                return (
                  <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 18px', fontSize: 12.5, fontWeight: 600,
                      border: 'none', background: 'none', cursor: 'pointer',
                      color: active ? '#1E40AF' : '#94A3B8',
                      borderBottom: `2px solid ${active ? '#1E40AF' : 'transparent'}`,
                      marginBottom: -1, fontFamily: 'inherit',
                      transition: 'color 0.15s',
                    }}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, fontFamily: 'ui-monospace, monospace',
                        background: active ? '#DBEAFE' : '#F1F5F9',
                        color: active ? '#1E40AF' : '#64748B',
                        borderRadius: 10, padding: '1px 7px',
                      }}>{tab.count}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* ── Tab: Levels ── */}
            {activeTab === 'levels' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 12.5, color: '#64748B', margin: 0 }}>
                    Define the approval sequence. Requests move through each level in order.
                  </p>
                  <button type="button" onClick={handleAddLevel}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      height: 32, paddingInline: 14, borderRadius: 8,
                      border: 'none', background: '#1E40AF', color: '#fff',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    <Plus size={12} /> Add Level
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto', paddingRight: 2 }}>
                  {levels.map((lvl, index) => {
                    const isExp = expandedLevelIdx === index
                    return (
                      <div key={index}>
                        {index > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #E2E8F0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ArrowDown size={10} color="#94A3B8" />
                            </div>
                          </div>
                        )}
                        <div style={{
                          borderRadius: 12, border: `1px solid ${lvl.is_enabled ? '#E2E8F0' : '#F1F5F9'}`,
                          background: lvl.is_enabled ? '#fff' : '#FAFAFA',
                          opacity: lvl.is_enabled ? 1 : 0.7,
                          boxShadow: isExp ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                          transition: 'all 0.15s',
                          overflow: 'hidden',
                        }}>
                          {/* Level header row */}
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '11px 14px', cursor: 'pointer',
                            background: isExp ? '#F8FAFC' : 'transparent',
                            borderBottom: isExp ? '1px solid #E2E8F0' : 'none',
                          }}
                            onClick={() => setExpandedLevelIdx(isExp ? -1 : index)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{
                                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                background: '#1E40AF', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10.5, fontWeight: 800,
                              }}>{lvl.level_order}</span>
                              <input type="text" value={lvl.name}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateLevel(index, { name: e.target.value })}
                                style={{
                                  fontSize: 13.5, fontWeight: 600, color: '#0F172A',
                                  background: 'transparent', border: 'none', outline: 'none',
                                  borderBottom: '1px solid transparent', fontFamily: 'inherit',
                                  minWidth: 160, padding: '0 2px',
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderBottomColor = '#1E40AF' }}
                                onBlur={(e)  => { e.currentTarget.style.borderBottomColor = 'transparent' }}
                                placeholder="Level Name"
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                              <button type="button" onClick={() => handleMoveLevel(index,'up')} disabled={index===0}
                                style={{ width:26,height:26,borderRadius:6,border:'none',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#94A3B8',opacity:index===0?0.3:1 }}>
                                <ArrowUp size={12}/>
                              </button>
                              <button type="button" onClick={() => handleMoveLevel(index,'down')} disabled={index===levels.length-1}
                                style={{ width:26,height:26,borderRadius:6,border:'none',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#94A3B8',opacity:index===levels.length-1?0.3:1 }}>
                                <ArrowDown size={12}/>
                              </button>
                              <div style={{ width:1,height:16,background:'#E2E8F0',margin:'0 2px' }}/>
                              <button type="button" onClick={() => handleDuplicateLevel(index)}
                                style={{ width:26,height:26,borderRadius:6,border:'none',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#94A3B8' }}>
                                <Copy size={12}/>
                              </button>
                              <button type="button" onClick={() => handleRemoveLevel(index)} disabled={levels.length<=1}
                                style={{ width:26,height:26,borderRadius:6,border:'none',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#94A3B8',opacity:levels.length<=1?0.3:1 }}>
                                <Trash2 size={12}/>
                              </button>
                              <ChevronDown size={13} color="#94A3B8" style={{ marginLeft:2, transform: isExp?'rotate(180deg)':'none', transition:'transform 0.15s' }}/>
                            </div>
                          </div>

                          {/* Expanded level body */}
                          {isExp && (
                            <div style={{ padding: '16px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                              {/* Roles */}
                              <div>
                                <label style={fieldLabel}>
                                  <Shield size={11} style={{ display:'inline',marginRight:5,verticalAlign:'middle' }}/>
                                  Approver Roles
                                </label>
                                <select multiple value={lvl.roles||[]}
                                  onChange={(e) => updateLevel(index,{roles:Array.from(e.target.selectedOptions,(o)=>o.value)})}
                                  style={multiSelectStyle}>
                                  {allRoles.length===0 && <option value="" disabled>No roles available</option>}
                                  {allRoles.map((r)=><option key={r.id} value={r.name}>{r.name}</option>)}
                                </select>
                                {lvl.roles && lvl.roles.length>0 && (
                                  <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginTop:6 }}>
                                    {lvl.roles.map((r)=>(
                                      <span key={r} style={{ fontSize:10.5,fontWeight:600,color:'#1E40AF',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:4,padding:'2px 7px' }}>{r}</span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Users */}
                              <div>
                                <label style={fieldLabel}>
                                  <UserIcon size={11} style={{ display:'inline',marginRight:5,verticalAlign:'middle' }}/>
                                  Specific Users
                                  <span style={{ fontWeight:400,color:'#94A3B8',marginLeft:4 }}>(optional)</span>
                                </label>
                                <select multiple value={(lvl.user_ids||[]).map(String)}
                                  onChange={(e) => updateLevel(index,{user_ids:Array.from(e.target.selectedOptions,(o)=>Number(o.value))})}
                                  style={multiSelectStyle}>
                                  {allUsers.length===0 && <option value="" disabled>No users available</option>}
                                  {allUsers.map((u)=><option key={u.id} value={u.id}>{u.full_name||u.email}</option>)}
                                </select>
                                {lvl.user_ids && lvl.user_ids.length>0 && (
                                  <div style={{ fontSize:11,color:'#64748B',marginTop:5 }}>{lvl.user_ids.length} user{lvl.user_ids.length>1?'s':''} selected</div>
                                )}
                              </div>

                              {/* Scope */}
                              <div>
                                <label style={fieldLabel}>
                                  <Building size={11} style={{ display:'inline',marginRight:5,verticalAlign:'middle' }}/>
                                  Scope
                                </label>
                                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                                  <select value={lvl.office_id||''} onChange={(e)=>updateLevel(index,{office_id:e.target.value?Number(e.target.value):null})} style={{...selectStyle,height:36}}>
                                    <option value="">Any Office</option>
                                    {offices.map((o)=><option key={o.id} value={o.id}>{o.name}</option>)}
                                  </select>
                                  <select value={lvl.department_id||''} onChange={(e)=>updateLevel(index,{department_id:e.target.value?Number(e.target.value):null})} style={{...selectStyle,height:36}}>
                                    <option value="">Any Department</option>
                                    {departments.map((d)=><option key={d.id} value={d.id}>{d.name}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* Approval type + enabled */}
                              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                                <div>
                                  <label style={fieldLabel}>Approval Type</label>
                                  <select value={lvl.approval_type} onChange={(e)=>updateLevel(index,{approval_type:e.target.value as ApprovalType})} style={{...selectStyle,height:36}}>
                                    {(meta?.approval_types||[]).map((at)=><option key={at.value} value={at.value}>{at.label}</option>)}
                                  </select>
                                </div>
                                <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}>
                                  <input type="checkbox" checked={lvl.is_enabled} onChange={(e)=>updateLevel(index,{is_enabled:e.target.checked})}
                                    style={{ width:15,height:15,accentColor:'#1E40AF',cursor:'pointer' }}/>
                                  <span style={{ fontSize:13,fontWeight:500,color:'#374151' }}>Level Enabled</span>
                                </label>
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

            {/* ── Tab: Options ── */}
            {activeTab === 'options' && (
              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                <p style={{ fontSize:12.5,color:'#64748B',margin:0 }}>
                  Configure how this workflow processes approval requests.
                </p>
                <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  {optionEntries.map(([key, label, desc]) => {
                    const checked = Boolean(options[key as keyof WorkflowOptions])
                    return (
                      <label key={key} style={{
                        display:'flex',alignItems:'flex-start',gap:12,
                        padding:'12px 14px',borderRadius:10,cursor:'pointer',
                        border:`1px solid ${checked ? '#BFDBFE' : '#E2E8F0'}`,
                        background: checked ? '#F0F6FF' : '#fff',
                        transition:'all 0.15s',
                      }}>
                        <input type="checkbox" checked={checked}
                          onChange={(e)=>setOptions({...options,[key]:e.target.checked})}
                          style={{ width:15,height:15,marginTop:1,accentColor:'#1E40AF',cursor:'pointer',flexShrink:0 }}/>
                        <div>
                          <div style={{ fontSize:13,fontWeight:600,color: checked?'#1E40AF':'#0F172A' }}>{label}</div>
                          <div style={{ fontSize:11.5,color:'#64748B',marginTop:2 }}>{desc}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Tab: Preview ── */}
            {activeTab === 'preview' && (
              <div style={{ borderRadius:12,background:'#0F172A',border:'1px solid #1E293B',padding:'18px 20px' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,paddingBottom:12,borderBottom:'1px solid #1E293B' }}>
                  <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.1em',color:'#38BDF8',textTransform:'uppercase' }}>Flow Diagram</span>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:11,color:'#64748B' }}>{name||'Untitled'}</span>
                    <Badge tone="blue">{moduleType}</Badge>
                  </div>
                </div>
                <div style={{ display:'flex',alignItems:'center',flexWrap:'wrap',gap:6,overflowX:'auto',paddingBottom:4 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6,background:'#134E4A',border:'1px solid #0F766E',borderRadius:8,padding:'6px 12px',fontSize:11,color:'#2DD4BF',fontWeight:600 }}>
                    <span style={{ width:18,height:18,borderRadius:'50%',background:'rgba(45,212,191,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800 }}>1</span>
                    Submitted
                  </div>
                  {levels.map((l,i)=>(
                    <div key={i} style={{ display:'flex',alignItems:'center',gap:6 }}>
                      <ArrowRight size={12} color="#334155"/>
                      <div style={{
                        background: l.is_enabled?'rgba(30,64,175,0.3)':'rgba(51,65,85,0.3)',
                        border:`1px solid ${l.is_enabled?'#3B82F6':'#334155'}`,
                        borderRadius:8,padding:'6px 12px',
                        fontSize:11,color:l.is_enabled?'#93C5FD':'#475569',fontWeight:600,
                        minWidth:100,
                      }}>
                        {l.level_order}. {l.name}
                      </div>
                    </div>
                  ))}
                  <ArrowRight size={12} color="#334155"/>
                  <div style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(21,128,61,0.3)',border:'1px solid #15803D',borderRadius:8,padding:'6px 12px',fontSize:11,color:'#4ADE80',fontWeight:700 }}>
                    <CheckCircle size={12}/> Approved
                  </div>
                </div>
              </div>
            )}

            {/* ── Footer ── */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:20,marginTop:4,borderTop:'1px solid #F1F5F9' }}>
              <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}>
                <input type="checkbox" checked={isActive} onChange={(e)=>setIsActive(e.target.checked)}
                  style={{ width:15,height:15,accentColor:'#1E40AF',cursor:'pointer' }}/>
                <span style={{ fontSize:13,fontWeight:600,color:'#374151' }}>Set as Active</span>
              </label>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
                <Button onClick={handleSaveSubmit} disabled={saving}>
                  {saving ? 'Saving…' : workflowToEdit ? 'Publish Version' : 'Create Workflow'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {showSummaryPrompt && (
        <Modal open={showSummaryPrompt} onClose={()=>setShowSummaryPrompt(false)} title="Version Change Summary">
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            <p style={{ fontSize:13,color:'#475569',margin:0 }}>Provide a brief summary for the version audit trail:</p>
            <Input value={changeSummary} onChange={(e)=>setChangeSummary(e.target.value)}
              placeholder="e.g., Added Level 2 Department Head approval"/>
            <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
              <Button variant="secondary" onClick={()=>setShowSummaryPrompt(false)}>Cancel</Button>
              <Button onClick={()=>void performSave(changeSummary)} disabled={saving}>Publish</Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}
