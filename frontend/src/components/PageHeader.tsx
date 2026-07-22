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
 *
 * Left:  PSA tri-colour vertical accent bar  +  title (32px bold)  +  subtitle (15px)
 * Right: action buttons, always right-aligned, vertically centered with the title block.
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4',
        className,
      )}
    >
      {/* ── Left: accent + text ── */}
      <div className="flex items-center gap-3">
        {/* PSA tri-colour vertical accent */}
        <div className="flex flex-col gap-[3px]" aria-hidden="true">
          <span className="h-5 w-[3px] rounded-full bg-[#0D47A1]" />
          <span className="h-2.5 w-[3px] rounded-full bg-[#FFD400]" />
          <span className="h-1.5 w-[3px] rounded-full bg-[#E31C23]" />
        </div>

        <div>
          {/* Page title — 32px bold per spec */}
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#1F2937] sm:text-[32px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[15px] leading-snug text-[#6B7280]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Right: actions ── */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
