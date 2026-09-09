/**
 * DashboardPanel
 *
 * Consolidated card-with-header component used across all three dashboards.
 * Replaces the three near-identical local Panel implementations previously
 * duplicated inside AdminDashboard, StaffDashboard, and EmployeeDashboard.
 *
 * Scoped to src/components/dashboard/ — not a global shared-component.
 */
import { Spinner } from '@/components/ui'

interface DashboardPanelProps {
  title: string
  subtitle?: string
  /** Numeric badge shown next to the title when > 0 */
  count?: number
  /** Controls badge and border colour when count > 0 */
  countTone?: 'amber' | 'red' | 'teal'
  onViewAll?: () => void
  viewAllLabel?: string
  loading: boolean
  /** Renders the panel header/border in red-tinted urgent styling */
  urgent?: boolean
  children: React.ReactNode
}

const TONES = {
  amber: { bg: '#fef3c7', color: '#92400e' },
  red:   { bg: '#fee2e2', color: '#991b1b' },
  teal:  { bg: '#ccfbf1', color: '#0f766e' },
}

export function DashboardPanel({
  title,
  subtitle,
  count,
  countTone,
  onViewAll,
  viewAllLabel = 'View all',
  loading,
  urgent = false,
  children,
}: DashboardPanelProps) {
  const border     = urgent ? '#fecaca' : '#e2e8f0'
  const headerBg   = urgent ? '#fef2f2' : '#ffffff'
  const titleColor = urgent ? '#b91c1c' : '#1e293b'
  const subColor   = urgent ? '#fca5a5' : '#64748b'
  const linkColor  = urgent ? '#dc2626' : '#003DA5'

  const badgeTone = countTone ? TONES[countTone] : null

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        border: `1px solid ${border}`,
        borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 20px',
          borderBottom: `1px solid ${urgent ? '#fecaca' : '#f1f5f9'}`,
          background: headerBg,
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {/* Title + optional count badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: titleColor,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
            {count !== undefined && count > 0 && badgeTone && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 18,
                  height: 18,
                  padding: '0 6px',
                  marginLeft: 8,
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1,
                  background: badgeTone.bg,
                  color: badgeTone.color,
                }}
              >
                {count}
              </span>
            )}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: 12,
                color: subColor,
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            style={{
              flexShrink: 0,
              whiteSpace: 'nowrap',
              fontSize: 12,
              fontWeight: 500,
              color: linkColor,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            {viewAllLabel}
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowX: 'auto' }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '48px 0',
            }}
          >
            <Spinner />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
