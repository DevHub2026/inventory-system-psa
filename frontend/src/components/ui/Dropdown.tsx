import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  label: string
  value: string
}

interface DropdownProps {
  label?: string
  options: Option[]
  placeholder?: string
  value?: string
  disabled?: boolean
  id?: string
  name?: string
  onChange?: (e: { target: { value: string; name?: string } }) => void
  className?: string
  style?: CSSProperties
}

/**
 * Custom Dropdown — fully styled, no native <select> appearance.
 * Fires an onChange event shaped like a native select event so existing
 * code (e.target.value) works without changes.
 */
export function Dropdown({
  label,
  options,
  placeholder,
  value,
  disabled,
  id,
  name,
  onChange,
  style,
}: DropdownProps) {
  const [open, setOpen]         = useState(false)
  const [focused, setFocused]   = useState(false)
  const containerRef            = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const displayLabel = selected?.label ?? placeholder ?? 'Select…'
  const hasValue = Boolean(selected)

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  /* Keyboard navigation */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v) }
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault()
      const idx = options.findIndex((o) => o.value === value)
      const next = options[idx + 1]
      if (next) onChange?.({ target: { value: next.value, name } })
    }
    if (e.key === 'ArrowUp' && open) {
      e.preventDefault()
      const idx = options.findIndex((o) => o.value === value)
      const prev = options[idx - 1]
      if (prev) onChange?.({ target: { value: prev.value, name } })
    }
  }

  const selectOption = (opt: Option) => {
    onChange?.({ target: { value: opt.value, name } })
    setOpen(false)
  }

  return (
    <div style={{ width: '100%', ...style }}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
            lineHeight: 1.4,
          }}
        >
          {label}
        </label>
      )}

      {/* Trigger */}
      <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          onClick={() => { if (!disabled) setOpen((v) => !v) }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            width: '100%',
            height: 40,
            paddingInline: 14,
            borderRadius: 10,
            border: focused || open
              ? '1.5px solid #0B3D91'
              : '1.5px solid #e2e8f0',
            background: disabled ? '#f8fafc' : '#ffffff',
            boxShadow: focused || open
              ? '0 0 0 3px rgba(11,61,145,0.10)'
              : '0 1px 2px rgba(0,0,0,0.04)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        >
          {/* Selected label */}
          <span style={{
            fontSize: 14,
            fontWeight: hasValue ? 500 : 400,
            color: hasValue ? '#1e293b' : '#94a3b8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            textAlign: 'left',
          }}>
            {displayLabel}
          </span>

          {/* Chevron */}
          <ChevronDown
            size={15}
            style={{
              flexShrink: 0,
              color: '#64748b',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {/* Dropdown menu */}
        {open && (
          <div
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 70,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              boxShadow:
                '0 4px 6px -1px rgba(0,0,0,0.08),' +
                '0 10px 24px -4px rgba(0,0,0,0.12),' +
                '0 0 0 1px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              padding: '4px',
              boxSizing: 'border-box',
            }}
          >
            {/* Placeholder option */}
            {placeholder && (
              <div
                role="option"
                aria-selected={!hasValue}
                onClick={() => { onChange?.({ target: { value: '', name } }); setOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#94a3b8',
                  fontStyle: 'italic',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f8fafc' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                {placeholder}
              </div>
            )}

            {/* Options */}
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(opt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '9px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#0B3D91' : '#1e293b',
                    background: isSelected ? '#eff6ff' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check size={14} style={{ flexShrink: 0, color: '#0B3D91' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
