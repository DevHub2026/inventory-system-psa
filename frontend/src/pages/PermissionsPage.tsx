import { useState, useEffect } from 'react'
import { Card, Button, Input, Table, Modal, Alert, Spinner, SearchBar, Pagination, Dropdown } from '@/components/ui'
import { permissionService, type PermissionFilters, type CreatePermissionPayload, type UpdatePermissionPayload, type Permission } from '@/services/permissionService'
import type { Column } from '@/components/ui'

export function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filters, setFilters] = useState<PermissionFilters>({ per_page: 15, page: 1 })
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 })

  const [formData, setFormData] = useState<CreatePermissionPayload>({
    name: '',
    module: '',
    description: '',
  })

  const modules = ['Auth', 'Asset', 'Reservation', 'Borrowing', 'Inventory', 'Maintenance', 'Report', 'User', 'Role', 'Permission']

  const loadPermissions = async () => {
    setLoading(true)
    try {
      const result = await permissionService.getPermissions(filters)
      setPermissions(result.items)
      setPagination(result.meta)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to load permissions.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPermissions()
  }, [filters])

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search, page: 1 })
  }

  const handleModuleFilter = (module: string) => {
    setFilters({ ...filters, module: module === 'All' ? undefined : module, page: 1 })
  }

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
  }

  const handleCreate = () => {
    setEditingPermission(null)
    setFormData({
      name: '',
      module: '',
      description: '',
    })
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
    if (!confirm(`Are you sure you want to delete ${permission.name}?`)) return

    try {
      await permissionService.deletePermission(permission.id)
      setMessage({ type: 'success', text: 'Permission deleted successfully.' })
      await loadPermissions()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete permission.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage(null)

    try {
      if (editingPermission) {
        await permissionService.updatePermission(editingPermission.id, formData as UpdatePermissionPayload)
        setMessage({ type: 'success', text: 'Permission updated successfully.' })
      } else {
        await permissionService.createPermission(formData)
        setMessage({ type: 'success', text: 'Permission created successfully.' })
      }
      setModalOpen(false)
      await loadPermissions()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save permission.' })
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<Permission>[] = [
    { key: 'name', header: 'Name', render: (p) => p.name },
    { key: 'module', header: 'Module', render: (p) => p.module },
    { key: 'description', header: 'Description', render: (p) => p.description || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(p)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(p)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Permissions</h1>
          <p className="text-sm text-gray-500">Manage system permissions and access control</p>
        </div>
        <Button onClick={handleCreate}>Add Permission</Button>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        <div className="mb-4 flex gap-4">
          <SearchBar onSearch={handleSearch} placeholder="Search permissions..." />
          <Dropdown
            options={['All', ...modules].map((module) => ({ label: module, value: module }))}
            placeholder="Module: All"
            value={filters.module || 'All'}
            onChange={(e) => handleModuleFilter(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No permissions found</div>
        ) : (
          <>
            <Table columns={columns} rows={permissions} rowKey={(p) => p.id} />
            <div className="mt-4">
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
        title={editingPermission ? 'Edit Permission' : 'Add Permission'}
      >
        <div className="space-y-4">
          <Input
            label="Permission Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., asset.create"
          />
          <Dropdown
            label="Module"
            options={modules.map((module) => ({ label: module, value: module }))}
            placeholder="Select a module"
            value={formData.module}
            onChange={(e) => setFormData({ ...formData, module: e.target.value })}
          />
          <Input
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingPermission ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
