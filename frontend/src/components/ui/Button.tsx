import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'border border-brand-700 bg-brand-700 text-white shadow-[0_2px_5px_rgba(0,61,165,0.18)] hover:bg-brand-800 hover:shadow-[0_5px_14px_rgba(0,61,165,0.2)]',
  secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50',
  outline: 'border border-brand-700/30 bg-transparent text-brand-700 hover:bg-brand-50',
  danger: 'border border-danger bg-danger text-white shadow-sm hover:bg-red-700',
  success: 'border border-success bg-success text-white shadow-sm hover:bg-emerald-800',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
}

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
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
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 enabled:active:translate-y-px',
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
