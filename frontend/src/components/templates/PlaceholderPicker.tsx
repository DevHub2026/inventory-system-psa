import { useState } from 'react'
import { Tag, Search } from 'lucide-react'
import { SUPPORTED_PLACEHOLDERS, type PlaceholderGroup } from './placeholderData'

interface PlaceholderPickerProps {
  onInsert: (token: string) => void
}

function PlaceholderToken({ item, onInsert }: { item: PlaceholderGroup['items'][0]; onInsert: (t: string) => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button type="button" onClick={() => onInsert(item.token)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        textAlign: 'left', padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${hov ? '#BFDBFE' : '#E2E8F0'}`,
        background: hov ? '#EFF6FF' : '#fff',
        transition: 'all 0.12s', fontFamily: 'inherit',
      }}>
      <div>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, fontWeight: 700, color: '#1E40AF' }}>
          {item.token}
        </div>
        <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>{item.label}</div>
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        background: hov ? '#DBEAFE' : '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.12s',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={hov ? '#1E40AF' : '#94A3B8'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>
    </button>
  )
}

export function PlaceholderPicker({ onInsert }: PlaceholderPickerProps) {
  const [search, setSearch] = useState('')

  const filteredGroups = SUPPORTED_PLACEHOLDERS.map((g) => ({
    ...g,
    items: g.items.filter((item) =>
      item.token.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0)

  return (
    <div style={{ borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Tag size={13} color="#1E40AF"/>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Insert Placeholders
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>Click any token to insert into template body</span>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}/>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search placeholders (e.g. employee, asset code)..."
          style={{
            width: '100%', height: 34, borderRadius: 8, border: '1px solid #E2E8F0',
            background: '#fff', paddingLeft: 32, paddingRight: 12,
            fontSize: 12.5, color: '#1E293B', outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#1E40AF' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = '#E2E8F0' }}
        />
      </div>

      {/* Token groups */}
      <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 2 }}>
        {filteredGroups.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: 12.5, color: '#94A3B8', padding: '8px 0' }}>
            No matching placeholders found.
          </p>
        ) : filteredGroups.map((group) => (
          <div key={group.category}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 7 }}>
              {group.category}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {group.items.map((item) => (
                <PlaceholderToken key={item.token} item={item} onInsert={onInsert}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
