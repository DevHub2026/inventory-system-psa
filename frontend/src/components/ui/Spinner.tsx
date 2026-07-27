import { cn } from '@/utils/cn'

interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Loading...' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'flex items-center justify-center gap-2.5 py-10 text-[14px] text-[#6B7280]',
        className,
      )}
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#0D47A1]"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  )
}
