import type { ReactNode } from 'react'

export type Tone = 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'teal' | 'violet' | 'orange'

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

/*
 * Badge — 100% inline styles so the global CSS cascade cannot
 * override colors. Tailwind classes were being beaten by
 * global element rules (span, p, etc.) in index.css.
 */
const TONES: Record<Tone, { background: string; color: string; border: string }> = {
  gray:   { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
  blue:   { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  green:  { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
  red:    { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
  yellow: { background: '#fefce8', color: '#854d0e', border: '1px solid #fde68a' },
  teal:   { background: '#f0fdfa', color: '#0f766e', border: '1px solid #99f6e4' },
  violet: { background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' },
  orange: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
}

export function Badge({ children, tone = 'gray', className }: BadgeProps) {
  const t = TONES[tone]
  return (
    <span
      className={className}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        borderRadius:   999,
        padding:        '2px 10px',
        fontSize:       12,
        fontWeight:     600,
        lineHeight:     1.5,
        whiteSpace:     'nowrap',
        background:     t.background,
        color:          t.color,
        border:         t.border,
        boxSizing:      'border-box',
      }}
    >
      {children}
    </span>
  )
}
