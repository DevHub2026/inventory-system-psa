import { useState } from 'react'
import AccessibilityQaPanel from './AccessibilityQaPanel'

export function AccessibilityQaButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div style={{ position: 'fixed', left: 18, bottom: 18, zIndex: 60 }}>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open accessibility QA"
          title="Accessibility QA"
          style={{
            width: 52, height: 52, borderRadius: 999, border: 'none', background: '#047857', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(4,120,87,0.18)', cursor: 'pointer',
            fontWeight: 700, fontFamily: 'inherit', fontSize: 14,
          }}
        >
          A11Y
        </button>
      </div>

      <AccessibilityQaPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default AccessibilityQaButton
