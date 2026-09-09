import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export type MetricTone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal' | 'gray' | 'orange'

interface DashboardStatCardProps {
  label: string
  value: number | string
  description?: string
  icon: LucideIcon
  tone?: MetricTone
  onClick?: () => void
  /**
   * When true, renders a compact horizontal layout suitable for
   * module-level summary bars (e.g. asset status strip, inventory totals).
   * The description field is optional in this mode.
   */
  compact?: boolean
  /** Highlight the card as the currently active filter/selection */
  active?: boolean
}

const TONES: Record<MetricTone, { accent: string; iconBg: string; iconColor: string; activeBorder: string }> = {
  blue:   { accent: '#003DA5', iconBg: 'bg-blue-50',    iconColor: 'text-[#003DA5]', activeBorder: '#003DA5' },
  green:  { accent: '#2E7D32', iconBg: 'bg-emerald-50', iconColor: 'text-[#2E7D32]', activeBorder: '#2E7D32' },
  amber:  { accent: '#F9A825', iconBg: 'bg-amber-50',   iconColor: 'text-[#F9A825]', activeBorder: '#F9A825' },
  red:    { accent: '#D32F2F', iconBg: 'bg-red-50',     iconColor: 'text-[#D32F2F]', activeBorder: '#D32F2F' },
  violet: { accent: '#5B21B6', iconBg: 'bg-violet-50',  iconColor: 'text-[#5B21B6]', activeBorder: '#5B21B6' },
  teal:   { accent: '#0F766E', iconBg: 'bg-teal-50',    iconColor: 'text-[#0F766E]', activeBorder: '#0F766E' },
  gray:   { accent: '#475569', iconBg: 'bg-slate-100',  iconColor: 'text-[#475569]', activeBorder: '#475569' },
  orange: { accent: '#C2410C', iconBg: 'bg-orange-50',  iconColor: 'text-[#C2410C]', activeBorder: '#C2410C' },
}

export function DashboardStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'blue',
  onClick,
  compact = false,
  active = false,
}: DashboardStatCardProps) {
  const { accent, iconBg, iconColor, activeBorder } = TONES[tone]

  if (compact) {
    /* ── Compact / horizontal layout (module summary use case) ── */
    return (
      <article
        onClick={onClick}
        className={onClick ? 'hover:shadow-[0_4px_16px_rgba(0,0,0,.08)] hover:-translate-y-0.5' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flex: '1 1 0',
          minWidth: 180,
          padding: '18px 20px',
          background: '#ffffff',
          borderRadius: 14,
          border: active ? `1px solid ${activeBorder}` : '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'visible',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          cursor: onClick ? 'pointer' : 'default',
          boxSizing: 'border-box',
        }}
      >
        {/* Icon tile */}
        <span
          className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', iconBg)}
          style={{ border: `1px solid ${accent}22` }}
          aria-hidden="true"
        >
          <Icon className={cn('h-5 w-5', iconColor)} strokeWidth={1.75} />
        </span>

        {/* Text */}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            lineHeight: 1.3,
          }}>
            {label}
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.2,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {value}
          </div>
        </div>
      </article>
    )
  }

  /* ── Standard / vertical layout (dashboard KPI use case) ── */
  return (
    <article
      onClick={onClick}
      className={onClick ? 'hover:shadow-[0_4px_16px_rgba(0,0,0,.08)] hover:-translate-y-0.5' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '148px',
        padding: '20px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${accent}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'visible',
        transition: 'box-shadow 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
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
          color: '#475569',
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
      {description && (
        <div style={{
          fontSize: '12px',
          lineHeight: 1.4,
          color: '#475569',
          marginTop: 'auto',
          paddingTop: '10px',
        }}>
          {description}
        </div>
      )}
    </article>
  )
}
