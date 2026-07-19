import { useState, useEffect } from 'react'
import { Card, Button, Input, Table, Badge, Modal, Alert, Spinner, SearchBar, Pagination } from '@/components/ui'
import { userService, type UserFilters, type CreateUserPayload, type UpdateUserPayload, type ImportUsersResult } from '@/services/userService'
import { displayName } from '@/types'
import type { Column } from '@/components/ui'
import type { User } from '@/types'

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportUsersResult | null>(null)
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
    status: 'active',
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
      status: 'active',
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
      status: user.status || 'active',
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

  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please choose a CSV, JSON, or XLSX file to import.' })
      return
    }

    setImporting(true)
    setImportResult(null)
    setMessage(null)

    try {
      const result = await userService.importEmployees(importFile)
      setImportResult(result)
      setMessage({
        type: result.failed > 0 || result.skipped > 0 ? 'success' : 'success',
        text: `Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed.`,
      })
      await loadUsers()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to import employees.' })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = (type: 'csv' | 'json') => {
    const headers = ['first_name', 'middle_name', 'last_name', 'id_number', 'email', 'role', 'department']
    const sample = {
      first_name: 'Juan',
      middle_name: 'Cruz',
      last_name: 'Marquez',
      id_number: '1234-5678',
      email: 'juan.marquez@example.com',
      role: 'Employee',
      department: 'Administration',
    }
    const content =
      type === 'csv'
        ? `${headers.join(',')}\n${headers.map((header) => sample[header as keyof typeof sample]).join(',')}\n`
        : `${JSON.stringify([sample], null, 2)}\n`
    const blob = new Blob([content], { type: type === 'csv' ? 'text/csv' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `employee-import-template.${type}`
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<User>[] = [
    { key: 'employee_number', header: 'Employee No.', render: (u) => u.employee_number || '-' },
    { key: 'name', header: 'Name', render: (u) => displayName(u) },
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'active' ? 'green' : 'yellow'}>{u.status || 'UNKNOWN'}</Badge> },
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
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportModalOpen(true)}>
            Import Employees
          </Button>
          <Button onClick={handleCreate}>Add User</Button>
        </div>
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

      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Employees"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
            Upload employee records as CSV, JSON, or XLSX. Usernames are generated as lowercase last name without spaces + ID number, for example <strong>marquez1234-5678</strong>. Imported accounts use the temporary password <strong>psasarangani2026</strong>.
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => downloadTemplate('csv')}>
              Download CSV Template
            </Button>
            <Button size="sm" variant="secondary" onClick={() => downloadTemplate('json')}>
              Download JSON Template
            </Button>
          </div>

          <Input
            label="Employee Import File"
            type="file"
            accept=".csv,.json,.xlsx"
            onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
          />

          {importResult && (
            <div className="space-y-3">
              <div className="grid gap-2 text-sm md:grid-cols-4">
                <div className="rounded border p-2">
                  <div className="text-gray-500">Rows</div>
                  <div className="font-semibold">{importResult.total_rows}</div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-gray-500">Imported</div>
                  <div className="font-semibold text-green-700">{importResult.imported}</div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-gray-500">Skipped</div>
                  <div className="font-semibold text-yellow-700">{importResult.skipped}</div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-gray-500">Failed</div>
                  <div className="font-semibold text-red-700">{importResult.failed}</div>
                </div>
              </div>

              <div className="max-h-64 overflow-auto rounded border">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Username</th>
                      <th className="px-3 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {importResult.rows.map((row) => (
                      <tr key={`${row.row}-${row.email || row.username || row.status}`}>
                        <td className="px-3 py-2">{row.row}</td>
                        <td className="px-3 py-2">
                          <Badge tone={row.status === 'imported' ? 'green' : row.status === 'skipped' ? 'yellow' : 'red'}>
                            {row.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{row.username || '-'}</td>
                        <td className="px-3 py-2">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>
              {importing ? 'Importing...' : 'Import Employees'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
