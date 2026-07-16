import { useState, useEffect } from 'react'
import { Card, Button, Input, Table, Badge, Modal, Alert, Spinner, SearchBar, Pagination } from '@/components/ui'
import { userService, type UserFilters, type CreateUserPayload, type UpdateUserPayload } from '@/services/userService'
import { displayName } from '@/types'
import type { Column } from '@/components/ui'
import type { User } from '@/types'

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filters, setFilters] = useState<UserFilters>({ per_page: 15, page: 1 })
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 })

  const [formData, setFormData] = useState<CreateUserPayload>({
    employee_number: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    password: '',
    department_id: null,
    status: 'ACTIVE',
    roles: [],
  })

  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await userService.getUsers(filters)
      setUsers(result.items)
      setPagination(result.meta)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to load users.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [filters])

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search, page: 1 })
  }

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
  }

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      employee_number: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      password: '',
      department_id: null,
      status: 'ACTIVE',
      roles: [],
    })
    setModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      employee_number: user.employee_number || '',
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      last_name: user.last_name || '',
      email: user.email,
      password: '',
      department_id: user.department_id || null,
      status: user.status || 'ACTIVE',
      roles: [],
    })
    setModalOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${displayName(user)}?`)) return

    try {
      await userService.deleteUser(user.id)
      setMessage({ type: 'success', text: 'User deleted successfully.' })
      await loadUsers()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete user.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage(null)

    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, formData as UpdateUserPayload)
        setMessage({ type: 'success', text: 'User updated successfully.' })
      } else {
        await userService.createUser(formData)
        setMessage({ type: 'success', text: 'User created successfully.' })
      }
      setModalOpen(false)
      await loadUsers()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save user.' })
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<User>[] = [
    { key: 'employee_number', header: 'Employee No.', render: (u) => u.employee_number || '-' },
    { key: 'name', header: 'Name', render: (u) => displayName(u) },
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'ACTIVE' ? 'green' : 'yellow'}>{u.status || 'UNKNOWN'}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(u)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>
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
          <h1 className="text-lg font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">Manage system users and their accounts</p>
        </div>
        <Button onClick={handleCreate}>Add User</Button>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} placeholder="Search users..." />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No users found</div>
        ) : (
          <>
            <Table columns={columns} rows={users} rowKey={(u) => u.id} />
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
        title={editingUser ? 'Edit User' : 'Add User'}
      >
        <div className="space-y-4">
          <Input
            label="Employee Number"
            value={formData.employee_number}
            onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
          <Input
            label="Middle Name"
            value={formData.middle_name || ''}
            onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {!editingUser && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
