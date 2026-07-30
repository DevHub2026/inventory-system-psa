import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  Input,
  Pagination,
  Spinner,
  Table,
  type Column,
} from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { RoleBadges } from '@/components/RoleBadges'
import {
  userService,
  type BorrowingHistoryFilters,
  type BorrowingHistoryItem,
  type IssuedAsset,
  type UserProfile,
} from '@/services/userService'
import { permanentIssuanceService } from '@/services/permanentIssuanceService'
import type { PermanentIssuanceAsset } from '@/types/permanentIssuance'
import { affectsScope, onDataChanged } from '@/utils/dataRefresh'
import { formatDate, formatTime } from '@/utils/dateFormat'
import { borrowingStatusLabel } from '@/utils/displayLabels'
import { borrowingStatusTone } from '@/utils/statusTone'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TabId = 'profile' | 'permanent' | 'borrowings' | 'history'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#94A3B8' }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: '#1F2937', fontWeight: 500, wordBreak: 'break-word' }}>
        {value ?? <span style={{ color: '#CBD5E1' }}>—</span>}
      </span>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  accent: string
  bg: string
  border: string
}

function StatCard({ label, value, accent, bg, border }: StatCardProps) {
  return (
    <div
      style={{
        flex: '1 1 140px',
        minWidth: 120,
        borderRadius: 14,
        border: `1.5px solid ${border}`,
        background: bg,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 28, fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', lineHeight: 1.4 }}>{label}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Profile
// ─────────────────────────────────────────────────────────────────────────────

function ProfileTab({ profile }: { profile: UserProfile }) {
  const { user, stats } = profile

  const initials = (user.full_name ?? user.email)
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Stats row ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <StatCard label="Currently Borrowed" value={stats.currently_borrowed} accent="#1D4ED8" bg="#EFF6FF" border="#BFDBFE" />
        <StatCard label="Total Borrowed"      value={stats.total_borrowed}     accent="#0F766E" bg="#F0FDFA" border="#99F6E4" />
        <StatCard label="Returned"            value={stats.returned}           accent="#16A34A" bg="#F0FDF4" border="#BBF7D0" />
        <StatCard label="Overdue"             value={stats.overdue}            accent="#B91C1C" bg="#FEF2F2" border="#FECACA" />
        <StatCard label="Pending Requests"    value={stats.pending_requests}   accent="#B45309" bg="#FFFBEB" border="#FDE68A" />
      </div>

      {/* ── User info card ── */}
      <div
        style={{
          borderRadius: 16,
          border: '1.5px solid #E5E7EB',
          background: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* Card header with avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '24px 28px',
            borderBottom: '1px solid #F1F5F9',
            background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#0B3D91',
              border: '3px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              color: '#FFFFFF',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(11,61,145,0.20)',
            }}
          >
            {initials || '?'}
          </div>

          {/* Name + meta */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
              {user.full_name || user.email}
            </div>
            {user.employee_number && (
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                Employee ID: <span style={{ fontWeight: 600, color: '#0D47A1', fontFamily: 'monospace' }}>{user.employee_number}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Badge tone={user.status === 'active' ? 'green' : 'yellow'}>
                {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown'}
              </Badge>
              <RoleBadges roles={user.roles ?? []} maxVisible={3} />
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 24,
            padding: '24px 28px',
          }}
        >
          <InfoRow label="Full Name"      value={user.full_name} />
          <InfoRow label="First Name"     value={user.first_name} />
          <InfoRow label="Middle Name"    value={user.middle_name} />
          <InfoRow label="Last Name"      value={user.last_name} />
          <InfoRow label="Employee ID"    value={<span style={{ fontFamily: 'monospace', fontSize: 13 }}>{user.employee_number}</span>} />
          <InfoRow label="Username"       value={<span style={{ fontFamily: 'monospace', fontSize: 13 }}>{user.username}</span>} />
          <InfoRow label="Email"          value={user.email} />
          <InfoRow label="Department"     value={user.department?.name} />
          <InfoRow label="Office"         value={user.office?.name} />
          <InfoRow label="Account Status" value={
            <Badge tone={user.status === 'active' ? 'green' : 'yellow'}>
              {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown'}
            </Badge>
          } />
          <InfoRow label="Date Created" value={user.created_at ? formatDate(user.created_at) : null} />
          <InfoRow label="Assigned Roles" value={<RoleBadges roles={user.roles ?? []} maxVisible={5} />} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Permanently Issued Assets
// ─────────────────────────────────────────────────────────────────────────────

function PermanentIssuanceTab({
  userId,
  triggerRefresh,
}: {
  userId: number
  triggerRefresh: number
}) {
  const [items, setItems] = useState<PermanentIssuanceAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await permanentIssuanceService.getUserAssets(userId)
      setItems(result.items)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load permanently issued assets.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { void load() }, [load, triggerRefresh])

  const columns: Column<PermanentIssuanceAsset>[] = [
    { key: 'asset_name', header: 'Asset Name', render: (r) => r.asset_name },
    {
      key: 'property_number',
      header: 'Property Number',
      render: (r) => r.property_number ?? '—',
    },
    {
      key: 'asset_number',
      header: 'Asset Number',
      render: (r) => r.asset_number ?? '—',
    },
    { key: 'category', header: 'Category', render: (r) => r.category ?? '—' },
    { key: 'office', header: 'Office', render: (r) => r.office ?? '—' },
    { key: 'date_issued', header: 'Date Issued', render: (r) => r.date_issued ? formatDate(r.date_issued) : '—' },
    { key: 'issued_by', header: 'Issued By', render: (r) => r.issued_by ?? '—' },
  ]

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><Spinner /></div>
  if (error) return <Alert tone="error">{error}</Alert>

  return (
    <Card noPadding>
      {items.length === 0 ? (
        <div style={{ padding: '64px 0' }}>
          <EmptyState
            title="No permanently issued assets"
            description="Property permanently issued to this user will appear here."
          />
        </div>
      ) : (
        <Table columns={columns} rows={items} rowKey={(r) => r.asset_id} />
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Active Borrowings
// ─────────────────────────────────────────────────────────────────────────────

function ActiveBorrowingsTab({
  userId,
  triggerRefresh,
}: {
  userId: number
  triggerRefresh: number
}) {
  const [items, setItems]       = useState<IssuedAsset[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await userService.getIssuedAssets(userId)
      setItems(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load active borrowings.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { void load() }, [load, triggerRefresh])

  const columns: Column<IssuedAsset>[] = [
    {
      key: 'asset_name',
      header: 'Asset Name',
      render: (r) => (
        <span style={{ fontWeight: 600, color: '#1E293B' }}>{r.asset_name ?? '—'}</span>
      ),
    },
    {
      key: 'asset_number',
      header: 'Asset Number',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{r.asset_number ?? r.asset_code ?? '—'}</span>
      ),
    },
    { key: 'category',      header: 'Category',      render: (r) => r.category      ?? '—' },
    {
      key: 'serial_number',
      header: 'Serial Number',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{r.serial_number ?? '—'}</span>
      ),
    },
    { key: 'borrow_date', header: 'Borrow Date', render: (r) => r.borrowed_at ? formatDate(r.borrowed_at) : '—' },
    { key: 'borrow_time', header: 'Borrow Time', render: (r) => r.borrowed_at ? formatTime(r.borrowed_at) : '—' },
    { key: 'due_date',    header: 'Due Date',    render: (r) => r.due_date    ? formatDate(r.due_date)    : '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={borrowingStatusTone(r.status as never)}>
          {borrowingStatusLabel(r.status)}
        </Badge>
      ),
    },
    { key: 'issued_by', header: 'Issued By', render: (r) => r.issued_by ?? '—' },
    { key: 'location',  header: 'Location',  render: (r) => r.location  ?? '—' },
  ]

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><Spinner /></div>
  if (error)   return <Alert tone="error">{error}</Alert>

  return (
    <Card noPadding>
      {items.length === 0 ? (
        <div style={{ padding: '64px 0' }}>
          <EmptyState
            title="No active borrowings"
            description="This user has no assets currently borrowed."
          />
        </div>
      ) : (
        <Table columns={columns} rows={items} rowKey={(r) => r.id} />
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Borrowing History
// ─────────────────────────────────────────────────────────────────────────────

const HISTORY_STATUSES = [
  { value: '',                label: 'All Statuses' },
  { value: 'BORROWED',        label: 'Currently Borrowed' },
  { value: 'RETURNED',        label: 'Returned' },
  { value: 'OVERDUE',         label: 'Overdue' },
  { value: 'PARTIALLY_RETURNED', label: 'Partly Returned' },
]

function BorrowingHistoryTab({
  userId,
  triggerRefresh,
}: {
  userId: number
  triggerRefresh: number
}) {
  const [items, setItems]             = useState<BorrowingHistoryItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [pagination, setPagination]   = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 })
  const [filters, setFilters]         = useState<BorrowingHistoryFilters>({ per_page: 15, page: 1 })
  const searchTimerRef                = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (f: BorrowingHistoryFilters) => {
    setLoading(true)
    setError(null)
    try {
      const result = await userService.getBorrowingHistory(userId, f)
      setItems(result.items)
      setPagination(result.meta)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load borrowing history.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Reload when filters change or parent triggers a refresh
  useEffect(() => { void load(filters) }, [load, filters, triggerRefresh])

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value || undefined, page: 1 }))
    }, 350)
  }

  const handleStatus = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value || undefined, page: 1 }))
  }

  const handleDateFrom = (value: string) => {
    setFilters((prev) => ({ ...prev, date_from: value || undefined, page: 1 }))
  }

  const handleDateTo = (value: string) => {
    setFilters((prev) => ({ ...prev, date_to: value || undefined, page: 1 }))
  }

  const columns: Column<BorrowingHistoryItem>[] = [
    {
      key: 'asset_name',
      header: 'Asset Name',
      render: (r) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{r.asset_name ?? '—'}</span>,
    },
    {
      key: 'asset_number',
      header: 'Asset Number',
      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{r.asset_number ?? r.asset_code ?? '—'}</span>,
    },
    { key: 'borrow_date', header: 'Borrow Date', render: (r) => r.borrowed_at ? formatDate(r.borrowed_at) : '—' },
    { key: 'borrow_time', header: 'Borrow Time', render: (r) => r.borrowed_at ? formatTime(r.borrowed_at) : '—' },
    { key: 'return_date', header: 'Return Date', render: (r) => r.returned_at ? formatDate(r.returned_at) : '—' },
    { key: 'return_time', header: 'Return Time', render: (r) => r.returned_at ? formatTime(r.returned_at) : '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={borrowingStatusTone(r.status as never)}>
          {borrowingStatusLabel(r.status)}
        </Badge>
      ),
    },
    { key: 'issued_by', header: 'Issued By', render: (r) => r.issued_by ?? '—' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Filter bar ── */}
      <Card>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            padding: '14px 16px',
            alignItems: 'flex-end',
          }}
        >
          {/* Search */}
          <div style={{ flex: '1 1 200px', minWidth: 180 }}>
            <Input
              label="Search"
              placeholder="Asset name or code…"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div style={{ flex: '0 0 180px' }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
              Status
            </label>
            <select
              onChange={(e) => handleStatus(e.target.value)}
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                background: '#FFFFFF',
                padding: '8px 10px',
                fontSize: 13,
                color: '#1F2937',
                outline: 'none',
              }}
            >
              {HISTORY_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div style={{ flex: '0 0 160px' }}>
            <Input
              label="From"
              type="date"
              onChange={(e) => handleDateFrom(e.target.value)}
            />
          </div>

          {/* Date to */}
          <div style={{ flex: '0 0 160px' }}>
            <Input
              label="To"
              type="date"
              onChange={(e) => handleDateTo(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card noPadding>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Spinner />
          </div>
        ) : error ? (
          <div style={{ padding: 16 }}>
            <Alert tone="error">{error}</Alert>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '64px 0' }}>
            <EmptyState
              title="No borrowing history"
              description="No records match the current filters."
            />
          </div>
        ) : (
          <>
            <Table columns={columns} rows={items} rowKey={(r) => r.id} />
            {pagination.last_page > 1 && (
              <div style={{ borderTop: '1px solid #E5E7EB', padding: '12px 20px' }}>
                <Pagination
                  page={pagination.current_page}
                  lastPage={pagination.last_page}
                  total={pagination.total}
                  onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function UserProfilePage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [profile, setProfile]     = useState<UserProfile | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  // Increment this to force the issued-assets and history tabs to reload
  // without remounting the entire page.
  const [refreshSeq, setRefreshSeq] = useState(0)

  const userId = Number(id)

  const loadProfile = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await userService.getUserProfile(userId)
      setProfile(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load user profile.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { void loadProfile() }, [loadProfile])

  // ── Real-time updates ─────────────────────────────────────────────────────
  // When borrowings or reservations change globally, refresh the stats banner
  // and notify the child tabs to re-fetch their own data.
  useEffect(
    () =>
      onDataChanged((scope) => {
        if (
          affectsScope(scope, 'borrowings') ||
          affectsScope(scope, 'reservations') ||
          affectsScope(scope, 'assets')
        ) {
          void loadProfile()
          setRefreshSeq((n) => n + 1)
        }
      }),
    [loadProfile],
  )

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'profile', label: 'Profile' },
    {
      id: 'permanent',
      label: 'Permanently Issued Assets',
    },
    {
      id: 'borrowings',
      label: 'Active Borrowings',
      count: profile?.stats.currently_borrowed,
    },
    {
      id: 'history',
      label: 'Borrowing History',
      count: profile?.stats.total_borrowed,
    },
  ]

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading && !profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <PageHeader
          title="User Profile"
          subtitle="Loading…"
          breadcrumb="Users"
        />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Spinner label="Loading profile…" />
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <PageHeader title="User Profile" breadcrumb="Users" />
        <Alert tone="error">{error}</Alert>
      </div>
    )
  }

  const displayedName = profile?.user.full_name ?? profile?.user.email ?? 'User Profile'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Page header ── */}
      <PageHeader
        title={displayedName}
        subtitle={
          profile?.user.employee_number
            ? `Employee ID: ${profile.user.employee_number}`
            : profile?.user.email
        }
        breadcrumb="Users"
        actions={
          <button
            type="button"
            onClick={() => navigate('/users')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 8,
              border: '1.5px solid #E5E7EB',
              background: '#FFFFFF',
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            ← Back to Users
          </button>
        }
      />

      {/* ── Error banner (non-fatal) ── */}
      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* ── Tab bar ── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '2px solid #E5E7EB',
          paddingBottom: 0,
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                border: 'none',
                borderBottom: active ? '2.5px solid #0D47A1' : '2.5px solid transparent',
                marginBottom: -2,
                background: 'transparent',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? '#0D47A1' : '#6B7280',
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0',
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 20,
                    height: 18,
                    borderRadius: 999,
                    padding: '0 5px',
                    fontSize: 11,
                    fontWeight: 700,
                    background: active ? '#0D47A1' : '#E5E7EB',
                    color: active ? '#FFFFFF' : '#6B7280',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'profile' && profile && (
        <ProfileTab profile={profile} />
      )}

      {activeTab === 'permanent' && (
        <PermanentIssuanceTab userId={userId} triggerRefresh={refreshSeq} />
      )}

      {activeTab === 'borrowings' && (
        <ActiveBorrowingsTab userId={userId} triggerRefresh={refreshSeq} />
      )}

      {activeTab === 'history' && (
        <BorrowingHistoryTab userId={userId} triggerRefresh={refreshSeq} />
      )}
    </div>
  )
}
