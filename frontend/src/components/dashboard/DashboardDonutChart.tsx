/**
 * DashboardDonutChart
 *
 * Recharts-based donut chart for dashboard use only.
 * - Handles empty data, all-zero data, and loading states explicitly.
 * - Provides a screen-reader summary paragraph alongside the SVG chart.
 * - Respects prefers-reduced-motion by disabling Recharts animations when set.
 * - Uses real API data only; no mock/fallback values are ever injected.
 *
 * Scoped to src/components/dashboard/ — not a global shared-component.
 */
import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { Spinner } from '@/components/ui'
import { EmptyState } from '@/components/ui'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DashboardDonutChartProps {
  /** Chart segments with real API data — never synthetic */
  data: DonutSegment[]
  /** Text shown in the hole of the donut (usually the total count) */
  centerLabel?: string
  /** Second line in the donut hole (e.g. "Total Assets") */
  centerSublabel?: string
  loading?: boolean
  /** Accessible description for screen readers */
  ariaLabel: string
  /** Link label for the action button below the chart */
  actionLabel?: string
  onAction?: () => void
  /** Optional note rendered as visible text below the chart */
  note?: string
  /** Chart height — defaults to 220 */
  height?: number
}

/** Detect user preference for reduced motion */
function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Custom tooltip */
function DonutTooltip(props: TooltipProps<number, string>) {
  const { active } = props
  // Recharts 3.x uses a different internal shape; access via the passed props safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = (props as any).payload as Array<{ name?: string; value?: number }> | undefined
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  if (!entry) return null
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
        fontSize: 13,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ fontWeight: 600, color: '#1e293b' }}>{entry.name ?? ''}</div>
      <div style={{ color: '#64748b', marginTop: 2 }}>
        {entry.value ?? 0} item{(entry.value ?? 0) !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export function DashboardDonutChart({
  data,
  centerLabel,
  centerSublabel,
  loading = false,
  ariaLabel,
  actionLabel,
  onAction,
  note,
  height = 220,
}: DashboardDonutChartProps) {
  const reducedMotion = usePrefersReducedMotion()

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])
  const hasData = data.length > 0 && total > 0

  // Screen-reader summary text
  const srSummary = useMemo(() => {
    if (!hasData) return `${ariaLabel}: no data available.`
    const parts = data
      .filter((d) => d.value > 0)
      .map((d) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
        return `${d.label}: ${d.value} (${pct}%)`
      })
    return `${ariaLabel}. Total: ${total}. ${parts.join(', ')}.`
  }, [data, total, hasData, ariaLabel])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height,
        }}
      >
        <Spinner />
      </div>
    )
  }

  if (!hasData) {
    return (
      <EmptyState
        title="No data available"
        description="Data will appear here once records exist."
      />
    )
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Screen-reader only summary — chart SVG is aria-hidden */}
      <p
        className="sr-only"
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {srSummary}
      </p>

      {/* ── Chart + Legend row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        {/* Donut */}
        <div
          style={{ position: 'relative', flex: '0 0 auto', width: height, height }}
          aria-hidden="true"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="78%"
                paddingAngle={data.length > 1 ? 2 : 0}
                isAnimationActive={!reducedMotion}
                animationDuration={600}
                strokeWidth={0}
              >
                {data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label overlay */}
          {(centerLabel !== undefined || centerSublabel !== undefined) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                textAlign: 'center',
                padding: '0 16px',
              }}
            >
              {centerLabel !== undefined && (
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {centerLabel}
                </span>
              )}
              {centerSublabel !== undefined && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {centerSublabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flex: '1 1 120px',
            minWidth: 0,
          }}
        >
          {data.map((entry) => {
            const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0
            return (
              <div
                key={entry.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: entry.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: '#475569',
                    lineHeight: 1.3,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#1e293b',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}
                >
                  {entry.value}{' '}
                  <span style={{ fontWeight: 400, color: '#94a3b8' }}>
                    ({pct}%)
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Optional note */}
      {note && (
        <div
          style={{
            marginTop: 12,
            fontSize: 11.5,
            color: '#64748b',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 5,
          }}
        >
          <span style={{ flexShrink: 0, marginTop: 1 }}>★</span>
          <span>{note}</span>
        </div>
      )}

      {/* Optional action link */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: 14,
            display: 'block',
            width: '100%',
            padding: '8px 0',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            fontSize: 12,
            fontWeight: 600,
            color: '#003DA5',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#eef4ff' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc' }}
        >
          {actionLabel} →
        </button>
      )}
    </div>
  )
}
