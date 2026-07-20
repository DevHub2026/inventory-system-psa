import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Tone = 'gray' | 'blue' | 'green' | 'red' | 'yellow'

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

const tones: Record<Tone, string> = {
  gray: 'border border-slate-200 bg-slate-100 text-slate-700',
  blue: 'border border-blue-200 bg-blue-50 text-blue-800',
  green: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
  red: 'border border-red-200 bg-red-50 text-red-800',
  yellow: 'border border-amber-200 bg-amber-50 text-amber-800',
}

export function Badge({ children, tone = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
