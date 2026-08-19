import React, { useEffect, useRef, useState } from 'react'

export default function ScrollableTableWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, dragging: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function update() {
      const cur = ref.current
      if (!cur) return
      const atLeft = cur.scrollLeft <= 5
      const atRight = cur.scrollWidth - cur.clientWidth - cur.scrollLeft <= 5
      setCanScrollLeft(!atLeft)
      setCanScrollRight(!atRight)
    }

    update()

    const ro = new ResizeObserver(update)
    ro.observe(el)
    // also observe the content in case table width changes
    if (el.firstElementChild instanceof Element) ro.observe(el.firstElementChild)

    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    // MutationObserver to detect DOM changes that may affect width (columns added/removed)
    const mo = new MutationObserver(() => update())
    mo.observe(el, { childList: true, subtree: true, attributes: true })

    return () => {
      ro.disconnect()
      mo.disconnect()
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onPointerDown = (e: PointerEvent) => {
      dragRef.current.active = true
      dragRef.current.startX = e.clientX
      dragRef.current.startY = e.clientY
      dragRef.current.dragging = false
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return
      const dx = Math.abs(e.clientX - dragRef.current.startX)
      const dy = Math.abs(e.clientY - dragRef.current.startY)
      if (dx > 6 && dx > dy) {
        dragRef.current.dragging = true
      }
    }
    const onPointerUp = () => {
      dragRef.current.active = false
      // clear dragging shortly after pointer up to allow click prevention
      setTimeout(() => { dragRef.current.dragging = false }, 50)
    }

    el.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)

    // Click capture: prevent accidental click after dragging
    const onClickCapture = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return
      const target = e.target as HTMLElement
      // allow clicks on actionable controls (buttons, anchors, inputs)
      if (target.closest('button, a, input, [role="button"], select, textarea')) return
      // otherwise suppress
      e.stopPropagation()
      e.preventDefault()
    }
    el.addEventListener('click', onClickCapture, true)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('click', onClickCapture, true)
    }
  }, [])

  function scrollByAmount(direction: 'left' | 'right') {
    const el = ref.current
    if (!el) return
    const visible = el.clientWidth
    // adaptive amount: 70% of visible width
    const amount = Math.max(100, Math.round(visible * 0.7))
    const delta = direction === 'right' ? amount : -amount
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Left control — only render if there is overflow */}
      {(canScrollLeft || canScrollRight) && (
        <>
          <button
            aria-label="Scroll table left"
            onClick={() => scrollByAmount('left')}
            disabled={!canScrollLeft}
            style={{
              position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
              zIndex: 30, border: '1px solid rgba(14, 165, 233, 0.12)', background: '#fff',
              borderRadius: 8, width: 36, height: 36, display: canScrollLeft ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', cursor: canScrollLeft ? 'pointer' : 'default', boxShadow: '0 1px 4px rgba(2,6,23,0.06)', opacity: canScrollLeft ? 1 : 0.48
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0B3D91' }}>&lt;</span>
          </button>

          <button
            aria-label="Scroll table right"
            onClick={() => scrollByAmount('right')}
            disabled={!canScrollRight}
            style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              zIndex: 30, border: '1px solid rgba(14, 165, 233, 0.12)', background: '#fff',
              borderRadius: 8, width: 36, height: 36, display: canScrollRight ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', cursor: canScrollRight ? 'pointer' : 'default', boxShadow: '0 1px 4px rgba(2,6,23,0.06)', opacity: canScrollRight ? 1 : 0.48
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0B3D91' }}>&gt;</span>
          </button>

          {/* edge fades */}
          <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 28, pointerEvents: 'none', display: canScrollLeft ? 'block' : 'none', background: 'linear-gradient(90deg, rgba(15,23,42,0.06), rgba(15,23,42,0))', zIndex: 20 }} />
          <div aria-hidden style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 28, pointerEvents: 'none', display: canScrollRight ? 'block' : 'none', background: 'linear-gradient(270deg, rgba(15,23,42,0.06), rgba(15,23,42,0))', zIndex: 20 }} />
        </>
      )}

      <div ref={ref} style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {children}
      </div>
    </div>
  )
}
