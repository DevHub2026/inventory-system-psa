import { Search } from 'lucide-react'
import { useRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch?: (value: string) => void
}

/**
 * SearchBar — fully inline-styled so global CSS cascade rules
 * (p{}, input{}, *{transform}, etc.) cannot interfere with:
 *   - icon position
 *   - input text colour
 *   - placeholder colour
 *   - padding / height
 *
 * The icon is rendered as a flex sibling (not absolute positioned)
 * so it can never overlap the input text regardless of transforms.
 */
export function SearchBar({ onSearch, onChange, style, ...props }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
        height: 40,
        borderRadius: 10,
        border: '1.5px solid #e2e8f0',
        background: '#f8fafc',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        boxSizing: 'border-box',
        ...style,
      }}
      onFocusCapture={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = '#0B3D91'
        el.style.background  = '#ffffff'
        el.style.boxShadow   = '0 0 0 3px rgba(11,61,145,0.10)'
      }}
      onBlurCapture={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = '#e2e8f0'
        el.style.background  = '#f8fafc'
        el.style.boxShadow   = '0 1px 2px rgba(0,0,0,0.04)'
      }}
    >
      {/* Search icon — flex sibling, never overlaps text */}
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: 36,
          color: '#94a3b8',
          pointerEvents: 'none',
        }}
      >
        <Search size={15} strokeWidth={2} />
      </span>

      {/* Input */}
      <input
        ref={inputRef}
        type="search"
        style={{
          flex: 1,
          height: '100%',
          border: 'none',
          background: 'transparent',
          outline: 'none',
          padding: '0 12px 0 0',
          fontSize: 13,
          fontWeight: 400,
          color: '#1e293b',
          lineHeight: 1,
          /* Remove browser default search-cancel button */
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
        onChange={(e) => {
          onChange?.(e)
          onSearch?.(e.target.value)
        }}
        {...props}
      />
    </div>
  )
}
