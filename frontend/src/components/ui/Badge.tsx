import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Tone = 'gray' | 'blue' | 'green' | 'red' | 'yellow'

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

const tones: Record<Tone, string> = {
  gray:   'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  blue:   'bg-[#EEF4FF] text-[#003DA5] ring-1 ring-[#C5D8FF]',
  green:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  red:    'bg-red-50 text-[#E31C23] ring-1 ring-red-200',
  yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
}

export function Badge({ children, tone = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5 whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
