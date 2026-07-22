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

export function Dropdown({ label, options, placeholder, className, id, ...props }: DropdownProps) {
  const selectId = id ?? props.name

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-[13px] font-medium text-[#1F2937]"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          // layout
          'block w-full h-[42px] px-3.5',
          // shape
          'rounded-[10px] border border-[#E5E7EB]',
          // surface
          'bg-white text-[14px] text-[#1F2937]',
          // shadow
          'shadow-[0_1px_2px_rgba(0,0,0,.05)]',
          // focus
          'transition-colors duration-200',
          'focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15',
          // disabled
          'disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
