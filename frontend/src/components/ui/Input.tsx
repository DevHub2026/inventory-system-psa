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
      {/* Label — inline style beats any global p/label colour rule */}
      {label && (
        <label
          htmlFor={inputId}
          style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#334155', lineHeight: 1.4 }}
        >
          {label}
        </label>
      )}

      {/* Input field */}
      <input
        id={inputId}
        className={cn(
          'block w-full h-11 px-3.5',
          'rounded-[10px] border border-[#E2E8F0]',
          'bg-white text-[14px] text-[#1e293b]',
          'placeholder:text-[#94a3b8]',
          'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
          'transition-colors duration-150',
          'focus:border-[#0B3D91] focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/15',
          'disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#94a3b8]',
          'read-only:bg-[#F8FAFC] read-only:text-[#64748b]',
          error && 'border-[#C62828] focus:ring-[#C62828]/15',
          className,
        )}
        {...props}
      />

      {/* Helper text */}
      {helperText && !error && (
        <div style={{ marginTop: 5, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
          {helperText}
        </div>
      )}

      {/* Error text */}
      {error && (
        <div style={{ marginTop: 5, fontSize: 12, fontWeight: 500, color: '#C62828', lineHeight: 1.5 }}>
          {error}
        </div>
      )}
    </div>
  )
}
