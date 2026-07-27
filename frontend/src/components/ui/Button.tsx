import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'
export type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

/* All colours as plain objects — immune to the global CSS cascade */
const VARIANTS: Record<Variant, {
  background: string
  color: string
  border: string
  hoverBackground: string
  hoverBorder: string
  hoverColor: string
}> = {
  primary: {
    background:   '#0B3D91',
    color:        '#ffffff',
    border:       '1px solid #0B3D91',
    hoverBackground: '#1565C0',
    hoverBorder:  '1px solid #1565C0',
    hoverColor:   '#ffffff',
  },
  secondary: {
    background:   '#ffffff',
    color:        '#1e293b',
    border:       '1px solid #e2e8f0',
    hoverBackground: '#f1f5f9',
    hoverBorder:  '1px solid #cbd5e1',
    hoverColor:   '#0f172a',
  },
  outline: {
    background:   'transparent',
    color:        '#0B3D91',
    border:       '1px solid rgba(11,61,145,0.35)',
    hoverBackground: '#eef4ff',
    hoverBorder:  '1px solid rgba(11,61,145,0.65)',
    hoverColor:   '#0B3D91',
  },
  danger: {
    background:   '#C62828',
    color:        '#ffffff',
    border:       '1px solid #C62828',
    hoverBackground: '#b71c1c',
    hoverBorder:  '1px solid #b71c1c',
    hoverColor:   '#ffffff',
  },
  success: {
    background:   '#2E7D32',
    color:        '#ffffff',
    border:       '1px solid #2E7D32',
    hoverBackground: '#1b5e20',
    hoverBorder:  '1px solid #1b5e20',
    hoverColor:   '#ffffff',
  },
  ghost: {
    background:   'transparent',
    color:        '#64748b',
    border:       '1px solid transparent',
    hoverBackground: '#f1f5f9',
    hoverBorder:  '1px solid transparent',
    hoverColor:   '#1e293b',
  },
}

const SIZES: Record<Size, { height: number; paddingInline: number; fontSize: number; gap: number }> = {
  sm: { height: 32, paddingInline: 12, fontSize: 12, gap: 6  },
  md: { height: 38, paddingInline: 16, fontSize: 14, gap: 8  },
  lg: { height: 42, paddingInline: 20, fontSize: 14, gap: 8  },
}

export function Button({
  variant = 'primary',
  size    = 'md',
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

  const baseStyle: React.CSSProperties = {
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
    cursor:         disabled ? 'not-allowed' : 'pointer',
    opacity:        disabled ? 0.5 : 1,
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
    if (!disabled) {
      const btn = e.currentTarget
      btn.style.background = v.hoverBackground
      btn.style.border     = v.hoverBorder
      btn.style.color      = v.hoverColor
    }
    onMouseEnter?.(e)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const btn = e.currentTarget
      btn.style.background = v.background
      btn.style.border     = v.border
      btn.style.color      = v.color
    }
    onMouseLeave?.(e)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) e.currentTarget.style.transform = 'scale(1)'
  }

  return (
    <button
      type={type}
      disabled={disabled}
      style={baseStyle}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {children}
    </button>
  )
}
