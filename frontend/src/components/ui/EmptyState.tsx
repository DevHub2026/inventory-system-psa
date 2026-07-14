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
    <div className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}>
      <Inbox className="h-8 w-8 text-gray-400" />
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <p className="max-w-sm text-xs text-gray-500">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
