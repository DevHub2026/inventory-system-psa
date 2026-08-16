import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Dropdown, EmptyState, Input, Modal, Pagination, Spinner } from '@/components/ui'
import { setupService, type SetupPayload, type SetupRecord, type SetupResource } from '@/services/setupService'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roleHelpers'
import { PageHeader } from '@/components/PageHeader'
import {
  Layers,
  Building2,
  Building,
  MapPin,
  Factory,
  Package,
  Users,
  Shield,
  Key,
  GitMerge,
  FileText,
  QrCode,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  Lightbulb,
  SlidersHorizontal,
} from 'lucide-react'

interface SetupSection {
  resource: SetupResource
  title: string
  description: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>
  codeLabel?: string
  needsOffice?: boolean
}

const sections: SetupSection[] = [
  { resource: 'asset-categories',     title: 'Asset Categories',     icon: Layers,    description: 'Group assets for structured cataloging, reporting, and inventory classification.', codeLabel: 'Category Code' },
  { resource: 'offices',              title: 'Offices',              icon: Building2, description: 'Maintain PSA regional offices, field offices, and accountable organizational units.', codeLabel: 'Office Code' },
  { resource: 'departments',          title: 'Departments',          icon: Building,  description: 'Organizational divisions and operating departments for employee assignment.',    codeLabel: 'Department Code' },
  { resource: 'locations',            title: 'Locations',            icon: MapPin,    description: 'Specific rooms, floors, deployment hubs, or storage locations under offices.',    codeLabel: 'Location Code', needsOffice: true },
  { resource: 'manufacturers',        title: 'Manufacturers',        icon: Factory,   description: 'Brands, registered vendors, and equipment manufacturers referenced by assets.', codeLabel: 'Manufacturer Code' },
  { resource: 'inventory-item-types', title: 'Inventory Item Types', icon: Package,   description: 'Standardized consumable item types and supplies for fast stock entry.',            codeLabel: 'Item Type Code' },
]

const emptyForm: SetupPayload = { name: '', code: '', description: '', office_id: null, is_active: true }

export function SystemSetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeResource, setActiveResource] = useState<SetupResource>('asset-categories')
  const [records, setRecords] = useState<Record<SetupResource, SetupRecord[]>>({
    'asset-categories': [],
    offices: [],
    departments: [],
    locations: [],
    manufacturers: [],
    units: [],
    'inventory-item-types': [],
  })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SetupRecord | null>(null)
  const [form, setForm] = useState<SetupPayload>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Search, Status filter & Pagination state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  const activeSection = sections.find((s) => s.resource === activeResource) ?? sections[0]
  const activeRecords = records[activeResource] || []
  const officeOptions = (records.offices || []).map((o) => ({ label: o.name, value: String(o.id) }))

  async function loadSetupData() {
    setLoading(true)
    try {
      const [assetCategories, offices, departments, locations, manufacturers, inventoryItemTypes] = await Promise.all([
        setupService.list('asset-categories').catch(() => []),
        setupService.list('offices').catch(() => []),
        setupService.list('departments').catch(() => []),
        setupService.list('locations').catch(() => []),
        setupService.list('manufacturers').catch(() => []),
        setupService.list('inventory-item-types').catch(() => []),
      ])
      setRecords({
        'asset-categories': assetCategories,
        offices,
        departments,
        locations,
        manufacturers,
        units: [],
        'inventory-item-types': inventoryItemTypes,
      })
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load setup records.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSetupData()
  }, [])

  // Filtered & Paginated records
  const filteredRecords = useMemo(() => {
    let list = activeRecords
    if (statusFilter === 'active') {
      list = list.filter((r) => r.is_active !== false)
    } else if (statusFilter === 'inactive') {
      list = list.filter((r) => r.is_active === false)
    }

    if (!search.trim()) return list
    const term = search.toLowerCase().trim()
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.code && r.code.toLowerCase().includes(term)) ||
        (r.description && r.description.toLowerCase().includes(term))
    )
  }, [activeRecords, search, statusFilter])

  const totalPages = Math.ceil(filteredRecords.length / perPage) || 1
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return filteredRecords.slice(start, start + perPage)
  }, [filteredRecords, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeResource, search, statusFilter])

  if (!isAdmin(user)) return <Navigate to="/dashboard" replace />

  function openCreate() {
    setEditingRecord(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(record: SetupRecord) {
    setEditingRecord(record)
    setForm({
      name: record.name,
      code: record.code ?? '',
      description: record.description ?? '',
      office_id: record.office_id ?? null,
      is_active: record.is_active !== false,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const payload: SetupPayload = {
        name: form.name.trim(),
        code: activeSection.resource === 'manufacturers' ? undefined : form.code?.trim() || null,
        description: form.description?.trim() || null,
        office_id: activeSection.needsOffice ? form.office_id ?? null : undefined,
        is_active: form.is_active,
      }
      if (editingRecord) {
        await setupService.update(activeResource, editingRecord.id, payload)
        setMessage({ type: 'success', text: `"${form.name}" has been updated.` })
      } else {
        await setupService.create(activeResource, payload)
        setMessage({ type: 'success', text: `"${form.name}" has been added to ${activeSection.title}.` })
      }
      setModalOpen(false)
      await loadSetupData()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save record.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record: SetupRecord) {
    if (!confirm(`Are you sure you want to delete "${record.name}"? This action cannot be undone.`)) return
    try {
      await setupService.remove(activeResource, record.id)
      setMessage({ type: 'success', text: `"${record.name}" has been deleted.` })
      await loadSetupData()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to delete record.' })
    }
  }

  // Admin Shortcut definitions with custom theme accents
  const shortcuts = [
    {
      label: 'Manage Users',
      desc: 'User accounts, assignments & active credentials',
      path: '/users',
      icon: Users,
      iconColor: '#0B3D91',
      iconBg: '#EFF6FF',
    },
    {
      label: 'Manage Roles',
      desc: 'Role hierarchy, security groups & access rights',
      path: '/roles',
      icon: Shield,
      iconColor: '#4338CA',
      iconBg: '#EEF2FF',
    },
    {
      label: 'Manage Permissions',
      desc: 'Granular resource capabilities and access control',
      path: '/permissions',
      icon: Key,
      iconColor: '#7E22CE',
      iconBg: '#FAF5FF',
    },
    {
      label: 'Approval Workflows',
      desc: 'Multi-stage approval flows and review routing',
      path: '/workflows',
      icon: GitMerge,
      iconColor: '#D97706',
      iconBg: '#FFFBEB',
    },
    {
      label: 'Document Templates',
      desc: 'Printable receipts, forms and issuance sheets',
      path: '/document-templates',
      icon: FileText,
      iconColor: '#059669',
      iconBg: '#ECFDF5',
    },
    {
      label: 'Print Asset QR Labels',
      desc: 'Generate printable barcode & QR tag sheets',
      path: '/assets',
      icon: QrCode,
      iconColor: '#0284C7',
      iconBg: '#F0F9FF',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Page Header ── */}
      <PageHeader
        title="System Setup"
        subtitle="Manage master catalogs, organizational offices, locations, and baseline classifications."
      />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ── Summary Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
      }}>
        {sections.slice(0, 4).map((sec) => {
          const count = (records[sec.resource] || []).length
          const SecIcon = sec.icon
          const isSelected = activeResource === sec.resource
          return (
            <div
              key={sec.resource}
              onClick={() => setActiveResource(sec.resource)}
              style={{
                borderRadius: 12,
                border: isSelected ? '1.5px solid #0B3D91' : '1px solid #E2E8F0',
                background: isSelected ? '#F0F6FF' : '#FFFFFF',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 12px rgba(11,61,145,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: isSelected ? '#0B3D91' : '#F1F5F9',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <SecIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: isSelected ? '#0B3D91' : '#64748B' }}>
                    {sec.title}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                    {count}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: isSelected ? '#0B3D91' : '#CBD5E1' }} />
            </div>
          )
        })}
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_310px] items-start">
        {/* ── Main Panel ── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
        }}>
          {/* Segmented Resource Tab Bar */}
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '4px 6px',
            gap: 4,
          }}>
            {sections.map((section) => {
              const active = section.resource === activeResource
              const count = (records[section.resource] || []).length
              const TabIcon = section.icon
              return (
                <button
                  key={section.resource}
                  type="button"
                  onClick={() => setActiveResource(section.resource)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 14px',
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
                  <TabIcon size={15} style={{ color: active ? '#0B3D91' : '#94A3B8' }} />
                  <span>{section.title}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: active ? '#EFF6FF' : '#E2E8F0',
                    color: active ? '#0B3D91' : '#475569',
                  }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Section Toolbar: Header, Search & Action Button */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            borderBottom: '1px solid #F1F5F9',
            padding: '16px 20px',
            background: '#FFFFFF',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {activeSection.title}
                </span>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  ({filteredRecords.length} records)
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                {activeSection.description}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: 220 }}>
                <Search
                  size={14}
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeSection.title.toLowerCase()}...`}
                  style={{
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
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
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
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {/* Add Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={openCreate}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 38,
                  paddingInline: 14,
                  fontWeight: 700,
                }}
              >
                <Plus size={14} />
                <span>Add {activeSection.title.replace(/s$/, '')}</span>
              </Button>
            </div>
          </div>

          {/* Records Table */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Spinner label="Loading records..." />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ padding: '60px 20px' }}>
              <EmptyState
                title={`No ${activeSection.title.toLowerCase()} found`}
                description="Add a new entry or adjust your search filter."
              />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                    {activeSection.resource !== 'manufacturers' && (
                      <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>Code</th>
                    )}
                    {activeSection.needsOffice && (
                      <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Office</th>
                    )}
                    <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 100 }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 120 }}>Updated</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: 130 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0F172A' }}>
                        {row.name}
                      </td>

                      {activeSection.resource !== 'manufacturers' && (
                        <td style={{ padding: '12px 18px' }}>
                          {row.code ? (
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
                              {row.code}
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>—</span>
                          )}
                        </td>
                      )}

                      {activeSection.needsOffice && (
                        <td style={{ padding: '12px 18px', color: '#334155' }}>
                          {records.offices.find((o) => o.id === row.office_id)?.name ?? <span style={{ color: '#94A3B8' }}>—</span>}
                        </td>
                      )}

                      <td style={{ padding: '12px 18px', color: '#64748B', maxWidth: 260 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.description || ''}>
                          {row.description || <span style={{ color: '#CBD5E1' }}>No description</span>}
                        </span>
                      </td>

                      <td style={{ padding: '12px 18px' }}>
                        <Badge tone={row.is_active === false ? 'yellow' : 'green'}>
                          {row.is_active === false ? 'Inactive' : 'Active'}
                        </Badge>
                      </td>

                      <td style={{ padding: '12px 18px', color: '#64748B', fontSize: 12 }}>
                        {row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'}
                      </td>

                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            title="Edit Record"
                            onClick={() => openEdit(row)}
                            style={{
                              padding: '5px 10px',
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
                            title="Delete Record"
                            onClick={() => void handleDelete(row)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              border: '1px solid #FEE2E2',
                              background: '#FFF5F5',
                              color: '#DC2626',
                              fontSize: 12,
                              fontWeight: 600,
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
                  ))}
                </tbody>
              </table>

              {/* Pagination Bar */}
              <div style={{ borderTop: '1px solid #F1F5F9', padding: '12px 20px' }}>
                <Pagination
                  page={currentPage}
                  lastPage={totalPages}
                  total={filteredRecords.length}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar: Admin Shortcuts & Guidance ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Admin Shortcuts Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '18px 18px',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  Admin Shortcuts
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Frequently used management modules
                </div>
              </div>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#EFF6FF',
                color: '#0B3D91',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <SlidersHorizontal size={16} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shortcuts.map((item) => {
                const ItemIcon = item.icon
                return (
                  <div
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #F1F5F9',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#BFDBFE'
                      e.currentTarget.style.background = '#F8FAFC'
                      e.currentTarget.style.transform = 'translateX(2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#F1F5F9'
                      e.currentTarget.style.background = '#FFFFFF'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: item.iconBg,
                        color: item.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <ItemIcon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={15} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>

            {/* Quick Setup Recommendation Box */}
            <div style={{
              borderRadius: 10,
              border: '1px solid #BFDBFE',
              background: '#EFF6FF',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#0B3D91' }}>
                <Lightbulb size={14} style={{ color: '#D97706' }} />
                <span>Setup Best Practice</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#1E40AF', lineHeight: 1.5 }}>
                Configure standard 2-to-4 character codes for Offices and Categories to ensure structured automated inventory asset tagging.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Master Record Modal ── */}
      <Modal
        open={modalOpen}
        title={editingRecord ? `Edit ${activeSection.title.replace(/s$/, '')}` : `Add New ${activeSection.title.replace(/s$/, '')}`}
        onClose={() => setModalOpen(false)}
        maxWidth={540}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving || !form.name.trim()}
            >
              {saving ? 'Saving...' : editingRecord ? 'Save Changes' : 'Create Record'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={`e.g., ${activeSection.title === 'Offices' ? 'PSA Regional Statistical Services Office XII' : activeSection.title === 'Departments' ? 'Information Technology Division' : 'ICT Equipment'}`}
              style={{
                height: 42,
                paddingLeft: 14,
                paddingRight: 14,
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: 13.5,
              }}
            />
          </div>

          {activeSection.resource !== 'manufacturers' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                {activeSection.codeLabel ?? 'Code'} <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span>
              </label>
              <Input
                value={form.code ?? ''}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g., RSSO-XII, ICT-EQ, FIN"
                style={{
                  height: 42,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: 13.5,
                  fontFamily: 'monospace',
                }}
              />
            </div>
          )}

          {activeSection.needsOffice && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Associated Office
              </label>
              <Dropdown
                placeholder="Select parent office..."
                options={officeOptions}
                value={form.office_id ? String(form.office_id) : ''}
                onChange={(e) => setForm({ ...form, office_id: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Description <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Enter brief description or classification notes..."
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                padding: '10px 14px',
                fontSize: 13.5,
                color: '#0F172A',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.is_active !== false}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: '#0B3D91', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Record is Active and available for selection across all modules
            </span>
          </label>
        </div>
      </Modal>
    </div>
  )
}
