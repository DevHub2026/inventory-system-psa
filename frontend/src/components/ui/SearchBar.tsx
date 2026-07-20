import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch?: (value: string) => void
}

export function SearchBar({ className, onSearch, onChange, ...props }: SearchBarProps) {
  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-800 shadow-sm placeholder:text-slate-400"
        onChange={(event) => {
          onChange?.(event)
          onSearch?.(event.target.value)
        }}
        {...props}
      />
    </div>
  )
}
