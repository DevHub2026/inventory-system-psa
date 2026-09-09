import type { ChangeEvent, ReactNode } from 'react'

interface InputProps {
  id?: string
  name?: string
  type?: string
  placeholder: string
  icon?: ReactNode
  rightIcon?: ReactNode
  value?: string
  autoComplete?: string
  disabled?: boolean
  required?: boolean
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onRightIconClick?: () => void
}

export default function Input({
  id, name, type = 'text', placeholder, icon, rightIcon,
  value, autoComplete, disabled = false, required = false,
  onChange, onRightIconClick,
}: InputProps) {
  return (
    <div className="relative flex items-center w-full">
      {icon && (
        <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-400 pointer-events-none" aria-hidden="true">
          {icon}
        </div>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        onChange={onChange}
        className={`w-full h-[52px] bg-white border border-slate-300 rounded-[10px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 transition-colors shadow-sm disabled:bg-slate-100 disabled:text-slate-500 text-[15px] ${icon ? 'pl-12' : 'pl-4'} ${rightIcon ? 'pr-12' : 'pr-4'}`}
      />
      {rightIcon && (
        <button
          type="button"
          aria-label={type === 'password' ? 'Show password' : 'Hide password'}
          onClick={onRightIconClick}
          className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none focus:text-brand-600 transition-colors"
        >
          {rightIcon}
        </button>
      )}
    </div>
  )
}
