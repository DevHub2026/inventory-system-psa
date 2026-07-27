<<<<<<< HEAD
import { useState, useEffect } from 'react'
import { Card, Button, Input, Table, Badge, Modal, Alert, Spinner, SearchBar, Pagination, EmptyState } from '@/components/ui'
=======
﻿import { useCallback, useEffect, useState } from 'react'
import { Card, Button, Input, Table, Badge, Modal, Alert, Spinner, SearchBar, Pagination } from '@/components/ui'
>>>>>>> d3bea4edd8ed0a210cbfa4c0133e6c86ab94acb2
import { userService, type UserFilters, type CreateUserPayload, type UpdateUserPayload, type ImportUsersResult } from '@/services/userService'
import { roleService, type Role } from '@/services/roleService'
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

  const [formData, setFormData] = useState<CreateUserPayload>({
    employee_number: '', first_name: '', middle_name: '', last_name: '',
    email: '', password: '', department_id: null, status: 'active', roles: [],
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadUsers()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadUsers])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRoles()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadRoles])

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({ employee_number: '', first_name: '', middle_name: '', last_name: '', email: '', password: '', department_id: null, status: 'active', roles: [] })
    setModalOpen(true)
  }

  const handleEdit = (u: User) => {
    setEditingUser(u)
    setFormData({ employee_number: u.employee_number || '', first_name: u.first_name || '', middle_name: u.middle_name || '', last_name: u.last_name || '', email: u.email, password: '', department_id: u.department_id || null, status: u.status || 'active', roles: u.roles?.map((role) => role.id) ?? [] })
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
<<<<<<< HEAD
    const headers = ['first_name', 'middle_name', 'last_name', 'id_number', 'email', 'role', 'department']
    const samples = [
      { first_name: 'Juan', middle_name: 'Cruz', last_name: 'Marquez', id_number: '2026-0001', email: 'juan.marquez@psa.gov.ph', role: 'Employee', department: 'Administration' },
      { first_name: 'Maria', middle_name: 'Santos', last_name: 'Reyes', id_number: '2026-0002', email: 'maria.reyes@psa.gov.ph', role: 'Employee', department: 'Statistical Operations' },
    ]
=======
    const headers = ['first_name', 'middle_name', 'last_name', 'id_number', 'email', 'role']
    const sample  = { first_name: 'Juan', middle_name: 'Cruz', last_name: 'Marquez', id_number: '1234-5678', email: 'juan.marquez@example.com', role: 'Employee' }
>>>>>>> d3bea4edd8ed0a210cbfa4c0133e6c86ab94acb2
    const content = type === 'csv'
      ? `${headers.join(',')}\n${samples.map((s) => headers.map((h) => s[h as keyof typeof s]).join(',')).join('\n')}\n`
      : `${JSON.stringify(samples, null, 2)}\n`
    const blob = new Blob([content], { type: type === 'csv' ? 'text/csv' : 'application/json' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `employee-import-template.${type}`; link.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<User>[] = [
    { key: 'name',   header: 'Name',   render: (u) => <span className="font-medium text-[#1F2937]">{displayName(u)}</span> },
    { key: 'employee_number', header: 'Employee ID', render: (u) => <span className="font-mono text-xs text-[#6B7280]">{u.employee_number || '—'}</span> },
    { key: 'department', header: 'Department', render: (u) => <span className="text-[#6B7280]">{u.department?.name || '—'}</span> },
    { key: 'roles', header: 'Roles', render: (u) => <RoleBadges roles={u.roles ?? []} /> },
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
          <SearchBar onSearch={(s) => setFilters({ ...filters, search: s, page: 1 })} placeholder="Search usersâ€¦" />
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

      {/* â”€â”€ Add / Edit User â”€â”€ */}
      <Modal
        open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Savingâ€¦' : editingUser ? 'Save Changes' : 'Create User'}</Button>
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
          <div>
            <p className="mb-2 text-[12px] font-semibold text-[#475569]">Roles</p>
            {roles.length === 0 ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-[13px] text-[#64748B]">
                No roles available. Add roles first in Roles & Permissions.
              </div>
            ) : (
              <div className="grid gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 md:grid-cols-2">
                {roles.map((role) => {
                  const checked = formData.roles?.includes(role.id) ?? false
                  return (
                    <label key={role.id} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-[#1F2937] ring-1 ring-[#E5E7EB]">
                      <input
                        type="checkbox"
                        checked={checked}
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

      {/* â”€â”€ Import Employees â”€â”€ */}
      <Modal
        open={importModalOpen} onClose={() => { setImportModalOpen(false); setImportFile(null); setImportResult(null) }} title="Import Employees"
        footer={
          <>
<<<<<<< HEAD
            <Button variant="secondary" onClick={() => { setImportModalOpen(false); setImportFile(null); setImportResult(null) }}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>{importing ? 'Importing…' : 'Import'}</Button>
          </>
        }
      >
        <div className="space-y-5">

          {/* ── Info banner ── */}
          <div className="flex gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#3B82F6]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <div className="text-[13px] leading-relaxed text-[#1E40AF]">
              Upload employee records as <span className="font-semibold">CSV</span>, <span className="font-semibold">JSON</span>, or <span className="font-semibold">XLSX</span>.
              Usernames are generated as lowercase last name + ID number.{' '}
              Default password is{' '}
              <code className="rounded bg-[#DBEAFE] px-1.5 py-0.5 font-mono text-[12px] font-bold text-[#1E40AF]">psasarangani2026</code>.
            </div>
=======
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>{importing ? 'Importingâ€¦' : 'Import'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-[14px] text-[#1E40AF]">
            Upload employee records as CSV, JSON, or XLSX. Required columns are <strong>first_name</strong>, <strong>last_name</strong>, <strong>id_number</strong>, and <strong>email</strong>. Optional columns are <strong>middle_name</strong> and <strong>role</strong>. If role is empty, the existing default role is Employee. Department is not required for imports. Imported users receive the default password <strong>psagens9500</strong>.
>>>>>>> d3bea4edd8ed0a210cbfa4c0133e6c86ab94acb2
          </div>

          {/* ── Template downloads ── */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Download Template</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => downloadTemplate('csv')}>
                <svg className="mr-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                CSV Template
              </Button>
              <Button size="sm" variant="secondary" onClick={() => downloadTemplate('json')}>
                <svg className="mr-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                JSON Template
              </Button>
            </div>
          </div>

          {/* ── File upload area ── */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Employee Import File</p>
            <label
              htmlFor="employee-import-file"
              className={[
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors duration-150',
                importFile
                  ? 'border-[#0B3D91] bg-[#EFF6FF]'
                  : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#0B3D91] hover:bg-[#F0F4FF]',
              ].join(' ')}
            >
              {importFile ? (
                <>
                  <svg className="h-8 w-8 text-[#0B3D91]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-[14px] font-semibold text-[#0B3D91]">{importFile.name}</p>
                    <p className="text-[12px] text-[#64748B]">{(importFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 text-[12px] text-[#64748B] underline hover:text-[#C62828]"
                    onClick={(e) => { e.preventDefault(); setImportFile(null) }}
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <svg className="h-8 w-8 text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <div>
                    <p className="text-[14px] font-medium text-[#334155]">
                      Click to upload{' '}
                      <span className="text-[#0B3D91]">or drag and drop</span>
                    </p>
                    <p className="text-[12px] text-[#94A3B8]">CSV, JSON, or XLSX files</p>
                  </div>
                </>
              )}
              <input
                id="employee-import-file"
                type="file"
                accept=".csv,.json,.xlsx"
                className="sr-only"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* ── Import result summary ── */}
          {importResult && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Import Summary</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Total',    value: importResult.total_rows, bg: 'bg-[#F8FAFC]',  border: 'border-[#E2E8F0]', color: 'text-[#1F2937]' },
                  { label: 'Imported', value: importResult.imported,   bg: 'bg-[#F0FDF4]',  border: 'border-[#BBF7D0]', color: 'text-[#15803D]' },
                  { label: 'Skipped',  value: importResult.skipped,    bg: 'bg-[#FFFBEB]',  border: 'border-[#FDE68A]', color: 'text-[#B45309]' },
                  { label: 'Failed',   value: importResult.failed,     bg: 'bg-[#FEF2F2]',  border: 'border-[#FECACA]', color: 'text-[#D32F2F]' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-3 text-center`}>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">{s.label}</p>
                    <p className={`mt-1 text-[20px] font-bold ${s.color}`}>{s.value}</p>
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

<<<<<<< HEAD
/* EmptyState is imported from @/components/ui above */
=======
/* â”€â”€ EmptyState local usage â”€â”€ */
function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="text-[14px] font-semibold text-[#1F2937]">{title}</p>
      <p className="max-w-xs text-[13px] text-[#6B7280]">{description}</p>
    </div>
  )
}

>>>>>>> d3bea4edd8ed0a210cbfa4c0133e6c86ab94acb2
