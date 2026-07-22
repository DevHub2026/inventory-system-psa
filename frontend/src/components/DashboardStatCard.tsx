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

/* Per spec:
   - Icon container: 48×48 px, border-radius 12px, centered icon
   - Statistic number: 40px bold
   - Card title: 14px medium
   - Description: 15px regular
   - Border-radius: 16px
   - Padding: 20px
   - Shadow: 0 4px 12px rgba(0,0,0,.08)
   - Layout: title top-left · icon top-right · number middle · description bottom
*/
const toneConfig: Record<
  MetricTone,
  { border: string; iconWrap: string; iconColor: string; bar: string; numColor: string }
> = {
  blue: {
    border:    'border-blue-100',
    iconWrap:  'bg-[#EEF4FF]',
    iconColor: 'text-[#0D47A1]',
    bar:       'bg-[#0D47A1]',
    numColor:  'text-[#0D47A1]',
  },
  green: {
    border:    'border-emerald-100',
    iconWrap:  'bg-[#F0FDF4]',
    iconColor: 'text-[#2E7D32]',
    bar:       'bg-[#2E7D32]',
    numColor:  'text-[#2E7D32]',
  },
  amber: {
    border:    'border-amber-100',
    iconWrap:  'bg-[#FFFBEB]',
    iconColor: 'text-[#B45309]',
    bar:       'bg-[#F59E0B]',
    numColor:  'text-[#B45309]',
  },
  red: {
    border:    'border-red-100',
    iconWrap:  'bg-[#FEF2F2]',
    iconColor: 'text-[#D32F2F]',
    bar:       'bg-[#D32F2F]',
    numColor:  'text-[#D32F2F]',
  },
  violet: {
    border:    'border-violet-100',
    iconWrap:  'bg-[#F5F3FF]',
    iconColor: 'text-[#7C3AED]',
    bar:       'bg-[#7C3AED]',
    numColor:  'text-[#7C3AED]',
  },
  teal: {
    border:    'border-teal-100',
    iconWrap:  'bg-[#F0FDFA]',
    iconColor: 'text-[#0F766E]',
    bar:       'bg-[#0F766E]',
    numColor:  'text-[#0F766E]',
  },
}

export function DashboardStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'blue',
}: DashboardStatCardProps) {
  const cfg = toneConfig[tone]

  return (
    <article
      className={cn(
        /* shape */
        'dashboard-stat-card relative overflow-hidden rounded-2xl border bg-white',
        /* spacing */
        'p-5',
        /* shadow */
        'shadow-[0_4px_12px_rgba(0,0,0,.08)]',
        /* hover lift */
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,.12)]',
        cfg.border,
      )}
    >
      {/* ── Row 1: title + icon ── */}
      <div className="flex items-start justify-between gap-3">
        {/* Card title — 14px medium */}
        <p className="text-[14px] font-medium leading-snug text-[#6B7280]">{label}</p>

        {/* Icon container — 48×48, radius 12 */}
        <span
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-[12px]',
            cfg.iconWrap,
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-5 w-5', cfg.iconColor)} />
        </span>
      </div>

      {/* ── Row 2: statistic number — 40px bold ── */}
      <p
        className={cn(
          'mt-3 text-[40px] font-bold leading-none tracking-tight',
          cfg.numColor,
        )}
      >
        {value}
      </p>

      {/* ── Row 3: description — 15px regular ── */}
      <p className="mt-2 text-[15px] leading-snug text-[#9CA3AF]">{description}</p>

      {/* Bottom accent bar */}
      <span
        className={cn('absolute bottom-0 left-0 h-[3px] w-full', cfg.bar)}
        aria-hidden="true"
      />
    </article>
  )
}
