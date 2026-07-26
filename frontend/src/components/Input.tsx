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
    <div className="auth-input-wrapper">
      {icon && (
        <span className="auth-input-icon auth-input-icon--left" aria-hidden="true">
          {icon}
        </span>
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
        className="auth-input"
      />
      {rightIcon && (
        <button
          type="button"
          aria-label={type === 'password' ? 'Show password' : 'Hide password'}
          onClick={onRightIconClick}
          className="auth-input-icon auth-input-icon--right"
        >
          {rightIcon}
        </button>
      )}
    </div>
  )
}
