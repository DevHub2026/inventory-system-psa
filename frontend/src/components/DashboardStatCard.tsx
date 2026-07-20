import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/utils/cn'

type MetricTone = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal'

interface DashboardStatCardProps {
  label: string
  value: number | string
  description: string
  icon: LucideIcon
  tone?: MetricTone
}

const toneClasses: Record<MetricTone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  teal: 'bg-teal-50 text-teal-700 ring-teal-100',
}

export function DashboardStatCard({ label, value, description, icon: Icon, tone = 'blue' }: DashboardStatCardProps) {
  return (
    <Card className="dashboard-stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={cn('grid h-9 w-9 place-items-center rounded-xl ring-1', toneClasses[tone])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">{description}</p>
    </Card>
  )
}
