import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

type MetricTone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal'

interface DashboardStatCardProps {
  label: string
  value: number | string
  description: string
  icon: LucideIcon
  tone?: MetricTone
}

/*
 * Design decisions:
 *   - Left accent border (4px) carries the tone colour — draws the eye
 *     down the row of cards without overwhelming the card surface.
 *   - Icon sits in a very light tinted square, top-right.
 *   - Value: 32px bold — large enough to scan instantly, not so large it
 *     breaks on smaller screens.
 *   - Card is intentionally compact (min-h ~100px) — 8 cards in 4-col grid
 *     should never feel oversized.
 *   - No bottom-bar gradient — cleaner, more institutional.
 */
const cfg: Record<MetricTone, {
  border: string
  accent: string
  iconBg: string
  iconColor: string
  valueColor: string
}> = {
  blue:   { border: 'border-slate-200', accent: 'bg-[#1565C0]',  iconBg: 'bg-blue-50',    iconColor: 'text-[#1565C0]',  valueColor: 'text-[#1565C0]' },
  green:  { border: 'border-slate-200', accent: 'bg-[#2E7D32]',  iconBg: 'bg-emerald-50', iconColor: 'text-[#2E7D32]',  valueColor: 'text-[#2E7D32]' },
  amber:  { border: 'border-slate-200', accent: 'bg-[#D97706]',  iconBg: 'bg-amber-50',   iconColor: 'text-[#D97706]',  valueColor: 'text-[#92400E]' },
  red:    { border: 'border-slate-200', accent: 'bg-[#C62828]',  iconBg: 'bg-red-50',     iconColor: 'text-[#C62828]',  valueColor: 'text-[#C62828]' },
  violet: { border: 'border-slate-200', accent: 'bg-[#6D28D9]',  iconBg: 'bg-violet-50',  iconColor: 'text-[#6D28D9]',  valueColor: 'text-[#6D28D9]' },
  teal:   { border: 'border-slate-200', accent: 'bg-[#0F766E]',  iconBg: 'bg-teal-50',    iconColor: 'text-[#0F766E]',  valueColor: 'text-[#0F766E]' },
}

export function DashboardStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'blue',
}: DashboardStatCardProps) {
  const c = cfg[tone]

  return (
    <article
      className={cn(
        'relative flex flex-col justify-between overflow-hidden',
        'rounded-xl border bg-white',
        'px-4 py-4',
        /* subtle shadow — institutional, not decorative */
        'shadow-[0_1px_3px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.05)]',
        'transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,.09)]',
        c.border,
      )}
    >
      {/* Left accent bar */}
      <span
        className={cn('absolute inset-y-0 left-0 w-[3px] rounded-r-full', c.accent)}
        aria-hidden="true"
      />

      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-2 pl-1">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
            c.iconBg,
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-4.5 w-4.5', c.iconColor)} strokeWidth={2} />
        </span>
      </div>

      {/* Value */}
      <p className={cn('mt-2 pl-1 text-[28px] font-bold leading-none tracking-tight', c.valueColor)}>
        {value}
      </p>

      {/* Description */}
      <p className="mt-1.5 pl-1 text-[12px] leading-snug text-slate-400">{description}</p>
    </article>
  )
}
