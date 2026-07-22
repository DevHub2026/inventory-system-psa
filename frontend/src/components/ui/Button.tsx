import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'
export type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[#003DA5] text-white border border-[#003DA5] shadow-sm hover:bg-[#002A75] hover:border-[#002A75] focus-visible:ring-2 focus-visible:ring-[#003DA5]/40',
  secondary:
    'bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 hover:border-slate-400',
  outline:
    'bg-transparent text-[#003DA5] border border-[#003DA5]/40 hover:bg-[#EEF4FF]',
  danger:
    'bg-[#E31C23] text-white border border-[#E31C23] shadow-sm hover:bg-red-700 hover:border-red-700',
  success:
    'bg-emerald-600 text-white border border-emerald-600 shadow-sm hover:bg-emerald-700',
  ghost:
    'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs gap-1',
  md: 'h-9 px-4 text-sm gap-1.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'enabled:active:translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
