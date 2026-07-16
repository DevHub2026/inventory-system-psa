import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Bell,
  Boxes,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  PackagePlus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { Alert, Badge, EmptyState } from '@/components/ui'
import BackgroundDecoration from '@/components/BackgroundDecoration'
import { dashboardService } from '@/services/dashboardService'
import { useAuth } from '@/hooks/useAuth'
import { displayName, type ActivityItem, type DashboardStats } from '@/types'
import logo from '@/assets/logo.png'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Assets', icon: Boxes },
  { label: 'Borrowing', icon: HandCoins },
  { label: 'Reservations', icon: ClipboardList },
  { label: 'Maintenance', icon: Wrench },
  { label: 'Departments', icon: Users },
  { label: 'Users', icon: ShieldCheck },
  { label: 'Reports', icon: FileBarChart },
]

const perPage = 5

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function currentDate(): string {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function moduleTone(module: string): 'blue' | 'green' | 'yellow' | 'red' {
  const value = module.toLowerCase()
  if (value.includes('maintenance')) return 'yellow'
  if (value.includes('borrow')) return 'green'
  if (value.includes('reservation')) return 'blue'
  return 'red'
}

export function DashboardPage() {
  const { logout, user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All modules')
  const [page, setPage] = useState(1)

  useEffect(() => {
    void Promise.all([dashboardService.getStats(), dashboardService.getRecentActivity()])
      .then(([nextStats, nextActivity]) => {
        setStats(nextStats)
        setActivity(nextActivity)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const modules = useMemo(
    () => ['All modules', ...Array.from(new Set(activity.map((item) => item.module)))],
    [activity],
  )

  const filteredActivity = useMemo(() => {
    const term = query.trim().toLowerCase()
    return activity.filter((item) => {
      const matchesFilter = filter === 'All modules' || item.module === filter
      const matchesSearch = !term || [item.action, item.user, item.module, item.created_at]
        .some((value) => value.toLowerCase().includes(term))
      return matchesFilter && matchesSearch
    })
  }, [activity, filter, query])

  const totalPages = Math.max(1, Math.ceil(filteredActivity.length / perPage))
  const visibleActivity = filteredActivity.slice((page - 1) * perPage, page * perPage)
  const maximum = Math.max(stats?.available ?? 0, stats?.borrowed ?? 0, stats?.reserved ?? 0, 1)
  const userName = displayName(user)
  const userRole = user?.department_id ? 'Property Custodian' : 'PSA Personnel'

  const cards = [
    { label: 'Total Assets', value: stats?.total_assets, subtitle: 'All registered assets', icon: Boxes, accent: 'blue' },
    { label: 'Available', value: stats?.available, subtitle: 'Ready for use', icon: ShieldCheck, accent: 'green' },
    { label: 'Borrowed', value: stats?.borrowed, subtitle: 'Currently in use', icon: HandCoins, accent: 'blue' },
    { label: 'Reserved', value: stats?.reserved, subtitle: 'Pending collection', icon: CalendarDays, accent: 'yellow' },
    { label: 'Maintenance', value: stats?.maintenance, subtitle: 'Requires attention', icon: Wrench, accent: 'orange' },
  ]

  function resetPage(nextFilter = filter, nextQuery = query) {
    setPage(1)
    if (nextFilter !== filter) setFilter(nextFilter)
    if (nextQuery !== query) setQuery(nextQuery)
  }

  return (
    <div className="dashboard-shell">
      <BackgroundDecoration />

      {sidebarOpen && <button className="dashboard-overlay" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <aside className={`dashboard-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="dashboard-brand">
          <img src={logo} alt="Philippine Statistics Authority" />
          <div>
            <strong>PSA Inventory</strong>
            <span>Management System</span>
          </div>
          <button className="dashboard-close" aria-label="Close menu" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="dashboard-menu" aria-label="Main navigation">
          <p>MAIN MENU</p>
          {navigation.map(({ label, icon: Icon, active }) => (
            <button key={label} type="button" className={`dashboard-menu-item ${active ? 'is-active' : ''}`}>
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-footer">
          <button type="button" className="dashboard-menu-item"><Settings size={20} /><span>Settings</span></button>
          <button type="button" className="dashboard-menu-item dashboard-logout" onClick={() => void logout()}>
            <LogOut size={20} /><span>Logout</span>
          </button>
          <div className="dashboard-sidebar-note"><span>PSA</span> Property &amp; Supply Accountability</div>
        </div>
      </aside>

      <section className="dashboard-workspace">
        <header className="dashboard-topnav">
          <div className="dashboard-page-heading">
            <button type="button" className="dashboard-menu-toggle" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
            <div><p>PSA Inventory Management</p><h1>Dashboard Overview</h1></div>
          </div>
          <div className="dashboard-topnav-actions">
            <label className="dashboard-global-search"><Search size={18} /><input aria-label="Search inventory" placeholder="Search inventory..." /></label>
            <button type="button" className="dashboard-icon-button" aria-label="Notifications"><Bell size={20} /><i /></button>
            <div className="dashboard-user-menu"><span>{initials(userName)}</span><div><strong>{userName}</strong><small>{userRole}</small></div><ChevronDown size={16} /></div>
          </div>
        </header>

        <main className="dashboard-main">
          <section className="dashboard-welcome fade-up">
            <div>
              <p className="dashboard-eyebrow">{currentDate()}</p>
              <h2>{greeting()}, <span>{userName}</span></h2>
              <p>Here is the latest overview of your property and supply accountability.</p>
            </div>
            <div className="dashboard-primary-actions">
              <button type="button" className="dashboard-button dashboard-button-secondary"><FileBarChart size={18} /> Generate report</button>
              <button type="button" className="dashboard-button dashboard-button-primary"><PackagePlus size={18} /> Register asset</button>
            </div>
          </section>

          {error && <Alert tone="error" title="Dashboard data is unavailable" className="dashboard-alert">Please try again shortly.</Alert>}

          <section className="dashboard-stat-grid" aria-label="Asset statistics">
            {cards.map(({ label, value, subtitle, icon: Icon, accent }) => (
              <article key={label} className={`dashboard-stat-card dashboard-stat-card-${accent}`}>
                <div className="dashboard-stat-icon"><Icon size={22} /></div>
                {loading ? <span className="dashboard-skeleton dashboard-skeleton-number" /> : <strong>{value ?? '—'}</strong>}
                <p>{label}</p><small>{subtitle}</small>
                <span className="dashboard-stat-detail"><Activity size={13} /> Current total</span>
              </article>
            ))}
          </section>

          <section className="dashboard-insights-grid">
            <article className="dashboard-panel dashboard-trend-panel">
              <div className="dashboard-panel-heading"><div><p>ASSET UTILIZATION</p><h3>Borrowing &amp; reservation overview</h3></div><button type="button" className="dashboard-period">Current totals <ChevronDown size={15} /></button></div>
              {loading ? <div className="dashboard-chart-skeleton" /> : <div className="dashboard-bar-chart" aria-label="Borrowing and reservation chart">
                {[{ label: 'Available', value: stats?.available ?? 0, tone: 'available' }, { label: 'Borrowed', value: stats?.borrowed ?? 0, tone: 'borrowed' }, { label: 'Reserved', value: stats?.reserved ?? 0, tone: 'reserved' }].map((item) => (
                  <div className="dashboard-bar-group" key={item.label}><span className="dashboard-bar-value">{item.value}</span><div className="dashboard-bar-track"><div className={`dashboard-bar dashboard-bar-${item.tone}`} style={{ height: `${Math.max(8, (item.value / maximum) * 100)}%` }} /></div><span>{item.label}</span></div>
                ))}
              </div>}
            </article>

            <article className="dashboard-panel dashboard-distribution-panel">
              <div className="dashboard-panel-heading"><div><p>ASSET DISTRIBUTION</p><h3>Current asset status</h3></div><button type="button" className="dashboard-more" aria-label="More options"><MoreHorizontal size={21} /></button></div>
              {loading ? <div className="dashboard-chart-skeleton dashboard-chart-skeleton-circle" /> : <div className="dashboard-distribution"><div className="dashboard-donut" style={{ background: `conic-gradient(#0E4BB5 0 ${(stats?.total_assets ? ((stats.available / stats.total_assets) * 100) : 0)}%, #1D65D8 0 ${(stats?.total_assets ? (((stats.available + stats.borrowed) / stats.total_assets) * 100) : 0)}%, #F6C400 0 ${(stats?.total_assets ? (((stats.available + stats.borrowed + stats.reserved) / stats.total_assets) * 100) : 0)}%, #F08A24 0 100%)` }}><span><strong>{stats?.total_assets ?? 0}</strong><small>assets</small></span></div><div className="dashboard-legend"><span><i className="available" />Available <b>{stats?.available ?? 0}</b></span><span><i className="borrowed" />Borrowed <b>{stats?.borrowed ?? 0}</b></span><span><i className="reserved" />Reserved <b>{stats?.reserved ?? 0}</b></span><span><i className="maintenance" />Maintenance <b>{stats?.maintenance ?? 0}</b></span></div></div>}
            </article>

            <article className="dashboard-panel dashboard-quick-actions">
              <div className="dashboard-panel-heading"><div><p>WORKSPACE</p><h3>Quick actions</h3></div></div>
              <div className="dashboard-action-list"><button type="button"><span className="action-blue"><PackagePlus size={19} /></span><div><strong>Register asset</strong><small>Add a new property item</small></div></button><button type="button"><span className="action-green"><HandCoins size={19} /></span><div><strong>Borrow asset</strong><small>Issue an available item</small></div></button><button type="button"><span className="action-yellow"><CalendarDays size={19} /></span><div><strong>Reserve asset</strong><small>Schedule a future request</small></div></button><button type="button"><span className="action-red"><Users size={19} /></span><div><strong>Manage users</strong><small>Review user access</small></div></button></div>
            </article>
          </section>

          <section className="dashboard-panel dashboard-activity-panel">
            <div className="dashboard-panel-heading dashboard-activity-heading"><div><p>ACTIVITY LOG</p><h3>Recent activity</h3></div><div className="dashboard-table-tools"><label><Search size={16} /><input value={query} onChange={(event) => resetPage(filter, event.target.value)} placeholder="Search activity" /></label><select value={filter} onChange={(event) => resetPage(event.target.value)} aria-label="Filter activity by module">{modules.map((module) => <option key={module}>{module}</option>)}</select></div></div>
            {loading ? <div className="dashboard-table-skeleton">{Array.from({ length: 4 }).map((_, index) => <span key={index} />)}</div> : visibleActivity.length === 0 ? <EmptyState title="No recent activity" description="Activity matching your search will appear here." /> : <><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Date</th><th>User</th><th>Module</th><th>Description</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleActivity.map((item) => <tr key={item.id}><td>{item.created_at}</td><td><span className="dashboard-table-user">{initials(item.user)}</span>{item.user}</td><td><Badge tone={moduleTone(item.module)}>{item.module}</Badge></td><td>{item.action}</td><td><span className="dashboard-recorded">Recorded</span></td><td><button type="button" className="dashboard-row-menu" aria-label={`More actions for ${item.action}`}><MoreHorizontal size={19} /></button></td></tr>)}</tbody></table></div><footer className="dashboard-pagination"><p>Showing {Math.min(filteredActivity.length, (page - 1) * perPage + 1)}–{Math.min(page * perPage, filteredActivity.length)} of {filteredActivity.length} entries</p><div><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>{page} / {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button></div></footer></>}
          </section>
        </main>
      </section>
    </div>
  )
}
