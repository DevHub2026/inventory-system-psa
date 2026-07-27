import { useState, useEffect } from 'react'
import { Card, Button, Input, Table, Modal, Alert, Spinner, SearchBar, Pagination } from '@/components/ui'
import { roleService, type RoleFilters, type CreateRolePayload, type UpdateRolePayload, type Role } from '@/services/roleService'
import type { Column } from '@/components/ui'
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

  const handleSearch  = (search: string) => setFilters({ ...filters, search, page: 1 })
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

  const columns: Column<Role>[] = [
    { key: 'name',        header: 'Name',        render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-slate-600">{r.description || '—'}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(r)}>Edit</Button>
          <Button size="sm" variant="danger"    onClick={() => handleDelete(r)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage what each type of user can access."
        actions={<Button onClick={handleCreate}>Add Role</Button>}
      />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      <Card noPadding>
        <div className="border-b border-[#EEF2F8] px-5 py-4">
          <SearchBar onSearch={handleSearch} placeholder="Search roles…" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14"><Spinner /></div>
        ) : roles.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-500">No roles found. Add a role to control user access.</div>
        ) : (
          <>
            <Table columns={columns} rows={roles} rowKey={(r) => r.id} />
            <div className="border-t border-[#EEF2F8] px-5 py-3">
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'Add Role'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : editingRole ? 'Save Changes' : 'Add Role'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  )
}
