import { useState, useEffect, useMemo } from 'react'
import {
  Shield,
  Plus,
  KeyRound,
  Clock,
  Search,
  Edit,
  Trash2,
  Lock,
  CheckCircle2,
} from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Spinner,
} from '@/components/ui'
import {
  roleService,
  type RoleFilters,
  type CreateRolePayload,
  type UpdateRolePayload,
  type Role,
} from '@/services/roleService'
import { PageHeader } from '@/components/PageHeader'

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filters, setFilters] = useState<RoleFilters>({ per_page: 15, page: 1 })
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 })
  const [searchTerm, setSearchTerm] = useState('')
  const [roleTypeFilter, setRoleTypeFilter] = useState<'all' | 'system' | 'custom'>('all')

  const [formData, setFormData] = useState<CreateRolePayload>({ name: '', description: '', permissions: [] })

  const loadRoles = async () => {
    setLoading(true)
    try {
      const result = await roleService.getRoles(filters)
      setRoles(result.items || [])
      setPagination(result.meta || { current_page: 1, per_page: 15, total: (result.items || []).length, last_page: 1 })
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load roles.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRoles()
  }, [filters])

  const filteredRoles = useMemo(() => {
    let list = roles
    if (roleTypeFilter === 'system') {
      list = list.filter((r) => ['admin', 'staff', 'employee'].includes(r.name.toLowerCase()))
    } else if (roleTypeFilter === 'custom') {
      list = list.filter((r) => !['admin', 'staff', 'employee'].includes(r.name.toLowerCase()))
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          (r.description && r.description.toLowerCase().includes(term))
      )
    }
    return list
  }, [roles, roleTypeFilter, searchTerm])

  const stats = useMemo(() => {
    const total = pagination.total || roles.length
    const system = roles.filter((r) => ['admin', 'staff', 'employee'].includes(r.name.toLowerCase())).length
    const custom = roles.filter((r) => !['admin', 'staff', 'employee'].includes(r.name.toLowerCase())).length
    return { total, system, custom }
  }, [pagination.total, roles])

  const handleCreate = () => {
    setEditingRole(null)
    setFormData({ name: '', description: '', permissions: [] })
    setModalOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({ name: role.name, description: role.description || '', permissions: [] })
    setModalOpen(true)
  }

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"? This action cannot be undone.`)) return
    try {
      await roleService.deleteRole(role.id)
      setMessage({ type: 'success', text: `Role "${role.name}" deleted successfully.` })
      await loadRoles()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete role.' })
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, formData as UpdateRolePayload)
        setMessage({ type: 'success', text: `Role "${formData.name}" updated successfully.` })
      } else {
        await roleService.createRole(formData)
        setMessage({ type: 'success', text: `Role "${formData.name}" created successfully.` })
      }
      setModalOpen(false)
      await loadRoles()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save role.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* ── Page Header ── */}
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure user roles, security access levels, and granular system permission scopes."
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
            <span>Add Role</span>
          </Button>
        }
      />

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
        {/* Total Roles */}
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
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Total Roles
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* System Roles */}
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
            background: '#FAF5FF',
            color: '#7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Lock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              System Roles
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#7C3AED', lineHeight: 1.1 }}>
              {stats.system}
            </div>
          </div>
        </div>

        {/* Custom Roles */}
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
            <KeyRound size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Custom Roles
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>
              {stats.custom}
            </div>
          </div>
        </div>

        {/* Status */}
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
              Security Status
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A', lineHeight: 1.2 }}>
              RBAC Active
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Roles Card & Table ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
      }}>
        {/* Filters Toolbar */}
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
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 380 }}>
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
              placeholder="Search roles by name or description..."
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

          {/* Role Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>Category:</span>
            <select
              value={roleTypeFilter}
              onChange={(e) => setRoleTypeFilter(e.target.value as any)}
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
              <option value="all">All Role Categories</option>
              <option value="system">System Roles</option>
              <option value="custom">Custom Roles</option>
            </select>
          </div>
        </div>

        {/* Roles Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Spinner label="Loading roles..." />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div style={{ padding: '64px 20px' }}>
            <EmptyState
              title={searchTerm ? 'No roles match your search' : 'No roles configured'}
              description={searchTerm ? 'Try adjusting your search criteria.' : 'Create your first custom role to manage access control.'}
              action={
                <Button variant="primary" size="sm" onClick={handleCreate} style={{ marginTop: 12 }}>
                  <Plus size={14} style={{ marginRight: 6 }} />
                  Add New Role
                </Button>
              }
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role Title</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>Classification</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>Created</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>Updated</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((r) => {
                  const isSystem = ['admin', 'staff', 'employee'].includes(r.name.toLowerCase())
                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      {/* Name & Icon */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: isSystem ? '#FAF5FF' : '#EFF6FF',
                            color: isSystem ? '#7C3AED' : '#0B3D91',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${isSystem ? '#E9D5FF' : '#BFDBFE'}`,
                            flexShrink: 0,
                          }}>
                            <Shield size={16} />
                          </div>
                          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>
                            {r.name}
                          </span>
                        </div>
                      </td>

                      {/* Classification Badge */}
                      <td style={{ padding: '12px 18px' }}>
                        <Badge tone={isSystem ? 'violet' : 'blue'}>
                          {isSystem ? 'System Core' : 'Custom'}
                        </Badge>
                      </td>

                      {/* Description */}
                      <td style={{ padding: '12px 18px', color: '#475569', maxWidth: 300 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.description || ''}>
                          {r.description || <span style={{ color: '#CBD5E1' }}>No description specified</span>}
                        </span>
                      </td>

                      {/* Created */}
                      <td style={{ padding: '12px 18px', color: '#64748B', fontSize: 12.5 }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Updated */}
                      <td style={{ padding: '12px 18px', color: '#64748B', fontSize: 12.5 }}>
                        {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            title="Edit Role"
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
                            title="Delete Role"
                            onClick={() => void handleDelete(r)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              border: '1px solid #FEE2E2',
                              background: '#FFF5F5',
                              color: '#DC2626',
                              fontSize: 12,
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
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ borderTop: '1px solid #F1F5F9', padding: '12px 20px' }}>
              <Pagination
                page={pagination.current_page}
                lastPage={pagination.last_page}
                total={pagination.total}
                onPageChange={(p) => setFilters({ ...filters, page: p })}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Role Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Add New Role'}
        maxWidth={520}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={saving || !formData.name.trim()}
            >
              {saving ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Role Title <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Property Custodian, Division Head"
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
              Role Description <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span>
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe access privileges and permissions managed under this role..."
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                padding: '10px 14px',
                fontSize: 13.5,
                color: '#0F172A',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
            />
          </div>

          {editingRole && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              borderRadius: 8,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              fontSize: 12,
              color: '#64748B',
            }}>
              <Clock size={13} style={{ color: '#94A3B8' }} />
              <span>Created on {editingRole.created_at ? new Date(editingRole.created_at).toLocaleDateString() : '—'}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}