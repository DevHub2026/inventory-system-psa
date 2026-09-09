import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'
export type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** When true, shows a spinner and disables the button */
  loading?: boolean
  /** When true, renders as a square icon-only button (no label padding) */
  iconOnly?: boolean
  children: ReactNode
}

const VARIANTS: Record<Variant, {
  background: string
  color: string
  border: string
  hoverBackground: string
  hoverBorder: string
  hoverColor: string
}> = {
  primary: {
    background:      '#003DA5',   /* canonical PSA primary */
    color:           '#ffffff',
    border:          '1px solid #003DA5',
    hoverBackground: '#1565C0',   /* canonical primary-hover */
    hoverBorder:     '1px solid #1565C0',
    hoverColor:      '#ffffff',
  },
  secondary: {
    background:      '#ffffff',
    color:           '#1e293b',
    border:          '1px solid #e2e8f0',
    hoverBackground: '#f1f5f9',
    hoverBorder:     '1px solid #cbd5e1',
    hoverColor:      '#0f172a',
  },
  outline: {
    background:      'transparent',
    color:           '#003DA5',
    border:          '1px solid rgba(0,61,165,0.35)',
    hoverBackground: '#eef4ff',
    hoverBorder:     '1px solid rgba(0,61,165,0.65)',
    hoverColor:      '#003DA5',
  },
  danger: {
    background:      '#D32F2F',   /* canonical danger */
    color:           '#ffffff',
    border:          '1px solid #D32F2F',
    hoverBackground: '#b71c1c',
    hoverBorder:     '1px solid #b71c1c',
    hoverColor:      '#ffffff',
  },
  success: {
    background:      '#2E7D32',
    color:           '#ffffff',
    border:          '1px solid #2E7D32',
    hoverBackground: '#1b5e20',
    hoverBorder:     '1px solid #1b5e20',
    hoverColor:      '#ffffff',
  },
  ghost: {
    background:      'transparent',
    color:           '#64748b',
    border:          '1px solid transparent',
    hoverBackground: '#f1f5f9',
    hoverBorder:     '1px solid transparent',
    hoverColor:      '#1e293b',
  },
}

const SIZES: Record<Size, { height: number; paddingInline: number; fontSize: number; gap: number }> = {
  sm: { height: 32, paddingInline: 12, fontSize: 12, gap: 6  },
  md: { height: 38, paddingInline: 16, fontSize: 14, gap: 8  },
  lg: { height: 42, paddingInline: 20, fontSize: 14, gap: 8  },
}

/* Square sizes for icon-only buttons */
const ICON_SIZES: Record<Size, { width: number; height: number; fontSize: number }> = {
  sm: { width: 32, height: 32, fontSize: 12 },
  md: { width: 38, height: 38, fontSize: 14 },
  lg: { width: 42, height: 42, fontSize: 14 },
}

/** Inline SVG spinner — immune to global CSS cascade */
function ButtonSpinner({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        animation: 'btn-spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    >
      <style>{`@keyframes btn-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Button({
  variant = 'primary',
  size    = 'md',
  loading = false,
  iconOnly = false,
  style,
  children,
  type = 'button',
  disabled,
  className,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const v = VARIANTS[variant]
  const s = SIZES[size]
  const sq = ICON_SIZES[size]

  const isDisabled = disabled || loading

  const baseStyle: React.CSSProperties = iconOnly
    ? {
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          sq.width,
        height:         sq.height,
        padding:        0,
        fontSize:       sq.fontSize,
        fontWeight:     600,
        lineHeight:     1,
        borderRadius:   10,
        cursor:         isDisabled ? 'not-allowed' : 'pointer',
        opacity:        isDisabled ? 0.5 : 1,
        background:     v.background,
        color:          v.color,
        border:         v.border,
        boxShadow:      variant === 'primary' || variant === 'danger' || variant === 'success'
                          ? '0 1px 3px rgba(0,0,0,0.12)'
                          : 'none',
        transition:     'background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s, transform 0.1s',
        userSelect:     'none',
        boxSizing:      'border-box',
        fontFamily:     'inherit',
        flexShrink:     0,
        ...style,
      }
    : {
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            s.gap,
        height:         s.height,
        paddingInline:  s.paddingInline,
        fontSize:       s.fontSize,
        fontWeight:     600,
        lineHeight:     1,
        whiteSpace:     'nowrap',
        borderRadius:   10,
        cursor:         isDisabled ? 'not-allowed' : 'pointer',
        opacity:        isDisabled ? 0.5 : 1,
        background:     v.background,
        color:          v.color,
        border:         v.border,
        boxShadow:      variant === 'primary' || variant === 'danger' || variant === 'success'
                          ? '0 1px 3px rgba(0,0,0,0.12)'
                          : 'none',
        transition:     'background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s, transform 0.1s',
        userSelect:     'none',
        boxSizing:      'border-box',
        fontFamily:     'inherit',
        ...style,
      }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) {
      const btn = e.currentTarget
      btn.style.background = v.hoverBackground
      btn.style.border     = v.hoverBorder
      btn.style.color      = v.hoverColor
    }
    onMouseEnter?.(e)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) {
      const btn = e.currentTarget
      btn.style.background = v.background
      btn.style.border     = v.border
      btn.style.color      = v.color
    }
    onMouseLeave?.(e)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) e.currentTarget.style.transform = 'scale(0.97)'
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) e.currentTarget.style.transform = 'scale(1)'
  }

  /* Spinner color: white on solid variants, brand blue on ghost/outline/secondary */
  const spinnerColor = variant === 'primary' || variant === 'danger' || variant === 'success'
    ? '#ffffff'
    : '#003DA5'

  return (
    <button
      type={type}
      disabled={isDisabled}
      style={baseStyle}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <ButtonSpinner color={spinnerColor} />}
      {children}
    </button>
  )
}
