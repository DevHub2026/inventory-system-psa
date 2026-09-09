/**
 * OperationalInsights
 *
 * Admin-only. Renders an ordered list of actionable operational signals
 * using data already loaded by AdminDashboard — no new API calls.
 *
 * Data sources (all pre-fetched in AdminDashboard.loadData):
 *   overdueCount       — getOverdueAssets().length
 *   lowStockCount      — stats.inventory.low_stock  (all items, not Supply-only)
 *   pendingRequests    — stats.reservations.pending
 *   pendingExtensions  — borrowExtensionService count
 *   maintenancePending — analytics.maintenance_summary.pending
 *   maintenanceOngoing — analytics.maintenance_summary.ongoing
 *
 * Scoped to src/components/dashboard/ — not a global shared-component.
 */
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  PackageMinus,
  ClipboardList,
  CalendarClock,
  Wrench,
  ChevronRight,
} from 'lucide-react'

interface InsightRow {
  icon: React.ReactNode
  label: string
  count: number
  /** Tone drives background and count badge colour */
  tone: 'red' | 'amber' | 'blue' | 'neutral'
  to: string
  linkLabel: string
}

interface OperationalInsightsProps {
  overdueCount: number
  lowStockCount: number
  pendingRequests: number
  pendingExtensions: number
  maintenancePending: number
  maintenanceOngoing: number
}

const TONE_COLORS = {
  red:     { iconBg: '#fef2f2', iconColor: '#dc2626', badgeBg: '#fee2e2', badgeColor: '#991b1b' },
  amber:   { iconBg: '#fffbeb', iconColor: '#d97706', badgeBg: '#fef3c7', badgeColor: '#92400e' },
  blue:    { iconBg: '#eff6ff', iconColor: '#003DA5', badgeBg: '#dbeafe', badgeColor: '#1e40af' },
  neutral: { iconBg: '#f8fafc', iconColor: '#64748b', badgeBg: '#f1f5f9', badgeColor: '#475569' },
}

function InsightItem({ row }: { row: InsightRow }) {
  const navigate = useNavigate()
  const colors = TONE_COLORS[row.tone]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderBottom: '1px solid #f8fafc',
      }}
    >
      {/* Icon */}
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 34,
          height: 34,
          borderRadius: 10,
          background: colors.iconBg,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {row.icon}
      </span>

      {/* Label + count */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#1e293b',
              lineHeight: 1.3,
            }}
          >
            {row.label}
          </span>
          {row.count > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                background: colors.badgeBg,
                color: colors.badgeColor,
                lineHeight: 1,
              }}
            >
              {row.count}
            </span>
          )}
        </div>
      </div>

      {/* Link */}
      <button
        type="button"
        onClick={() => navigate(row.to)}
        aria-label={`${row.linkLabel} for ${row.label}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 600,
          color: '#003DA5',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        {row.linkLabel}
        <ChevronRight size={13} />
      </button>
    </div>
  )
}

export function OperationalInsights({
  overdueCount,
  lowStockCount,
  pendingRequests,
  pendingExtensions,
  maintenancePending,
  maintenanceOngoing,
}: OperationalInsightsProps) {
  const maintenanceActive = maintenancePending + maintenanceOngoing

  const rows: InsightRow[] = [
    {
      icon: <AlertTriangle size={16} color="#dc2626" strokeWidth={2} />,
      label: 'Overdue Items',
      count: overdueCount,
      tone: overdueCount > 0 ? 'red' : 'neutral',
      to: '/borrowings',
      linkLabel: 'View Details',
    },
    {
      icon: <PackageMinus size={16} color="#d97706" strokeWidth={2} />,
      label: 'Low Stock Items',
      count: lowStockCount,
      tone: lowStockCount > 0 ? 'amber' : 'neutral',
      to: '/inventory',
      linkLabel: 'View Inventory',
    },
    {
      icon: <ClipboardList size={16} color="#003DA5" strokeWidth={2} />,
      label: 'Pending Reservations',
      count: pendingRequests,
      tone: pendingRequests > 0 ? 'blue' : 'neutral',
      to: '/reservations',
      linkLabel: 'Review Now',
    },
    {
      icon: <CalendarClock size={16} color="#d97706" strokeWidth={2} />,
      label: 'Pending Extensions',
      count: pendingExtensions,
      tone: pendingExtensions > 0 ? 'amber' : 'neutral',
      to: '/extension-requests',
      linkLabel: 'Review',
    },
    {
      icon: <Wrench size={16} color="#64748b" strokeWidth={2} />,
      label: `Maintenance (pending/ongoing)`,
      count: maintenanceActive,
      tone: maintenanceActive > 0 ? 'amber' : 'neutral',
      to: '/maintenance',
      linkLabel: 'View Schedule',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((row) => (
        <InsightItem key={row.label} row={row} />
      ))}
    </div>
  )
}
