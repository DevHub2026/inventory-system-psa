import { cn } from '@/utils/cn'

interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Loading...' }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-8 text-sm text-gray-500', className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
      {label}
    </div>
  )
}
