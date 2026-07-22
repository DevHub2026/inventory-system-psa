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
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5 text-sm text-slate-900',
          'placeholder:text-slate-400 shadow-sm transition-colors',
          'focus:border-[#003DA5] focus:outline-none focus:ring-2 focus:ring-[#003DA5]/15',
          'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
          'read-only:bg-slate-50 read-only:text-slate-600',
          error && 'border-[#E31C23] focus:ring-[#E31C23]/15',
          className,
        )}
        {...props}
      />
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs font-medium text-[#E31C23]">{error}</p>
      )}
    </div>
  )
}
