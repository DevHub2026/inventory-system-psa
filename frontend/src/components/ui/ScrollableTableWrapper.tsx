import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
      setCanScrollLeft(cur.scrollLeft > 5)
      setCanScrollRight(cur.scrollWidth - cur.clientWidth - cur.scrollLeft > 5)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el!)
    el!.addEventListener('scroll', update, { passive: true })

    return () => {
      ro.disconnect()
      el!.removeEventListener('scroll', update)
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

  function scrollBy(amount: number) {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <div style={{ position: 'relative' }}>
      {canScrollLeft && (
        <button
          aria-label="Scroll table left"
          onClick={() => scrollBy(-240)}
          style={{
            position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
            zIndex: 30, border: '1px solid rgba(14, 165, 233, 0.12)', background: '#fff',
            borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(2,6,23,0.06)'
          }}
        >
          <ChevronLeft size={18} style={{ color: '#0B3D91' }} />
        </button>
      )}

      {canScrollRight && (
        <button
          aria-label="Scroll table right"
          onClick={() => scrollBy(240)}
          style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            zIndex: 30, border: '1px solid rgba(14, 165, 233, 0.12)', background: '#fff',
            borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(2,6,23,0.06)'
          }}
        >
          <ChevronRight size={18} style={{ color: '#0B3D91' }} />
        </button>
      )}

      <div ref={ref} style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {children}
      </div>
    </div>
  )
}
