import { useState, useEffect, useMemo } from 'react'
import { Shield, Plus, Users, KeyRound, Clock } from 'lucide-react'
import { Card, Button, Input, Table, Modal, Alert, Spinner, SearchBar, Pagination, Badge, EmptyState } from '@/components/ui'
import type { Column } from '@/components/ui'
import { roleService, type RoleFilters, type CreateRolePayload, type UpdateRolePayload, type Role } from '@/services/roleService'
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
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState<CreateRolePayload>({ name: '', description: '', permissions: [] })

  const loadRoles = async () => {
    setLoading(true)
    try {
      const result = await roleService.getRoles(filters)
      setRoles(result.items)
      setPagination(result.meta)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load roles.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadRoles() }, [filters])

  const handleSearch = (s: string) => {
    setSearch(s)
    setFilters({ ...filters, search: s, page: 1 })
  }

  const handlePageChange = (page: number) => setFilters({ ...filters, page })

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
    if (!confirm(`Delete role "${role.name}"?`)) return
    try {
      await roleService.deleteRole(role.id)
      setMessage({ type: 'success', text: 'Role deleted.' })
      await loadRoles()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete role.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage(null)
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, formData as UpdateRolePayload)
        setMessage({ type: 'success', text: 'Role updated.' })
      } else {
        await roleService.createRole(formData)
        setMessage({ type: 'success', text: 'Role created.' })
      }
      setModalOpen(false)
      await loadRoles()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save role.' })
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<Role>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Role Name',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#EEF4FF', border: '1px solid #C5D8FF',
          }}>
            <Shield size={15} style={{ color: '#0B3D91' }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 13.5, color: '#0F172A' }}>{r.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (r) => (
        <span style={{ fontSize: 13, color: '#64748B' }}>
          {r.description || '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (r) => (
        <span style={{ fontSize: 12, color: '#94A3B8' }}>
          {r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      render: (r) => (
        <span style={{ fontSize: 12, color: '#94A3B8' }}>
          {r.updated_at ? new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="secondary" onClick={() => handleEdit(r)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => void handleDelete(r)}>Delete</Button>
        </div>
      ),
    },
  ], [])

  const stats = useMemo(() => [
    { label: 'Total Roles', value: pagination.total, icon: Shield, color: '#0B3D91', bg: '#EEF4FF' },
    { label: 'System Roles', value: roles.filter((r) => ['admin', 'staff', 'employee'].includes(r.name.toLowerCase())).length, icon: Users, color: '#7C3AED', bg: '#FAF5FF' },
    { label: 'Custom Roles', value: roles.filter((r) => !['admin', 'staff', 'employee'].includes(r.name.toLowerCase())).length, icon: KeyRound, color: '#D97706', bg: '#FFFBEB' },
  ], [pagination.total, roles])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage what each type of user can access."
        actions={<Button onClick={handleCreate}><Plus size={14} /> Add Role</Button>}
      />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{
            background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0',
            padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: stat.bg,
            }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main table card */}
      <Card noPadding>
        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          borderBottom: '1px solid #F1F5F9', padding: '14px 20px',
        }}>
          <SearchBar onSearch={handleSearch} placeholder="Search roles by name…" />
          <Badge tone="blue">{pagination.total} {pagination.total === 1 ? 'role' : 'roles'}</Badge>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Spinner />
          </div>
        ) : roles.length === 0 ? (
          <div style={{ padding: '60px 0' }}>
            <EmptyState
              title={search ? 'No roles match your search' : 'No roles yet'}
              description={search ? 'Try a different search term.' : 'Add your first role to control user access.'}
            />
          </div>
        ) : (
          <>
            <Table columns={columns} rows={roles} rowKey={(r) => r.id} />
            <div style={{ borderTop: '1px solid #F1F5F9', padding: '10px 20px' }}>
              <Pagination
                page={pagination.current_page}
                lastPage={pagination.last_page}
                total={pagination.total}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </Card>

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'Add Role'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !formData.name.trim()}>
              {saving ? 'Saving…' : editingRole ? 'Save Changes' : 'Add Role'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Property Custodian"
          />
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Description
            </label>
            <textarea
              style={{
                width: '100%', borderRadius: 10, border: '1px solid #E5E7EB',
                background: '#fff', padding: '10px 12px', fontSize: 14, color: '#1F2937',
                outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: 80,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)', boxSizing: 'border-box',
              }}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this role can do…"
              rows={3}
            />
          </div>
          {editingRole && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0',
              fontSize: 12, color: '#64748B',
            }}>
              <Clock size={13} style={{ color: '#94A3B8' }} />
              Created {editingRole.created_at ? new Date(editingRole.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}