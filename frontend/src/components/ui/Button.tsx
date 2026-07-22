import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'
export type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[#0D47A1] text-white border border-[#0D47A1] shadow-sm ' +
    'hover:bg-[#1565C0] hover:border-[#1565C0] ' +
    'focus-visible:ring-2 focus-visible:ring-[#0D47A1]/40',
  secondary:
    'bg-white text-[#1F2937] border border-[#E5E7EB] shadow-sm ' +
    'hover:bg-[#F3F4F6] hover:border-[#D1D5DB]',
  outline:
    'bg-transparent text-[#0D47A1] border border-[#0D47A1]/40 ' +
    'hover:bg-[#EEF4FF] hover:border-[#0D47A1]/70',
  danger:
    'bg-[#D32F2F] text-white border border-[#D32F2F] shadow-sm ' +
    'hover:bg-[#B71C1C] hover:border-[#B71C1C]',
  success:
    'bg-[#2E7D32] text-white border border-[#2E7D32] shadow-sm ' +
    'hover:bg-[#1B5E20] hover:border-[#1B5E20]',
  ghost:
    'bg-transparent text-[#6B7280] border border-transparent ' +
    'hover:bg-[#F3F4F6] hover:text-[#1F2937]',
}

/*
 * All sizes maintain the same proportions:
 *   md  → h-10 (40px) · px-5 (20px) · py-2.5 (10px) · text-sm (14px)
 *   sm  → h-8  (32px) · px-3 (12px) · text-xs (12px)   — table actions
 *   lg  → h-11 (44px) · px-6 (24px) · text-sm (14px)   — prominent CTAs
 */
const sizes: Record<Size, string> = {
  sm: 'h-8  px-3   text-xs  gap-1.5',
  md: 'h-10 px-5   text-sm  gap-2',
  lg: 'h-11 px-6   text-sm  gap-2',
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
        // base
        'inline-flex items-center justify-center whitespace-nowrap',
        'rounded-[10px] font-medium leading-none',
        'transition-all duration-200 ease-in-out',
        // disabled state
        'disabled:cursor-not-allowed disabled:opacity-50',
        // active press micro-interaction
        'enabled:active:scale-[0.97]',
        // focus ring
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
