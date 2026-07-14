import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch?: (value: string) => void
}

export function SearchBar({ className, onSearch, onChange, ...props }: SearchBarProps) {
  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        className="w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-brand-500"
        onChange={(event) => {
          onChange?.(event)
          onSearch?.(event.target.value)
        }}
        {...props}
      />
    </div>
  )
}
