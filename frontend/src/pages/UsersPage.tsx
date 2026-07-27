import { useState, useEffect } from 'react'
import { Card, Button, Input, Table, Badge, Modal, Alert, Spinner, SearchBar, Pagination } from '@/components/ui'
import { userService, type UserFilters, type CreateUserPayload, type UpdateUserPayload, type ImportUsersResult } from '@/services/userService'
import { displayName } from '@/types'
import type { Column } from '@/components/ui'
import type { User } from '@/types'
import { PageHeader } from '@/components/PageHeader'

export function UsersPage() {
  const [users,           setUsers]           = useState<User[]>([])
  const [loading,         setLoading]         = useState(true)
  const [modalOpen,       setModalOpen]       = useState(false)
  const [editingUser,     setEditingUser]     = useState<User | null>(null)
  const [saving,          setSaving]          = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importFile,      setImportFile]      = useState<File | null>(null)
  const [importing,       setImporting]       = useState(false)
  const [importResult,    setImportResult]    = useState<ImportUsersResult | null>(null)
  const [message,         setMessage]         = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filters,         setFilters]         = useState<UserFilters>({ per_page: 15, page: 1 })
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 })

  const [formData, setFormData] = useState<CreateUserPayload>({
    employee_number: '', first_name: '', middle_name: '', last_name: '',
    email: '', password: '', department_id: null, status: 'active', roles: [],
  })

  const loadUsers = async () => {
    setLoading(true)
    try {
      const result = await userService.getUsers(filters)
      setUsers(result.items); setPagination(result.meta)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load users.' })
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadUsers() }, [filters])

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({ employee_number: '', first_name: '', middle_name: '', last_name: '', email: '', password: '', department_id: null, status: 'active', roles: [] })
    setModalOpen(true)
  }

  const handleEdit = (u: User) => {
    setEditingUser(u)
    setFormData({ employee_number: u.employee_number || '', first_name: u.first_name || '', middle_name: u.middle_name || '', last_name: u.last_name || '', email: u.email, password: '', department_id: u.department_id || null, status: u.status || 'active', roles: [] })
    setModalOpen(true)
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete ${displayName(u)}?`)) return
    try {
      await userService.deleteUser(u.id)
      setMessage({ type: 'success', text: 'User deleted successfully.' })
      await loadUsers()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete user.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true); setMessage(null)
    try {
      if (editingUser) { await userService.updateUser(editingUser.id, formData as UpdateUserPayload); setMessage({ type: 'success', text: 'User updated successfully.' }) }
      else             { await userService.createUser(formData);                                        setMessage({ type: 'success', text: 'User created successfully.' }) }
      setModalOpen(false); await loadUsers()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save user.' })
    } finally { setSaving(false) }
  }

  const handleImport = async () => {
    if (!importFile) { setMessage({ type: 'error', text: 'Please choose a file to import.' }); return }
    setImporting(true); setImportResult(null); setMessage(null)
    try {
      const result = await userService.importEmployees(importFile)
      setImportResult(result)
      setMessage({ type: 'success', text: `Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed.` })
      await loadUsers()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to import employees.' })
    } finally { setImporting(false) }
  }

  const downloadTemplate = (type: 'csv' | 'json') => {
    const headers = ['first_name', 'middle_name', 'last_name', 'id_number', 'email', 'role', 'department']
    const sample  = { first_name: 'Juan', middle_name: 'Cruz', last_name: 'Marquez', id_number: '1234-5678', email: 'juan.marquez@example.com', role: 'Employee', department: 'Administration' }
    const content = type === 'csv'
      ? `${headers.join(',')}\n${headers.map((h) => sample[h as keyof typeof sample]).join(',')}\n`
      : `${JSON.stringify([sample], null, 2)}\n`
    const blob = new Blob([content], { type: type === 'csv' ? 'text/csv' : 'application/json' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `employee-import-template.${type}`; link.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<User>[] = [
    { key: 'employee_number', header: 'Employee No.', render: (u) => <span className="font-mono text-xs text-[#6B7280]">{u.employee_number || '—'}</span> },
    { key: 'name',   header: 'Name',   render: (u) => <span className="font-medium text-[#1F2937]">{displayName(u)}</span> },
    { key: 'email',  header: 'Email',  render: (u) => <span className="text-[#6B7280]">{u.email}</span> },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'active' ? 'green' : 'yellow'}>{u.status || 'unknown'}</Badge> },
    {
      key: 'actions', header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(u)}>Edit</Button>
          <Button size="sm" variant="danger"    onClick={() => handleDelete(u)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
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

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <Card noPadding>
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <SearchBar onSearch={(s) => setFilters({ ...filters, search: s, page: 1 })} placeholder="Search users…" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : users.length === 0 ? (
          <div className="py-16"><EmptyState title="No users found" description="Add users or adjust the search filter." /></div>
        ) : (
          <>
            <Table columns={columns} rows={users} rowKey={(u) => u.id} />
            <div className="border-t border-[#E5E7EB] px-5 py-3">
              <Pagination page={pagination.current_page} lastPage={pagination.last_page} total={pagination.total} onPageChange={(p) => setFilters({ ...filters, page: p })} />
            </div>
          </>
        )}
      </Card>

      {/* ── Add / Edit User ── */}
      <Modal
        open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Employee Number" value={formData.employee_number} onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="First Name" value={formData.first_name}  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
            <Input label="Last Name"  value={formData.last_name}   onChange={(e) => setFormData({ ...formData, last_name:  e.target.value })} />
          </div>
          <Input label="Middle Name" value={formData.middle_name || ''} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          {!editingUser && (
            <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          )}
        </div>
      </Modal>

      {/* ── Import Employees ── */}
      <Modal
        open={importModalOpen} onClose={() => setImportModalOpen(false)} title="Import Employees"
        footer={
          <>
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>{importing ? 'Importing…' : 'Import'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-[14px] text-[#1E40AF]">
            Upload employee records as CSV, JSON, or XLSX. Usernames are generated as lowercase last name + ID number. Default password is <strong>psasarangani2026</strong>.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => downloadTemplate('csv')}>CSV Template</Button>
            <Button size="sm" variant="secondary" onClick={() => downloadTemplate('json')}>JSON Template</Button>
          </div>
          <Input label="Employee Import File" type="file" accept=".csv,.json,.xlsx" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
          {importResult && (
            <div className="grid grid-cols-4 gap-2 text-[14px]">
              {[
                { label: 'Total',    value: importResult.total_rows, color: 'text-[#1F2937]' },
                { label: 'Imported', value: importResult.imported,   color: 'text-[#2E7D32]' },
                { label: 'Skipped',  value: importResult.skipped,    color: 'text-[#B45309]' },
                { label: 'Failed',   value: importResult.failed,     color: 'text-[#D32F2F]' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-[#E5E7EB] p-3 text-center">
                  <p className="text-[12px] text-[#6B7280]">{s.label}</p>
                  <p className={`mt-0.5 text-[18px] font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

/* ── EmptyState local usage ── */
function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="text-[14px] font-semibold text-[#1F2937]">{title}</p>
      <p className="max-w-xs text-[13px] text-[#6B7280]">{description}</p>
    </div>
  )
}
