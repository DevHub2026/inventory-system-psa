import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function Card({ title, subtitle, actions, children, className, noPadding }: CardProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-[#E2EAF3] bg-white shadow-[0_2px_8px_rgba(0,61,165,0.06)]',
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F8] px-5 py-3.5">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className={cn(!noPadding && 'p-5')}>{children}</div>
    </section>
  )
}
