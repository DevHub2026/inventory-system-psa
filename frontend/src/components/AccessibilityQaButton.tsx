import { useState, useRef } from 'react'
import HelpAccessibilityHub from './HelpAccessibilityHub'

export function AccessibilityQaButton() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const handleClose = () => {
    setOpen(false)
    // return focus to the floating button
    try {
      if (btnRef.current) btnRef.current.focus()
      else {
        const b = document.querySelector('[data-psa-help-button]') as HTMLButtonElement | null
        if (b) b.focus()
      }
    } catch (e) { console.warn('Help hub close focus return failed', e) }
  }

  return (
    <>
      <div style={{ position: 'fixed', left: 18, bottom: 18, zIndex: 60 }}>
        <button
          data-psa-help-button
          ref={btnRef}
          onClick={() => setOpen(true)}
          aria-label="Open Help and Accessibility"
          title="Help & Accessibility"
          style={{
            width: 52, height: 52, borderRadius: 999, border: 'none', background: '#047857', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(4,120,87,0.18)', cursor: 'pointer',
            fontWeight: 700, fontFamily: 'inherit', fontSize: 14,
          }}
        >
          A11Y
        </button>
      </div>

      <HelpAccessibilityHub open={open} onClose={handleClose} />
    </>
  )
}

export default AccessibilityQaButton
