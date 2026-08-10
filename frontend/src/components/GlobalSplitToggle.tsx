import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AccessibilityQaPanel from '@/components/AccessibilityQaPanel'

const pages = [
  { key: 'borrowings', label: 'Borrowings' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'assets', label: 'Assets' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'scanner', label: 'QR Scanner' },
]

export function GlobalSplitToggle() {
  const [open, setOpen] = useState(false)
  const [a11yOpen, setA11yOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const openAsRight = (key: string) => {
    setOpen(false)
    if (key === 'scanner') {
      // Open the standalone scanner page rather than splitting the layout
      navigate('/qr')
      return
    }
    const sp = new URLSearchParams(location.search)
    sp.set('splitRight', key)
    navigate({ pathname: location.pathname, search: `?${sp.toString()}` })
  }

  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 60 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        {open && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 6, alignItems: 'flex-end' }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>Open as right pane:</div>
            {pages.map((p) => (
              <button key={p.key} onClick={() => openAsRight(p.key)} style={menuBtnStyle}>{p.label}</button>
            ))}
            <div style={{ height: 1, background: '#F1F5F9', margin: '6px 0' }} />
            <button onClick={() => { setOpen(false); setA11yOpen(true) }} style={menuBtnStyle}>Accessibility QA</button>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Open split selector"
          style={{
            width: 52, height: 52, borderRadius: 999, border: 'none', background: '#0B3D91', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(11,61,145,0.18)', cursor: 'pointer',
            fontWeight: 700, fontFamily: 'inherit', fontSize: 14,
          }}
        >
          ≡
        </button>

        <AccessibilityQaPanel open={a11yOpen} onClose={() => setA11yOpen(false)} />
      </div>
    </div>
  )
}

const menuBtnStyle: React.CSSProperties = {
  height: 36,
  paddingInline: 12,
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  background: '#fff',
  color: '#0F172A',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
}

export default GlobalSplitToggle
