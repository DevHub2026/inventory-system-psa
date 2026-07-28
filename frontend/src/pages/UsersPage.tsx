﻿import { useCallback, useEffect, useState } from 'react'
import { Card, Button, Input, Table, Badge, Modal, Alert, Spinner, SearchBar, Pagination } from '@/components/ui'
import { userService, type UserFilters, type CreateUserPayload, type UpdateUserPayload, type ImportUsersResult, type ChangePasswordPayload } from '@/services/userService'
import { roleService, type Role } from '@/services/roleService'
import { setupService, type SetupRecord } from '@/services/setupService'
import { displayName } from '@/types'
import type { Column } from '@/components/ui'
import type { User } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { RoleBadges } from '@/components/RoleBadges'

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
  const [roles, setRoles] = useState<Role[]>([])
  const [offices, setOffices] = useState<SetupRecord[]>([])
  const [lookupWarning, setLookupWarning] = useState<string | null>(null)

  // Password change modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [passwordData, setPasswordData] = useState({ password: '', password_confirmation: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [resetSaving, setResetSaving] = useState(false)

  const [formData, setFormData] = useState<CreateUserPayload>({
    employee_number: '', username: '', first_name: '', middle_name: '', last_name: '',
    email: '', password: '', department_id: null, office_id: null, status: 'active', roles: [],
  })

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await userService.getUsers(filters)
      setUsers(result.items); setPagination(result.meta)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load users.' })
    } finally { setLoading(false) }
  }, [filters])

  const loadRoles = useCallback(async () => {
    try {
      const result = await roleService.getRoles({ per_page: 100 })
      setRoles(result.items)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load roles.' })
    }
  }, [])

  const loadOffices = useCallback(async () => {
    try {
      const loadedOffices = await setupService.list('offices')
      setOffices(Array.isArray(loadedOffices) ? loadedOffices : [])
      setLookupWarning(null)
    } catch (e: unknown) {
      setOffices([])
      setLookupWarning(e instanceof Error ? e.message : 'Office options could not be loaded.')
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadUsers() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadUsers])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadRoles() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadRoles])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadOffices() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadOffices])

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({ employee_number: '', username: '', first_name: '', middle_name: '', last_name: '', email: '', password: '', department_id: null, office_id: null, status: 'active', roles: [] })
    setModalOpen(true)
  }

  const handleEdit = (u: User) => {
    setEditingUser(u)
    setFormData({
      employee_number: u.employee_number || '',
      username: u.username || '',
      first_name: u.first_name || '',
      middle_name: u.middle_name || '',
      last_name: u.last_name || '',
      email: u.email,
      password: '',
      department_id: u.department_id || null,
      office_id: u.office_id || null,
      status: u.status || 'active',
      roles: u.roles?.map((role) => role.id) ?? [],
    })
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
      if (editingUser) {
        const updatePayload: UpdateUserPayload = {
          employee_number: formData.employee_number,
          username: formData.username,
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          email: formData.email,
          department_id: formData.department_id,
          office_id: formData.office_id,
          status: formData.status,
          roles: formData.roles,
        }
        await userService.updateUser(editingUser.id, updatePayload)
        setMessage({ type: 'success', text: 'User updated successfully.' })
      } else {
        await userService.createUser(formData)
        setMessage({ type: 'success', text: 'User created successfully.' })
      }
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

  const handleOpenPasswordModal = (u: User) => {
    setPasswordUser(u)
    setPasswordData({ password: '', password_confirmation: '' })
    setPasswordModalOpen(true)
  }

  const handleChangePassword = async () => {
    if (!passwordUser) return
    if (passwordData.password !== passwordData.password_confirmation) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (passwordData.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setPasswordSaving(true); setMessage(null)
    try {
      await userService.updateUserPassword(passwordUser.id, passwordData as ChangePasswordPayload)
      setMessage({ type: 'success', text: 'Password changed successfully.' })
      setPasswordModalOpen(false)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to change password.' })
    } finally { setPasswordSaving(false) }
  }

  const handleResetPassword = async (u: User) => {
    if (!confirm(`Reset password for ${displayName(u)} to default?`)) return
    setResetSaving(true); setMessage(null)
    try {
      await userService.resetUserPassword(u.id)
      setMessage({ type: 'success', text: 'Password reset successfully to default.' })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to reset password.' })
    } finally { setResetSaving(false) }
  }

  const downloadTemplate = (type: 'csv' | 'json') => {
    const headers = ['first_name', 'middle_name', 'last_name', 'id_number', 'email', 'role']
    const sample  = { first_name: 'Juan', middle_name: 'Cruz', last_name: 'Marquez', id_number: '1234-5678', email: 'juan.marquez@example.com', role: 'Employee' }
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
    { key: 'name',   header: 'Name',   render: (u) => <span className="font-medium text-[#1F2937]">{displayName(u)}</span> },
    { key: 'employee_number', header: 'Employee ID', render: (u) => <span className="font-mono text-xs text-[#6B7280]">{u.employee_number || '\u2014'}</span> },
    { key: 'username', header: 'Username', render: (u) => <span className="font-mono text-xs text-[#6B7280]">{u.username || '\u2014'}</span> },
    { key: 'department', header: 'Department', render: (u) => <span className="text-[#6B7280]">{u.department?.name || '\u2014'}</span> },
    { key: 'roles', header: 'Roles', render: (u) => <RoleBadges roles={u.roles ?? []} /> },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'active' ? 'green' : 'yellow'}>{u.status || 'unknown'}</Badge> },
    {
      key: 'actions', header: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(u)}>Edit</Button>
          <Button size="sm" variant="secondary" onClick={() => handleOpenPasswordModal(u)}>Password</Button>
          <Button size="sm" variant="secondary" onClick={() => handleResetPassword(u)} disabled={resetSaving}>Reset Pwd</Button>
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
          <SearchBar onSearch={(s) => setFilters({ ...filters, search: s, page: 1 })} placeholder="Search users..." />
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

      {/* Add / Edit User */}
      <Modal
        open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}
        maxWidth={600}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}</Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* ── Section: Identity ── */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Identity</p>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Employee Number" value={formData.employee_number} onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })} />
                <Input label="Username"        value={formData.username || ''}  onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input label="First Name"  value={formData.first_name}       onChange={(e) => setFormData({ ...formData, first_name:   e.target.value })} />
                <Input label="Middle Name" value={formData.middle_name || ''} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} />
                <Input label="Last Name"   value={formData.last_name}        onChange={(e) => setFormData({ ...formData, last_name:    e.target.value })} />
              </div>
            </div>
          </div>

          {/* ── Section: Account ── */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Account</p>
            <div className="space-y-3">
              <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              {!editingUser && (
                <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Office selector */}
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#475569]">Office</label>
                  <select
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/30"
                    value={formData.office_id ?? ''}
                    onChange={(e) => setFormData({ ...formData, office_id: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">No Office</option>
                    {(Array.isArray(offices) ? offices : []).map((off) => (
                      <option key={off.id} value={off.id}>{off.name}</option>
                    ))}
                  </select>
                  {lookupWarning && <p className="mt-1 text-xs text-[#B45309]">{lookupWarning}</p>}
                </div>

                {/* Status selector */}
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#475569]">Status</label>
                  <select
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/30"
                    value={formData.status ?? 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section: Roles ── */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Roles</p>
            {roles.length === 0 ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-[13px] text-[#64748B]">
                No roles available. Add roles first in Roles &amp; Permissions.
              </div>
            ) : (
              <div className="grid gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 sm:grid-cols-2">
                {roles.map((role) => {
                  const checked = formData.roles?.includes(role.id) ?? false
                  return (
                    <label key={role.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-[13px] font-medium text-[#1F2937] ring-1 ring-[#E5E7EB] transition-colors hover:bg-[#F0F7FF] hover:ring-[#BFDBFE]">
                      <input
                        type="checkbox"
                        checked={checked}
                        className="h-4 w-4 rounded accent-[#0D47A1]"
                        onChange={(event) => {
                          const currentRoles = formData.roles ?? []
                          const nextRoles = event.target.checked
                            ? [...currentRoles, role.id]
                            : currentRoles.filter((roleId) => roleId !== role.id)
                          setFormData({ ...formData, roles: nextRoles })
                        }}
                      />
                      <RoleBadges roles={[role]} maxVisible={1} />
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Change Password */}
      <Modal
        open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title={`Change Password: ${passwordUser ? displayName(passwordUser) : ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordModalOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={passwordSaving}>{passwordSaving ? 'Saving...' : 'Change Password'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={passwordData.password}
            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
          />
          <Input
            label="Confirm Password"
            type="password"
            value={passwordData.password_confirmation}
            onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
          />
          <p className="text-xs text-[#6B7280]">Password must be at least 8 characters with letters and numbers.</p>
        </div>
      </Modal>

      {/* Import Employees */}
      <Modal
        open={importModalOpen} onClose={() => setImportModalOpen(false)} title="Import Employees"
        footer={
          <>
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>{importing ? 'Importing...' : 'Import'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Instructions */}
          <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
            <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#1E40AF]">File Requirements</p>
            <div className="space-y-1.5 text-[13px] text-[#1E40AF]">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#1E40AF] text-[10px] font-bold text-white">R</span>
                <span>Required: <strong>first_name</strong>, <strong>last_name</strong>, <strong>id_number</strong>, <strong>email</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#BFDBFE] text-[10px] font-bold text-[#1E40AF]">O</span>
                <span>Optional: <strong>middle_name</strong>, <strong>username</strong>, <strong>role</strong> (defaults to Employee)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#BFDBFE] text-[10px] font-bold text-[#1E40AF]">i</span>
                <span>Default password: <strong>psagens9500</strong> · Accepted formats: CSV, JSON, XLSX</span>
              </div>
            </div>
          </div>

          {/* Template downloads */}
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#94A3B8]">Download Template</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadTemplate('csv')}
                className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] font-medium text-[#374151] transition-colors hover:border-[#0D47A1] hover:bg-[#EFF6FF] hover:text-[#0D47A1]"
              >
                <span className="rounded bg-[#F0FDF4] px-1.5 py-0.5 text-[10px] font-bold text-[#16A34A]">CSV</span>
                CSV Template
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate('json')}
                className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] font-medium text-[#374151] transition-colors hover:border-[#0D47A1] hover:bg-[#EFF6FF] hover:text-[#0D47A1]"
              >
                <span className="rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-bold text-[#1D4ED8]">JSON</span>
                JSON Template
              </button>
            </div>
          </div>

          {/* File picker */}
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#94A3B8]">Select File</p>
            <label
              htmlFor="import-file-input"
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 transition-colors ${
                importFile
                  ? 'border-[#22C55E] bg-[#F0FDF4]'
                  : 'border-[#CBD5E1] bg-[#F8FAFD] hover:border-[#0D47A1] hover:bg-[#EFF6FF]'
              }`}
            >
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${importFile ? 'bg-[#DCFCE7]' : 'bg-[#E2E8F0]'}`}>
                {importFile
                  ? <span className="text-[14px]">✓</span>
                  : <span className="text-[14px] text-[#94A3B8]">↑</span>
                }
              </div>
              <div className="min-w-0 flex-1">
                {importFile ? (
                  <>
                    <p className="truncate text-[13px] font-semibold text-[#15803D]">{importFile.name}</p>
                    <p className="text-[11px] text-[#6B7280]">{(importFile.size / 1024).toFixed(1)} KB — click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] font-medium text-[#374151]">Click to choose a file</p>
                    <p className="text-[11px] text-[#9CA3AF]">.csv, .json, .xlsx — max 10 MB</p>
                  </>
                )}
              </div>
              <input
                id="import-file-input"
                type="file"
                accept=".csv,.json,.xlsx"
                className="hidden"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Import result */}
          {importResult && (
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#94A3B8]">Result</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Total',    value: importResult.total_rows, color: 'text-[#1F2937]',   bg: 'bg-[#F8FAFC]',  border: 'border-[#E5E7EB]' },
                  { label: 'Imported', value: importResult.imported,   color: 'text-[#16A34A]',   bg: 'bg-[#F0FDF4]',  border: 'border-[#BBF7D0]' },
                  { label: 'Skipped',  value: importResult.skipped,    color: 'text-[#D97706]',   bg: 'bg-[#FFFBEB]',  border: 'border-[#FDE68A]' },
                  { label: 'Failed',   value: importResult.failed,     color: 'text-[#DC2626]',   bg: 'bg-[#FEF2F2]',  border: 'border-[#FECACA]' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-3 text-center`}>
                    <p className={`text-[18px] font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-[#6B7280]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

/* EmptyState local usage */
function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="text-[14px] font-semibold text-[#1F2937]">{title}</p>
      <p className="max-w-xs text-[13px] text-[#6B7280]">{description}</p>
    </div>
  )
}
