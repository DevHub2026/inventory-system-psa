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

const toneConfig: Record<MetricTone, { card: string; icon: string; bar: string }> = {
  blue:   { card: 'border-blue-100',   icon: 'bg-[#003DA5] text-white',      bar: 'bg-[#003DA5]' },
  green:  { card: 'border-emerald-100',icon: 'bg-emerald-600 text-white',     bar: 'bg-emerald-500' },
  amber:  { card: 'border-amber-100',  icon: 'bg-[#FFD400] text-[#003DA5]',  bar: 'bg-[#FFD400]' },
  red:    { card: 'border-red-100',    icon: 'bg-[#E31C23] text-white',       bar: 'bg-[#E31C23]' },
  violet: { card: 'border-violet-100', icon: 'bg-violet-600 text-white',      bar: 'bg-violet-500' },
  teal:   { card: 'border-teal-100',   icon: 'bg-teal-600 text-white',        bar: 'bg-teal-500' },
}

export function DashboardStatCard({ label, value, description, icon: Icon, tone = 'blue' }: DashboardStatCardProps) {
  const cfg = toneConfig[tone]

  return (
    <div className={cn(
      'dashboard-stat-card relative flex flex-col justify-between overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
      cfg.card,
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1.5 text-[1.75rem] font-extrabold leading-none tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span className={cn('mt-0.5 grid h-10 w-10 flex-none place-items-center rounded-xl shadow-sm', cfg.icon)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      {/* Description */}
      <p className="mt-3 text-[11px] font-medium text-slate-400">{description}</p>

      {/* Colour accent line at bottom */}
      <span className={cn('absolute bottom-0 left-0 h-[3px] w-full opacity-80', cfg.bar)} aria-hidden="true" />
    </div>
  )
}
