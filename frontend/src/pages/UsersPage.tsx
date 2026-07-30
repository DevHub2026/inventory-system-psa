import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, Table, Badge, Modal, Alert, Spinner, SearchBar, Pagination } from '@/components/ui'
import { api } from '@/services/api'
import { userService, type UserFilters, type CreateUserPayload, type UpdateUserPayload, type ImportUsersResult, type ChangePasswordPayload } from '@/services/userService'
import { roleService, type Role } from '@/services/roleService'
import { setupService, type SetupRecord } from '@/services/setupService'
import { displayName } from '@/types'
import type { Column } from '@/components/ui'
import type { User, ApiResponse } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { RoleBadges } from '@/components/RoleBadges'

interface DepartmentOption {
  id: number
  name: string
}

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
  const [_departments, setDepartments] = useState<DepartmentOption[]>([])
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

  const navigate = useNavigate()

  const loadRoles = useCallback(async () => {
    try {
      const result = await roleService.getRoles({ per_page: 100 })
      setRoles(result.items)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load roles.' })
    }
  }, [])

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<DepartmentOption[]>>('/departments')
      setDepartments(data.data || [])
    } catch (e: unknown) {
      setDepartments([])
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load departments.' })
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
    const timeoutId = window.setTimeout(() => { void loadDepartments() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadDepartments])

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
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <button
          type="button"
          onClick={() => navigate(`/users/${u.id}`)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
            fontWeight: 600,
            fontSize: 14,
            color: '#0D47A1',
            textDecoration: 'underline',
            textDecorationColor: 'transparent',
            transition: 'text-decoration-color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecorationColor = '#0D47A1' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecorationColor = 'transparent' }}
          aria-label={`View profile for ${displayName(u)}`}
        >
          {displayName(u)}
        </button>
      ),
    },
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
        open={importModalOpen} onClose={() => { setImportModalOpen(false); setImportResult(null); setImportFile(null) }} title="Import Employees"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setImportModalOpen(false); setImportResult(null); setImportFile(null) }}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>
              {importing ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Importing…
                </span>
              ) : 'Import'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Field requirements ── */}
          <div style={{ borderRadius: 12, border: '1px solid #BFDBFE', background: '#EFF6FF', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1E40AF', marginBottom: 10 }}>
              File Requirements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Required */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{
                  flexShrink: 0, marginTop: 1,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#1E40AF', color: '#fff',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>R</span>
                <div style={{ fontSize: 12.5, color: '#1E3A8A', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 500 }}>Required: </span>
                  {['first_name','last_name','id_number','email'].map((f, i, a) => (
                    <span key={f}>
                      <code style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, background: '#DBEAFE', borderRadius: 3, padding: '0 4px' }}>{f}</code>
                      {i < a.length - 1 && <span style={{ color: '#93C5FD' }}>, </span>}
                    </span>
                  ))}
                </div>
              </div>
              {/* Optional */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{
                  flexShrink: 0, marginTop: 1,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#BFDBFE', color: '#1E40AF',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>O</span>
                <div style={{ fontSize: 12.5, color: '#1E3A8A', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 500 }}>Optional: </span>
                  {['middle_name','username','role'].map((f, i, a) => (
                    <span key={f}>
                      <code style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, background: '#DBEAFE', borderRadius: 3, padding: '0 4px' }}>{f}</code>
                      {i < a.length - 1 && <span style={{ color: '#93C5FD' }}>, </span>}
                    </span>
                  ))}
                  <span style={{ color: '#3B82F6' }}> — role defaults to Employee</span>
                </div>
              </div>
              {/* Divider */}
              <div style={{ borderTop: '1px solid #BFDBFE', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#1E3A8A' }}>
                  <span style={{ fontWeight: 500 }}>Default password: </span>
                  <code style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, background: '#DBEAFE', borderRadius: 3, padding: '0 5px' }}>psagens9500</code>
                </span>
                <span style={{ fontSize: 12, color: '#3B82F6' }}>Formats: CSV · JSON · XLSX</span>
              </div>
            </div>
          </div>

          {/* ── Download templates ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>
              Download Template
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { type: 'csv'  as const, label: 'CSV Template',  badge: 'CSV',  badgeBg: '#F0FDF4', badgeColor: '#15803D' },
                { type: 'json' as const, label: 'JSON Template', badge: 'JSON', badgeBg: '#EFF6FF', badgeColor: '#1D4ED8' },
              ]).map(({ type, label, badge, badgeBg, badgeColor }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => downloadTemplate(type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 8,
                    border: '1px solid #E2E8F0', background: '#fff',
                    fontSize: 13, fontWeight: 500, color: '#374151',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = '#1E40AF'; el.style.background = '#EFF6FF'; el.style.color = '#1E40AF'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = '#E2E8F0'; el.style.background = '#fff'; el.style.color = '#374151'
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, background: badgeBg, color: badgeColor, borderRadius: 4, padding: '1px 5px' }}>{badge}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── File picker ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>
              Select File
            </div>
            <label
              htmlFor="import-file-input"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
                border: `2px dashed ${importFile ? '#22C55E' : '#CBD5E1'}`,
                background: importFile ? '#F0FDF4' : '#F8FAFC',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!importFile) {
                  const el = e.currentTarget as HTMLLabelElement
                  el.style.borderColor = '#1E40AF'; el.style.background = '#EFF6FF'
                }
              }}
              onMouseLeave={(e) => {
                if (!importFile) {
                  const el = e.currentTarget as HTMLLabelElement
                  el.style.borderColor = '#CBD5E1'; el.style.background = '#F8FAFC'
                }
              }}
            >
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: importFile ? '#DCFCE7' : '#E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {importFile ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {importFile ? (
                  <>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15803D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {importFile.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {(importFile.size / 1024).toFixed(1)} KB · click to change
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>
                      Click to choose a file
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                      .csv, .json, .xlsx · max 10 MB
                    </div>
                  </>
                )}
              </div>

              {importFile && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setImportFile(null) }}
                  style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: 6,
                    border: '1px solid #BBF7D0', background: '#fff',
                    color: '#15803D', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.1s',
                  }}
                  title="Remove file"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}

              <input
                id="import-file-input"
                type="file"
                accept=".csv,.json,.xlsx"
                style={{ display: 'none' }}
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* ── Import result ── */}
          {importResult && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>
                Import Result
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Total',    value: importResult.total_rows, color: '#374151', bg: '#F8FAFC', border: '#E2E8F0', dot: '#94A3B8' },
                  { label: 'Imported', value: importResult.imported,   color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', dot: '#22C55E' },
                  { label: 'Skipped',  value: importResult.skipped,    color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B' },
                  { label: 'Failed',   value: importResult.failed,     color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' },
                ].map((s) => (
                  <div key={s.label} style={{
                    borderRadius: 10, border: `1px solid ${s.border}`,
                    background: s.bg, padding: '12px 10px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>{s.label}</span>
                    </div>
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
