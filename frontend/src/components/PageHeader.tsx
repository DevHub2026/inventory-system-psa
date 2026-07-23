import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Optional breadcrumb / context line rendered above the title */
  breadcrumb?: string
  actions?: ReactNode
  className?: string
}

/**
 * Slim, institutional page header.
 *
 * Layout:
 *   Left  — breadcrumb (small muted line) / title (semibold, not oversized) / subtitle
 *   Right — action buttons
 *
 * Deliberately compact: the header should orient the user, not dominate the viewport.
 */
export function PageHeader({ title, subtitle, breadcrumb, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>

      {/* ── Left ── */}
      <div>
        {breadcrumb && (
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-[20px] font-bold leading-tight tracking-tight text-slate-800 sm:text-[22px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>
        )}
      </div>

      {/* ── Right: actions ── */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
