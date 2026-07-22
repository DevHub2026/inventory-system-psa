import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch?: (value: string) => void
}

export function SearchBar({ className, onSearch, onChange, ...props }: SearchBarProps) {
  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      {/* Icon */}
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />

      <input
        type="search"
        className={cn(
          // layout
          'block w-full h-[42px] pl-10 pr-4',
          // shape
          'rounded-[12px] border border-[#E5E7EB]',
          // surface
          'bg-white text-[14px] text-[#1F2937]',
          'placeholder:text-[#9CA3AF]',
          // shadow
          'shadow-[0_1px_2px_rgba(0,0,0,.05)]',
          // focus
          'transition-colors duration-200',
          'focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15',
        )}
        onChange={(e) => {
          onChange?.(e)
          onSearch?.(e.target.value)
        }}
        {...props}
      />
    </div>
  )
}
