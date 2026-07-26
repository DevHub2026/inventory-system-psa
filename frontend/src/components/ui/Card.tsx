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
      style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', boxSizing: 'border-box' }}
      className={cn('transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,.08)]', className)}
    >
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid #f1f5f9', padding: '16px 20px' }}>
          <div style={{ minWidth: 0 }}>
            {title && (
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          {actions && (
            <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 10 }}>{actions}</div>
          )}
        </div>
      )}
      <div style={!noPadding ? { padding: '20px' } : undefined}>{children}</div>
    </section>
  )
}
