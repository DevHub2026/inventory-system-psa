import { useState, useEffect } from 'react'
import { Card, Button, Input, Table, Badge, Modal, Alert, Spinner, SearchBar, Pagination } from '@/components/ui'
import { userService, type UserFilters, type CreateUserPayload, type UpdateUserPayload, type ImportUsersResult } from '@/services/userService'
import { displayName } from '@/types'
import type { Column } from '@/components/ui'
import type { User } from '@/types'
import { PageHeader } from '@/components/PageHeader'

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

  useEffect(() => { void loadUsers() }, [filters])

  const handleSearch = (search: string) => setFilters({ ...filters, search, page: 1 })
  const handlePageChange = (page: number) => setFilters({ ...filters, page })

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({ employee_number: '', first_name: '', middle_name: '', last_name: '', email: '', password: '', department_id: null, status: 'active', roles: [] })
    setModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({ employee_number: user.employee_number || '', first_name: user.first_name || '', middle_name: user.middle_name || '', last_name: user.last_name || '', email: user.email, password: '', department_id: user.department_id || null, status: user.status || 'active', roles: [] })
    setModalOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete ${displayName(user)}?`)) return
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
    if (!importFile) { setMessage({ type: 'error', text: 'Please choose a file to import.' }); return }
    setImporting(true)
    setImportResult(null)
    setMessage(null)
    try {
      const result = await userService.importEmployees(importFile)
      setImportResult(result)
      setMessage({ type: 'success', text: `Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed.` })
      await loadUsers()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to import employees.' })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = (type: 'csv' | 'json') => {
    const headers = ['first_name', 'middle_name', 'last_name', 'id_number', 'email', 'role', 'department']
    const sample = { first_name: 'Juan', middle_name: 'Cruz', last_name: 'Marquez', id_number: '1234-5678', email: 'juan.marquez@example.com', role: 'Employee', department: 'Administration' }
    const content = type === 'csv'
      ? `${headers.join(',')}\n${headers.map((h) => sample[h as keyof typeof sample]).join(',')}\n`
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
    { key: 'employee_number', header: 'Employee No.', render: (u) => <span className="font-mono text-xs text-slate-600">{u.employee_number || '—'}</span> },
    { key: 'name',   header: 'Name',   render: (u) => <span className="font-medium text-slate-800">{displayName(u)}</span> },
    { key: 'email',  header: 'Email',  render: (u) => <span className="text-slate-600">{u.email}</span> },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'active' ? 'green' : 'yellow'}>{u.status || 'unknown'}</Badge> },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(u)}>Edit</Button>
          <Button size="sm" variant="danger"    onClick={() => handleDelete(u)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        subtitle="Manage system users and their accounts."
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportModalOpen(true)}>Import Employees</Button>
            <Button onClick={handleCreate}>Add User</Button>
          </>
        }
      />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      <Card noPadding>
        <div className="border-b border-[#EEF2F8] px-5 py-4">
          <SearchBar onSearch={handleSearch} placeholder="Search users…" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14"><Spinner /></div>
        ) : users.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-500">No users found.</div>
        ) : (
          <>
            <Table columns={columns} rows={users} rowKey={(u) => u.id} />
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

      {/* Add / Edit User modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Employee Number" value={formData.employee_number} onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
            <Input label="Last Name"  value={formData.last_name}  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
          </div>
          <Input label="Middle Name" value={formData.middle_name || ''} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          {!editingUser && (
            <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          )}
        </div>
      </Modal>

      {/* Import Employees modal */}
      <Modal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Employees"
        footer={
          <>
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-[#C5D8FF] bg-[#EEF4FF] p-3 text-sm text-[#003DA5]">
            Upload employee records as CSV, JSON, or XLSX. Usernames are generated as lowercase last name + ID number. Default password is <strong>psasarangani2026</strong>.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => downloadTemplate('csv')}>CSV Template</Button>
            <Button size="sm" variant="secondary" onClick={() => downloadTemplate('json')}>JSON Template</Button>
          </div>
          <Input label="Employee Import File" type="file" accept=".csv,.json,.xlsx" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
          {importResult && (
            <div className="grid grid-cols-4 gap-2 text-sm">
              {[
                { label: 'Total',    value: importResult.total_rows,  color: 'text-slate-700' },
                { label: 'Imported', value: importResult.imported,    color: 'text-emerald-700' },
                { label: 'Skipped',  value: importResult.skipped,     color: 'text-amber-700' },
                { label: 'Failed',   value: importResult.failed,      color: 'text-[#E31C23]' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-[#E2EAF3] p-2.5 text-center">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`mt-0.5 text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
