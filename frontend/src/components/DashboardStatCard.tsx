import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export type MetricTone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal'

interface DashboardStatCardProps {
  label: string
  value: number | string
  description: string
  icon: LucideIcon
  tone?: MetricTone
}

const TONES: Record<MetricTone, { accent: string; iconBg: string; iconColor: string }> = {
  blue:   { accent: '#1565C0', iconBg: 'bg-blue-50',    iconColor: 'text-[#1565C0]' },
  green:  { accent: '#2E7D32', iconBg: 'bg-emerald-50', iconColor: 'text-[#2E7D32]' },
  amber:  { accent: '#D97706', iconBg: 'bg-amber-50',   iconColor: 'text-[#D97706]' },
  red:    { accent: '#C62828', iconBg: 'bg-red-50',     iconColor: 'text-[#C62828]' },
  violet: { accent: '#5B21B6', iconBg: 'bg-violet-50',  iconColor: 'text-[#5B21B6]' },
  teal:   { accent: '#0F766E', iconBg: 'bg-teal-50',    iconColor: 'text-[#0F766E]' },
}

export function DashboardStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'blue',
}: DashboardStatCardProps) {
  const { accent, iconBg, iconColor } = TONES[tone]

  return (
    /*
     * ALL card-level styles are inline to eliminate any conflict with:
     *   - Tailwind border utilities (border, border-l-4, rounded-2xl)
     *   - Global CSS resets (border: 0 solid)
     *   - overflow clipping from border-radius on flex containers
     *
     * Structure:
     *   card (flex column, 24px padding)
     *     header (flex row, space-between)
     *       label (top-left)
     *       icon  (top-right)
     *     number  (large, accent color)
     *     description (pushed to bottom via mt-auto)
     */
    <article
      style={{
        /* Layout */
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '148px',
        /* Spacing — 20px padding on all sides */
        padding: '20px',
        /* Surface */
        background: '#ffffff',
        borderRadius: '16px',
        /* Borders: 1px light gray all around, 4px accent on left */
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${accent}`,
        /* Shadow */
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        /* No overflow clipping */
        overflow: 'visible',
        /* Smooth hover */
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* ── Row 1: label + icon ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>

        {/* Label */}
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: '#64748b',
          lineHeight: 1.35,
        }}>
          {label}
        </span>

        {/* Icon tile */}
        <span
          className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', iconBg)}
          aria-hidden="true"
        >
          <Icon className={cn('h-5 w-5', iconColor)} strokeWidth={1.75} />
        </span>
      </div>

      {/* ── Row 2: large number ── */}
      <div style={{
        fontSize: '36px',
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        color: accent,
        marginTop: '14px',
      }}>
        {value}
      </div>

      {/* ── Row 3: description (pushed to bottom) ── */}
      <div style={{
        fontSize: '12px',
        lineHeight: 1.4,
        color: '#94a3b8',
        marginTop: 'auto',
        paddingTop: '10px',
      }}>
        {description}
      </div>
    </article>
  )
}
