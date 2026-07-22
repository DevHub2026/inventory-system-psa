import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Input({ label, error, helperText, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[13px] font-medium text-[#1F2937]"
        >
          {label}
        </label>
      )}

      {/* Input field — h-11 = 44px */}
      <input
        id={inputId}
        className={cn(
          // layout
          'block w-full h-11 px-3.5',
          // shape
          'rounded-[10px] border border-[#E5E7EB]',
          // surface
          'bg-white text-[14px] text-[#1F2937]',
          // placeholder
          'placeholder:text-[#9CA3AF]',
          // shadow
          'shadow-[0_1px_2px_rgba(0,0,0,.05)]',
          // transitions
          'transition-colors duration-200',
          // focus
          'focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15',
          // disabled
          'disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]',
          // read-only
          'read-only:bg-[#F9FAFB] read-only:text-[#6B7280]',
          // error state
          error && 'border-[#D32F2F] focus:ring-[#D32F2F]/15',
          className,
        )}
        {...props}
      />

      {/* Helper / error text */}
      {helperText && !error && (
        <p className="mt-1.5 text-[13px] text-[#6B7280]">{helperText}</p>
      )}
      {error && (
        <p className="mt-1.5 text-[13px] font-medium text-[#D32F2F]">{error}</p>
      )}
    </div>
  )
}
