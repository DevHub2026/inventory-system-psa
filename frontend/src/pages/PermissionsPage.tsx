import { useState, useEffect, useMemo } from 'react'
import { KeyRound, Plus, Layers, Filter } from 'lucide-react'
import { Card, Button, Input, Table, Modal, Alert, Spinner, SearchBar, Pagination, EmptyState, Dropdown } from '@/components/ui'
import type { Column } from '@/components/ui'
import { permissionService, type PermissionFilters, type CreatePermissionPayload, type UpdatePermissionPayload, type Permission } from '@/services/permissionService'
import { PageHeader } from '@/components/PageHeader'

const MODULES = ['Auth', 'Asset', 'Reservation', 'Borrowing', 'Inventory', 'Maintenance', 'Report', 'User', 'Role', 'Permission']

const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Auth:        { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  Asset:       { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  Reservation: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  Borrowing:   { bg: '#FAF5FF', text: '#7C3AED', border: '#DDD6FE' },
  Inventory:   { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  Maintenance: { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
  Report:      { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
  User:        { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  Role:        { bg: '#EEF4FF', text: '#0B3D91', border: '#C5D8FF' },
  Permission:  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
}

function moduleColor(module: string) {
  return MODULE_COLORS[module] ?? { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' }
}

export function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filters, setFilters] = useState<PermissionFilters>({ per_page: 15, page: 1 })
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 })
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState<CreatePermissionPayload>({
    name: '',
    module: '',
    description: '',
  })

  const loadPermissions = async () => {
    setLoading(true)
    try {
      const result = await permissionService.getPermissions(filters)
      setPermissions(result.items)
      setPagination(result.meta)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: (error instanceof Error ? error.message : '') || 'Failed to load permissions.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPermissions()
  }, [filters])

  const handleSearch = (s: string) => {
    setSearch(s)
    setFilters({ ...filters, search: s, page: 1 })
  }

  const handleModuleFilter = (module: string) => {
    setFilters({ ...filters, module: module === 'All' ? undefined : module, page: 1 })
  }

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
  }

  const handleCreate = () => {
    setEditingPermission(null)
    setFormData({ name: '', module: '', description: '' })
    setModalOpen(true)
  }

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission)
    setFormData({
      name: permission.name,
      module: permission.module,
      description: permission.description || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (permission: Permission) => {
    if (!confirm(`Delete permission "${permission.name}"?`)) return
    try {
      await permissionService.deletePermission(permission.id)
      setMessage({ type: 'success', text: 'Permission deleted.' })
      await loadPermissions()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: (error instanceof Error ? error.message : '') || 'Failed to delete permission.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage(null)
    try {
      if (editingPermission) {
        await permissionService.updatePermission(editingPermission.id, formData as UpdatePermissionPayload)
        setMessage({ type: 'success', text: 'Permission updated.' })
      } else {
        await permissionService.createPermission(formData)
        setMessage({ type: 'success', text: 'Permission created.' })
      }
      setModalOpen(false)
      await loadPermissions()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: (error instanceof Error ? error.message : '') || 'Failed to save permission.' })
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<Permission>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Permission Name',
      render: (p) => (
        <code style={{
          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
          fontSize: 12, color: '#1E293B', fontWeight: 600,
          background: '#F1F5F9', padding: '3px 8px', borderRadius: 6,
          display: 'inline-block',
        }}>
          {p.name}
        </code>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      render: (p) => {
        const mc = moduleColor(p.module)
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 600,
            background: mc.bg, color: mc.text, border: `1px solid ${mc.border}`,
            whiteSpace: 'nowrap',
          }}>
            {p.module}
          </span>
        )
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: (p) => (
        <span style={{ fontSize: 13, color: '#64748B' }}>
          {p.description || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="secondary" onClick={() => handleEdit(p)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => void handleDelete(p)}>Delete</Button>
        </div>
      ),
    },
  ], [])

  const moduleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of permissions) {
      counts[p.module] = (counts[p.module] || 0) + 1
    }
    return counts
  }, [permissions])

  const stats = useMemo(() => [
    { label: 'Total Permissions', value: pagination.total, icon: KeyRound, color: '#0B3D91', bg: '#EEF4FF' },
    { label: 'Modules Covered', value: Object.keys(moduleCounts).length, icon: Layers, color: '#7C3AED', bg: '#FAF5FF' },
    { label: 'Active Filter', value: filters.module || 'All', icon: Filter, color: '#D97706', bg: '#FFFBEB' },
  ], [pagination.total, moduleCounts, filters.module])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      <PageHeader
        title="Permissions"
        subtitle="Manage system permissions and access control."
        actions={<Button onClick={handleCreate}><Plus size={14} /> Add Permission</Button>}
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
        {/* Search + module filter */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          borderBottom: '1px solid #F1F5F9', padding: '14px 20px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 0', minWidth: 200 }}>
            <SearchBar onSearch={handleSearch} placeholder="Search permissions…" />
          </div>
          <div style={{ width: 200, flexShrink: 0 }}>
            <Dropdown
              options={['All', ...MODULES].map((m) => ({ label: m, value: m }))}
              placeholder="Module: All"
              value={filters.module || 'All'}
              onChange={(e) => handleModuleFilter(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Spinner />
          </div>
        ) : permissions.length === 0 ? (
          <div style={{ padding: '60px 0' }}>
            <EmptyState
              title={search || filters.module ? 'No permissions match your filters' : 'No permissions yet'}
              description={search || filters.module ? 'Try adjusting your search or module filter.' : 'Add your first permission to control access.'}
            />
          </div>
        ) : (
          <>
            <Table columns={columns} rows={permissions} rowKey={(p) => p.id} />
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
        title={editingPermission ? 'Edit Permission' : 'Add Permission'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !formData.name.trim() || !formData.module}>
              {saving ? 'Saving…' : editingPermission ? 'Save Changes' : 'Add Permission'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input
            label="Permission Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. asset.create"
          />
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Module
            </label>
            <Dropdown
              options={MODULES.map((m) => ({ label: m, value: m }))}
              placeholder="Select a module"
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
            />
          </div>
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
              placeholder="Describe what this permission allows…"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}