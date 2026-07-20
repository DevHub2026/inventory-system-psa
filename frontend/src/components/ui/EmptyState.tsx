import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title = 'No records found',
  description = 'There is nothing to display yet.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-14 text-center', className)}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Inbox className="h-6 w-6" /></span>
      <h3 className="mt-1 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="max-w-sm text-xs text-slate-500">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
