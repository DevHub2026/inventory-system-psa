import { useCallback, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users as UsersIcon,
  UserCheck,
  UserX,
  Shield,
  Plus,
  Upload,
  Search,
  Key,
  RotateCcw,
  Edit,
  Trash2,
  FileSpreadsheet,
  Download,
  Info,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { Alert, Badge, Button, EmptyState, Input, Modal, Spinner, Pagination } from '@/components/ui'
import { api } from '@/services/api'
import {
  userService,
  type UserFilters,
  type CreateUserPayload,
  type UpdateUserPayload,
  type ImportUsersResult,
  type ChangePasswordPayload,
} from '@/services/userService'
import { roleService, type Role } from '@/services/roleService'
import { setupService, type SetupRecord } from '@/services/setupService'
import { displayName } from '@/types'
import type { User, ApiResponse } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { RoleBadges } from '@/components/RoleBadges'

interface DepartmentOption {
  id: number
  name: string
}

function generateUsername(lastName: string, employeeNumber: string): string {
  const sanitized = lastName.toLowerCase().replace(/[^a-z0-9]/g, '')
  return sanitized + employeeNumber.trim()
}

export function UsersPage() {
  const navigate = useNavigate()
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
  const [pagination,      setPagination]      = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 })
  const [roles,           setRoles]           = useState<Role[]>([])
  const [departments,     setDepartments]     = useState<DepartmentOption[]>([])
  const [offices,         setOffices]         = useState<SetupRecord[]>([])

  // Local filter bar state
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Password change modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [passwordData, setPasswordData] = useState({ password: '', password_confirmation: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [resetSaving, setResetSaving] = useState(false)

  const [formData, setFormData] = useState<CreateUserPayload>({
    employee_number: '',
    username: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    password: '',
    department_id: null,
    office_id: null,
    status: 'active',
    roles: [],
    email_notifications_enabled: true,
  })

  const updateUsername = (patch: Partial<CreateUserPayload>, current: CreateUserPayload) => {
    const next = { ...current, ...patch }
    if (!editingUser) {
      next.username = generateUsername(next.last_name, next.employee_number)
    }
    return next
  }

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await userService.getUsers(filters)
      setUsers(result.items || [])
      setPagination(result.meta || { current_page: 1, per_page: 15, total: (result.items || []).length, last_page: 1 })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load users.' })
    } finally {
      setLoading(false)
    }
  }, [filters])

  const loadRoles = useCallback(async () => {
    try {
      const result = await roleService.getRoles({ per_page: 100 })
      setRoles(result.items || [])
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load roles.' })
    }
  }, [])

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await api.get<ApiResponse<DepartmentOption[]>>('/departments')
      setDepartments(data.data || [])
    } catch {
      setDepartments([])
    }
  }, [])

  const loadOffices = useCallback(async () => {
    try {
      const loadedOffices = await setupService.list('offices')
      setOffices(Array.isArray(loadedOffices) ? loadedOffices : [])
    } catch {
      setOffices([])
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  useEffect(() => {
    void loadRoles()
    void loadDepartments()
    void loadOffices()
  }, [loadRoles, loadDepartments, loadOffices])

  // Filtered users
  const filteredUsers = useMemo(() => {
    let list = users
    if (statusTab !== 'all') {
      list = list.filter((u) => u.status === statusTab)
    }
    if (selectedDept) {
      list = list.filter((u) => u.department_id === Number(selectedDept))
    }
    if (selectedRole) {
      list = list.filter((u) => (u.roles || []).some((r) => r.name === selectedRole || String(r.id) === selectedRole))
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      list = list.filter((u) => {
        const full = displayName(u).toLowerCase()
        const emp = (u.employee_number || '').toLowerCase()
        const usr = (u.username || '').toLowerCase()
        const em = (u.email || '').toLowerCase()
        return full.includes(term) || emp.includes(term) || usr.includes(term) || em.includes(term)
      })
    }
    return list
  }, [users, statusTab, selectedDept, selectedRole, searchTerm])

  // Summary counts
  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === 'active').length
    const inactive = users.filter((u) => u.status === 'inactive').length
    const withRoles = users.filter((u) => (u.roles || []).length > 0).length
    return { total, active, inactive, withRoles }
  }, [users])

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      employee_number: '',
      username: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      password: '',
      department_id: null,
      office_id: null,
      status: 'active',
      roles: [],
      email_notifications_enabled: true,
    })
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
      email_notifications_enabled: u.email_notifications_enabled ?? true,
    })
    setModalOpen(true)
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete ${displayName(u)}? This action cannot be undone.`)) return
    try {
      await userService.deleteUser(u.id)
      setMessage({ type: 'success', text: `User account for "${displayName(u)}" has been deleted.` })
      await loadUsers()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete user.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage(null)
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
          email_notifications_enabled: formData.email_notifications_enabled,
        }
        await userService.updateUser(editingUser.id, updatePayload)
        setMessage({ type: 'success', text: `User "${formData.first_name} ${formData.last_name}" updated successfully.` })
      } else {
        await userService.createUser(formData)
        setMessage({ type: 'success', text: `User "${formData.first_name} ${formData.last_name}" created successfully.` })
      }
      setModalOpen(false)
      await loadUsers()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save user.' })
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file to import.' })
      return
    }
    setImporting(true)
    setImportResult(null)
    setMessage(null)
    try {
      const result = await userService.importEmployees(importFile)
      setImportResult(result)
      setMessage({
        type: 'success',
        text: `Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed.`,
      })
      await loadUsers()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to import employees.' })
    } finally {
      setImporting(false)
    }
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
    setPasswordSaving(true)
    setMessage(null)
    try {
      await userService.updateUserPassword(passwordUser.id, passwordData as ChangePasswordPayload)
      setMessage({ type: 'success', text: `Password changed successfully for ${displayName(passwordUser)}.` })
      setPasswordModalOpen(false)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to change password.' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleResetPassword = async (u: User) => {
    if (!confirm(`Reset password for ${displayName(u)} to the default temporary password?`)) return
    setResetSaving(true)
    setMessage(null)
    try {
      await userService.resetUserPassword(u.id)
      setMessage({ type: 'success', text: `Password for ${displayName(u)} has been reset to default.` })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to reset password.' })
    } finally {
      setResetSaving(false)
    }
  }

  const downloadTemplate = (type: 'csv' | 'json') => {
    const headers = ['first_name', 'middle_name', 'last_name', 'id_number', 'email', 'role']
    const sample = {
      first_name: 'Juan',
      middle_name: 'Cruz',
      last_name: 'Marquez',
      id_number: '20250012',
      email: 'juan.marquez@example.com',
      role: 'Employee',
    }
    const content =
      type === 'csv'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* ── Page Header ── */}
      <PageHeader
        title="Users"
        subtitle="Manage employee accounts, security credentials, system permissions, and role assignments."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              variant="secondary"
              onClick={() => {
                setImportResult(null)
                setImportFile(null)
                setImportModalOpen(true)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                height: 40,
                paddingInline: 14,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <Upload size={15} />
              <span>Import Employees</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                height: 40,
                paddingInline: 18,
                fontWeight: 700,
                fontSize: 13.5,
                background: '#0B3D91',
              }}
            >
              <Plus size={16} />
              <span>Add User</span>
            </Button>
          </div>
        }
      />

      {/* Alert message */}
      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ── Summary Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
      }}>
        {/* Total Users */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#EFF6FF',
            color: '#0B3D91',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UsersIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Total Users
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Active Accounts */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#F0FDF4',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Active Accounts
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A', lineHeight: 1.1 }}>
              {stats.active}
            </div>
          </div>
        </div>

        {/* Role Assignments */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#EEF2FF',
            color: '#4338CA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Role Assignments
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4338CA', lineHeight: 1.1 }}>
              {stats.withRoles}
            </div>
          </div>
        </div>

        {/* Inactive */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#FFFBEB',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UserX size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Inactive / Suspended
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>
              {stats.inactive}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Users Card & Table ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
      }}>
        {/* Status Tab Navigation */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '4px 8px',
          gap: 4,
        }}>
          {[
            { id: 'all',      label: 'All Users',   count: users.length },
            { id: 'active',   label: 'Active Only', count: stats.active },
            { id: 'inactive', label: 'Inactive',    count: stats.inactive },
          ].map((tab) => {
            const active = statusTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#0B3D91' : '#64748B',
                  background: active ? '#FFFFFF' : 'transparent',
                  borderRadius: 10,
                  border: active ? '1px solid #CBD5E1' : '1px solid transparent',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  padding: '1px 7px',
                  borderRadius: 999,
                  background: active ? '#EFF6FF' : '#E2E8F0',
                  color: active ? '#0B3D91' : '#475569',
                }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filters Toolbar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 400 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, employee ID, or username..."
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 34,
                paddingRight: 14,
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: 13,
                color: '#0F172A',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Department & Role Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: 13,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: 13,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Spinner label="Loading users directory..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '64px 20px' }}>
            <EmptyState
              title="No users found"
              description="No user records matched your filter criteria."
              action={
                <Button variant="primary" size="sm" onClick={handleCreate} style={{ marginTop: 12 }}>
                  <Plus size={14} style={{ marginRight: 6 }} />
                  Add New User
                </Button>
              }
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Details</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>Employee ID</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>Username</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Roles</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 100 }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const nameStr = displayName(u)
                  const initials = nameStr.slice(0, 1).toUpperCase()
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      {/* Name & Email with Avatar */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: '#EFF6FF',
                            color: '#0B3D91',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 800,
                            border: '1px solid #BFDBFE',
                            flexShrink: 0,
                          }}>
                            {initials}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => navigate(`/users/${u.id}`)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontWeight: 700,
                                fontSize: 13.5,
                                color: '#0B3D91',
                                fontFamily: 'inherit',
                              }}
                            >
                              {nameStr}
                            </button>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td style={{ padding: '12px 18px' }}>
                        {u.employee_number ? (
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: 11.5,
                            fontWeight: 700,
                            background: '#F1F5F9',
                            color: '#334155',
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: '1px solid #E2E8F0',
                          }}>
                            {u.employee_number}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>—</span>
                        )}
                      </td>

                      {/* Username */}
                      <td style={{ padding: '12px 18px' }}>
                        {u.username ? (
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>
                            {u.username}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>—</span>
                        )}
                      </td>

                      {/* Department */}
                      <td style={{ padding: '12px 18px', color: '#334155' }}>
                        {u.department?.name || <span style={{ color: '#CBD5E1' }}>No Department</span>}
                      </td>

                      {/* Roles */}
                      <td style={{ padding: '12px 18px' }}>
                        <RoleBadges roles={u.roles ?? []} />
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 18px' }}>
                        <Badge tone={u.status === 'active' ? 'green' : 'yellow'}>
                          {u.status || 'unknown'}
                        </Badge>
                      </td>

                      {/* Action Toolbar */}
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            title="Edit User"
                            onClick={() => handleEdit(u)}
                            style={{
                              padding: '5px 9px',
                              borderRadius: 6,
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              color: '#0B3D91',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Edit size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            title="Change Password"
                            onClick={() => handleOpenPasswordModal(u)}
                            style={{
                              padding: '5px 7px',
                              borderRadius: 6,
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              color: '#475569',
                              fontSize: 12,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Key size={12} />
                          </button>

                          <button
                            type="button"
                            title="Reset to Default Password"
                            onClick={() => void handleResetPassword(u)}
                            disabled={resetSaving}
                            style={{
                              padding: '5px 7px',
                              borderRadius: 6,
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              color: '#475569',
                              fontSize: 12,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <RotateCcw size={12} />
                          </button>

                          <button
                            type="button"
                            title="Delete User"
                            onClick={() => void handleDelete(u)}
                            style={{
                              padding: '5px 7px',
                              borderRadius: 6,
                              border: '1px solid #FEE2E2',
                              background: '#FFF5F5',
                              color: '#DC2626',
                              fontSize: 12,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ borderTop: '1px solid #F1F5F9', padding: '12px 20px' }}>
              <Pagination
                page={pagination.current_page}
                lastPage={pagination.last_page}
                total={pagination.total}
                onPageChange={(p) => setFilters({ ...filters, page: p })}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit User Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? `Edit User: ${displayName(editingUser)}` : 'Create New User Account'}
        maxWidth={640}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={saving || !formData.email.trim()}
            >
              {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User Account'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Identity Section */}
          <div style={{
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0B3D91' }}>
              Employee Identity
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Employee Number
                </label>
                <Input
                  value={formData.employee_number}
                  onChange={(e) => setFormData((prev) => updateUsername({ employee_number: e.target.value }, prev))}
                  placeholder="e.g., 2026-0042"
                  style={{ height: 42, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13.5 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  System Username
                </label>
                <input
                  readOnly
                  value={formData.username || ''}
                  placeholder="Auto-generated"
                  style={{
                    width: '100%',
                    height: 42,
                    paddingLeft: 14,
                    paddingRight: 14,
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    background: '#F1F5F9',
                    fontSize: 13.5,
                    color: '#64748B',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  First Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Juan"
                  style={{ height: 42, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13.5 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Middle Name
                </label>
                <Input
                  value={formData.middle_name || ''}
                  onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                  placeholder="Cruz"
                  style={{ height: 42, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13.5 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Last Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData((prev) => updateUsername({ last_name: e.target.value }, prev))}
                  placeholder="Dela Cruz"
                  style={{ height: 42, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13.5 }}
                />
              </div>
            </div>
          </div>

          {/* Account & Assignment Section */}
          <div style={{
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0B3D91' }}>
              Account & Credentials
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: editingUser ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Official Email Address <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  style={{ height: 42, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13.5 }}
                />
              </div>

              {!editingUser && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Initial Password
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave empty for default"
                    style={{ height: 42, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13.5 }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Department
                </label>
                <select
                  value={formData.department_id ?? ''}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value ? Number(e.target.value) : null })}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '0 12px',
                    fontSize: 13,
                    color: '#0F172A',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">No Department</option>
                  {(Array.isArray(departments) ? departments : []).map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Office Assignment
                </label>
                <select
                  value={formData.office_id ?? ''}
                  onChange={(e) => setFormData({ ...formData, office_id: e.target.value ? Number(e.target.value) : null })}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '0 12px',
                    fontSize: 13,
                    color: '#0F172A',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">No Office</option>
                  {(Array.isArray(offices) ? offices : []).map((off) => (
                    <option key={off.id} value={off.id}>{off.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Account Status
                </label>
                <select
                  value={formData.status ?? 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    padding: '0 12px',
                    fontSize: 13,
                    color: '#0F172A',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role Assignment Section */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Assigned Security Roles
            </label>
            {roles.length === 0 ? (
              <div style={{ padding: '12px', borderRadius: 8, background: '#F8FAFC', color: '#64748B', fontSize: 12 }}>
                No security roles configured.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 8,
                padding: '12px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                maxHeight: 140,
                overflowY: 'auto',
              }}>
                {roles.map((role) => {
                  const checked = formData.roles?.includes(role.id) ?? false
                  return (
                    <label
                      key={role.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: checked ? '#EFF6FF' : '#F8FAFC',
                        border: `1px solid ${checked ? '#BFDBFE' : '#E2E8F0'}`,
                        transition: 'all 0.12s ease',
                      }}
                    >
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
                        style={{ width: 15, height: 15, accentColor: '#0B3D91', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12.5, fontWeight: checked ? 700 : 500, color: checked ? '#0B3D91' : '#334155' }}>
                        {role.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={`Change Password: ${passwordUser ? displayName(passwordUser) : ''}`}
        maxWidth={460}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <Button variant="secondary" size="sm" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleChangePassword}
              disabled={passwordSaving}
            >
              {passwordSaving ? 'Saving...' : 'Change Password'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              New Password <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <Input
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
              placeholder="At least 8 characters"
              style={{ height: 42, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13.5 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Confirm New Password <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <Input
              type="password"
              value={passwordData.password_confirmation}
              onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
              placeholder="Re-enter password"
              style={{ height: 42, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13.5 }}
            />
          </div>

          <div style={{ fontSize: 12, color: '#64748B' }}>
            Password must contain at least 8 characters including letters and numbers.
          </div>
        </div>
      </Modal>

      {/* ── Import Employees Modal (REDESIGNED) ── */}
      <Modal
        open={importModalOpen}
        onClose={() => {
          setImportModalOpen(false)
          setImportResult(null)
          setImportFile(null)
        }}
        title="Import Employees"
        maxWidth={620}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setImportModalOpen(false)
                setImportResult(null)
                setImportFile(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleImport}
              disabled={importing || !importFile}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#0B3D91',
                paddingInline: 18,
                height: 38,
                fontWeight: 700,
              }}
            >
              {importing ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <span>Importing Data...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Start Import</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Format Specification & Guidance Card */}
          <div style={{
            borderRadius: 12,
            border: '1px solid #BFDBFE',
            background: '#F0F7FF',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: '#0B3D91' }}>
                <Info size={16} style={{ color: '#0B3D91' }} />
                <span>File Format & Column Requirements</span>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#1E40AF',
                background: '#DBEAFE',
                padding: '2px 8px',
                borderRadius: 999,
              }}>
                Batch Import
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: '#1E3A8A' }}>
              {/* Required columns */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: '#0B3D91',
                  color: '#FFFFFF',
                }}>
                  Required
                </span>
                <code style={{ fontFamily: 'monospace', fontWeight: 700, background: '#DBEAFE', padding: '2px 6px', borderRadius: 4, color: '#0B3D91' }}>
                  email
                </code>
              </div>

              {/* Optional columns */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: '#CBD5E1',
                  color: '#334155',
                }}>
                  Optional
                </span>
                {['first_name', 'middle_name', 'last_name', 'id_number', 'role'].map((col) => (
                  <code key={col} style={{ fontFamily: 'monospace', fontWeight: 600, background: '#FFFFFF', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: 4, color: '#334155' }}>
                    {col}
                  </code>
                ))}
              </div>

              <div style={{
                borderTop: '1px solid #BFDBFE',
                paddingTop: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                fontSize: 11.5,
                color: '#475569',
              }}>
                <div>
                  ⚡ Username generated as <code style={{ background: '#FFFFFF', padding: '1px 4px', borderRadius: 3, border: '1px solid #CBD5E1' }}>lastname + id_number</code>
                </div>
                <div>
                  Default password: <code style={{ fontWeight: 700, color: '#0B3D91', background: '#FFFFFF', padding: '1px 4px', borderRadius: 3, border: '1px solid #CBD5E1' }}>psasargen9500</code>
                </div>
              </div>
            </div>
          </div>

          {/* Download Sample Templates */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', marginBottom: 8 }}>
              Download Sample Templates
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => downloadTemplate('csv')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0F172A',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#16A34A'
                  e.currentTarget.style.background = '#F0FDF4'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.background = '#FFFFFF'
                }}
              >
                <Download size={14} style={{ color: '#16A34A' }} />
                <span>CSV Template</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                  .CSV
                </span>
              </button>

              <button
                type="button"
                onClick={() => downloadTemplate('json')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0F172A',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0B3D91'
                  e.currentTarget.style.background = '#EFF6FF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.background = '#FFFFFF'
                }}
              >
                <Download size={14} style={{ color: '#0B3D91' }} />
                <span>JSON Template</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#DBEAFE', color: '#1E40AF' }}>
                  .JSON
                </span>
              </button>
            </div>
          </div>

          {/* Interactive File Dropzone */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', marginBottom: 8 }}>
              Upload Employee Dataset
            </div>

            {importFile ? (
              /* Selected File Card */
              <div style={{
                borderRadius: 12,
                border: '1.5px solid #86EFAC',
                background: '#F0FDF4',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: '#DCFCE7',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                      {importFile.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#15803D', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={13} />
                      <span>Ready for import ({(importFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label
                    htmlFor="user-import-file-change"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid #BBF7D0',
                      background: '#FFFFFF',
                      color: '#15803D',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Change File
                  </label>
                  <button
                    type="button"
                    onClick={() => setImportFile(null)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid #FECACA',
                      background: '#FFF5F5',
                      color: '#DC2626',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                  <input
                    id="user-import-file-change"
                    type="file"
                    accept=".csv,.json,.xlsx"
                    style={{ display: 'none' }}
                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            ) : (
              /* Dropzone */
              <label
                htmlFor="user-import-file"
                style={{
                  borderRadius: 14,
                  border: '2px dashed #CBD5E1',
                  background: '#F8FAFC',
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0B3D91'
                  e.currentTarget.style.background = '#EFF6FF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1'
                  e.currentTarget.style.background = '#F8FAFC'
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#EFF6FF',
                  color: '#0B3D91',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    Click to select file or drag & drop here
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                    Supports .CSV, .JSON, and .XLSX datasets up to 10 MB
                  </div>
                </div>
                <input
                  id="user-import-file"
                  type="file"
                  accept=".csv,.json,.xlsx"
                  style={{ display: 'none' }}
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          {/* Import Result Stats */}
          {importResult && (
            <div style={{
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A' }}>
                Batch Import Summary
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 10,
                textAlign: 'center',
              }}>
                <div style={{ padding: '10px 8px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{importResult.total_rows}</div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 2 }}>Total Rows</div>
                </div>
                <div style={{ padding: '10px 8px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A' }}>{importResult.imported}</div>
                  <div style={{ fontSize: 11, color: '#15803D', fontWeight: 600, marginTop: 2 }}>Imported</div>
                </div>
                <div style={{ padding: '10px 8px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#D97706' }}>{importResult.skipped}</div>
                  <div style={{ fontSize: 11, color: '#B45309', fontWeight: 600, marginTop: 2 }}>Skipped</div>
                </div>
                <div style={{ padding: '10px 8px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#DC2626' }}>{importResult.failed}</div>
                  <div style={{ fontSize: 11, color: '#B91C1C', fontWeight: 600, marginTop: 2 }}>Failed</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
