import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  /** Remove the default 20px inner padding (e.g. for full-bleed tables) */
  noPadding?: boolean
}

export function Card({ title, subtitle, actions, children, className, noPadding }: CardProps) {
  return (
    <section
      className={cn(
        // shape & surface
        'overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white',
        // shadow per spec: 0 4px 12px rgba(0,0,0,.08)
        'shadow-[0_4px_12px_rgba(0,0,0,.08)]',
        // hover lift
        'transition-[box-shadow,transform] duration-200',
        'hover:shadow-[0_8px_20px_rgba(0,0,0,.10)] hover:-translate-y-px',
        className,
      )}
    >
      {/* ── Optional header ── */}
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-[14px] font-semibold leading-snug text-[#1F2937]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* ── Body ── */}
      <div className={cn(!noPadding && 'p-5')}>{children}</div>
    </section>
  )
}
