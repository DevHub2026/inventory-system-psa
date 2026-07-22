import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Tone = 'gray' | 'blue' | 'green' | 'red' | 'yellow'

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

const tones: Record<Tone, string> = {
  gray:   'bg-[#F3F4F6]  text-[#4B5563]   ring-1 ring-[#E5E7EB]',
  blue:   'bg-[#EEF4FF]  text-[#0D47A1]   ring-1 ring-[#BFDBFE]',
  green:  'bg-[#F0FDF4]  text-[#2E7D32]   ring-1 ring-[#BBF7D0]',
  red:    'bg-[#FEF2F2]  text-[#D32F2F]   ring-1 ring-[#FECACA]',
  yellow: 'bg-[#FFFBEB]  text-[#B45309]   ring-1 ring-[#FDE68A]',
}

export function Badge({ children, tone = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full',
        'px-2.5 py-0.5',
        'text-[12px] font-semibold leading-5 whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
