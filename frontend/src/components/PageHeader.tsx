import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

/**
 * Consistent page-level header used by every page.
 * Left: PSA accent bar + title + subtitle.
 * Right: action buttons, always right-aligned.
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      {/* Left — title block */}
      <div className="flex items-start gap-3">
        {/* PSA vertical accent */}
        <div className="mt-0.5 flex flex-col gap-[3px]">
          <span className="h-4 w-[3px] rounded-full bg-[#003DA5]" />
          <span className="h-2 w-[3px] rounded-full bg-[#FFD400]" />
          <span className="h-1 w-[3px] rounded-full bg-[#E31C23]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right — actions */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
