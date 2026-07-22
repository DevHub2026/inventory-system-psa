import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type AlertTone = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  tone?: AlertTone
  title?: string
  children: ReactNode
  onClose?: () => void
  className?: string
}

const config: Record<AlertTone, { wrap: string; icon: ReactNode }> = {
  info:    {
    wrap: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]',
    icon: <Info className="h-4 w-4 shrink-0 text-[#2563EB]" />,
  },
  success: {
    wrap: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]',
    icon: <CheckCircle className="h-4 w-4 shrink-0 text-[#16A34A]" />,
  },
  warning: {
    wrap: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]',
    icon: <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706]" />,
  },
  error:   {
    wrap: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]',
    icon: <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626]" />,
  },
}

export function Alert({ tone = 'info', title, children, onClose, className }: AlertProps) {
  const { wrap, icon } = config[tone]

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm',
        'shadow-[0_1px_3px_rgba(0,0,0,.06)]',
        wrap,
        className,
      )}
    >
      {/* Icon */}
      <span className="mt-0.5">{icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <p className="mb-0.5 font-semibold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>

      {/* Close */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="mt-0.5 shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
