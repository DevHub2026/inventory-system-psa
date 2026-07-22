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
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 text-center',
        className,
      )}
    >
      {/* Icon container */}
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#EEF4FF] text-[#0D47A1]">
        <Inbox className="h-7 w-7" strokeWidth={1.5} />
      </span>

      {/* Text */}
      <div>
        <h3 className="text-[14px] font-semibold text-[#1F2937]">{title}</h3>
        <p className="mt-1 max-w-xs text-[13px] text-[#6B7280]">{description}</p>
      </div>

      {/* Optional action */}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
