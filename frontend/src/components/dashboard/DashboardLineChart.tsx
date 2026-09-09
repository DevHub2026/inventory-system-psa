/**
 * DashboardLineChart
 *
 * Recharts-based line chart for 5-month trend data.
 * - Fills sparse months (months with no API records) to zero so the line
 *   accurately shows zero activity, not a gap or misleading direct connection.
 *   This is a display transformation of real data — not fabricated values.
 * - Handles empty, all-zero, and loading states explicitly.
 * - Respects prefers-reduced-motion.
 * - Provides a screen-reader text summary adjacent to the chart.
 *
 * Scoped to src/components/dashboard/ — not a global shared-component.
 */
import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import type { DashboardSeriesPoint } from '@/types'
import { EmptyState } from '@/components/ui'
import { Spinner } from '@/components/ui'

interface DashboardLineChartProps {
  /** Raw series from the API — only months with records are present */
  data: DashboardSeriesPoint[]
  color?: string
  loading?: boolean
  ariaLabel: string
  emptyTitle?: string
  emptyDescription?: string
  /** Chart height — defaults to 160 */
  height?: number
}

/** Build the ordered 5-month window from today, filling missing months to 0 */
function buildFilledSeries(
  raw: DashboardSeriesPoint[],
): Array<{ label: string; value: number }> {
  // Generate the last 5 months (same window as the backend query)
  const months: string[] = []
  const now = new Date()
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(
      d.toLocaleString('en-US', { month: 'short' }),
    )
  }

  // Build a lookup from the API data (label = "Jan", "Feb" etc.)
  const lookup = new Map(raw.map((p) => [p.label, p.value]))

  return months.map((month) => ({
    label: month,
    value: lookup.get(month) ?? 0,
  }))
}

/** Detect user preference for reduced motion */
function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function LineTooltip(props: TooltipProps<number, string>) {
  const { active } = props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = (props as any).payload as Array<{ value?: number }> | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const label = (props as any).label as string | undefined
  if (!active || !payload || payload.length === 0) return null
  const val = payload[0]?.value ?? 0
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
      <div style={{ fontWeight: 600, color: '#1e293b' }}>{label ?? ''}</div>
      <div style={{ color: '#64748b', marginTop: 2 }}>{val}</div>
    </div>
  )
}

export function DashboardLineChart({
  data,
  color = '#003DA5',
  loading = false,
  ariaLabel,
  emptyTitle = 'No activity in the past 5 months',
  emptyDescription = 'Data will appear here once records exist.',
  height = 160,
}: DashboardLineChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const filled = useMemo(() => buildFilledSeries(data), [data])
  const total = useMemo(() => filled.reduce((s, p) => s + p.value, 0), [filled])

  // Screen-reader summary
  const srSummary = useMemo(() => {
    if (total === 0) return `${ariaLabel}: no activity recorded.`
    const parts = filled
      .filter((p) => p.value > 0)
      .map((p) => `${p.label}: ${p.value}`)
    return `${ariaLabel} over the past 5 months. ${parts.join(', ')}.`
  }, [filled, total, ariaLabel])

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

  if (total === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    )
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Screen-reader only summary */}
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

      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={filled}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'inherit' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<LineTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
              isAnimationActive={!reducedMotion}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
