import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface Option {
  label: string
  value: string
}

interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
  placeholder?: string
}

export function Dropdown({
  label,
  options,
  placeholder,
  className,
  id,
  ...props
}: DropdownProps) {
  const selectId = id ?? props.name

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
