import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import HelpAccessibilityHub from './HelpAccessibilityHub'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roleHelpers'

const pages = [
  { key: 'borrowings', label: 'Borrowings' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'assets', label: 'Assets' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'scanner', label: 'QR Scanner' },
]

export default function GlobalQuickAccess() {
  const [open, setOpen] = useState(false)
  const [showSplitList, setShowSplitList] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const canViewDocumentation = Boolean(user && (isAdmin(user) || user.roles?.some((role) => role.name === 'System Administrator' || role.name === 'Super Administrator')))

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setShowSplitList(false)
      }
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    // click outside to close
    function onDoc(e: MouseEvent) {
      const target = e.target as Node | null
      if (!open) return
      if (panelRef.current && !panelRef.current.contains(target) && btnRef.current && !btnRef.current.contains(target)) {
        setOpen(false)
        setShowSplitList(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const openAsRight = (key: string) => {
    setOpen(false)
    setShowSplitList(false)
    if (key === 'scanner') {
      navigate('/qr')
      return
    }
    const sp = new URLSearchParams(location.search)
    sp.set('splitRight', key)
    navigate({ pathname: location.pathname, search: `?${sp.toString()}` })
  }

  const handleHelpClose = () => {
    setHelpOpen(false)
      try { if (btnRef.current) btnRef.current.focus() } catch (e) { console.warn('QuickAccess focus return failed', e) }
  }

  return (
    <>
      <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 70 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {open && (
            <div ref={panelRef} role="dialog" aria-label="Quick Access" style={{ width: 280, padding: 12, borderRadius: 12, background: '#fff', boxShadow: '0 12px 36px rgba(2,6,23,0.12)', border: '1px solid #E6EDF4', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>Quick Access</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => { setShowSplitList((s) => !s) }} aria-expanded={showSplitList} aria-controls="qa-split-list" style={smallActionStyle}>{showSplitList ? 'Hide Split' : 'Split Screen'}</button>
                  <button onClick={() => { setHelpOpen(true); setOpen(false) }} style={smallActionStyle}>Help</button>
                  {canViewDocumentation && (
                    <button onClick={() => { setOpen(false); navigate('/documentation') }} style={smallActionStyle}>Documentation</button>
                  )}
                </div>
              </div>

              {showSplitList && (
                <div id="qa-split-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Open as right pane:</div>
                  {pages.map((p) => (
                    <button key={p.key} onClick={() => openAsRight(p.key)} style={menuBtnStyle}>{p.label}</button>
                  ))}
                </div>
              )}

              <div style={{ height: 1, background: '#F1F5F9', margin: '8px 0' }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setOpen(false); setShowSplitList(false) }} style={{ ...menuBtnStyle, background: '#fff' }}>Close</button>
              </div>
            </div>
          )}

          <button
            ref={btnRef}
            onClick={() => setOpen((v) => !v)}
            aria-label="Open Quick Access"
            title="Quick Access"
            style={{
              width: 52, height: 52, borderRadius: 999, border: 'none', background: '#0B3D91', color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(11,61,145,0.18)', cursor: 'pointer',
              fontWeight: 700, fontFamily: 'inherit', fontSize: 14,
            }}
          >
            ▤
          </button>
        </div>
      </div>

      <HelpAccessibilityHub open={helpOpen} onClose={handleHelpClose} />
    </>
  )
}

const smallActionStyle: React.CSSProperties = {
  padding: '6px 8px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13
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
