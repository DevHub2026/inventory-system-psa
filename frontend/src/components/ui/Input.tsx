import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Input({ label, error, helperText, className, id, style, ...props }: InputProps) {
  const inputId = id ?? props.name

  return (
    <div className="w-full">
      {/* Label */}
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
          'block w-full text-[14px] text-[#1e293b]',
          'placeholder:text-[#94a3b8]',
          'transition-colors duration-150',
          'disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#94a3b8]',
          error ? 'border-[#C62828] focus:border-[#C62828]' : 'border-[#CBD5E1] focus:border-[#0B3D91]',
          className,
        )}
        style={{
          height: 42,
          paddingLeft: 14,
          paddingRight: 14,
          borderRadius: 10,
          border: error ? '1.5px solid #DC2626' : '1px solid #CBD5E1',
          background: '#FFFFFF',
          outline: 'none',
          boxSizing: 'border-box',
          fontSize: 13.5,
          color: '#0F172A',
          width: '100%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          ...style,
        }}
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
