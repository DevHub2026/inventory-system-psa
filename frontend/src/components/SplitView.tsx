import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui'

interface SplitViewProps {
  children: React.ReactNode // left/main pane
  rightSide?: React.ReactNode | null
  rightOpen?: boolean
  /** Pixel width of the right pane on desktop */
  rightWidth?: number
  /** Minimum width (px) to consider "desktop" and show side-by-side. Default 768 */
  minDesktopWidth?: number
  /** When true, the mobile modal will use maxWidth: '100%' so it fills the screen */
  mobileModalFullWidth?: boolean
  onCloseRight?: () => void
}

export function SplitView({ children, rightSide = null, rightOpen = false, rightWidth = 820, minDesktopWidth = 768, mobileModalFullWidth = true, onCloseRight, rightKey }: SplitViewProps & { rightKey?: string }) {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= minDesktopWidth : true)
  const [currentRightWidth, setCurrentRightWidth] = useState(rightWidth)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minDesktopWidth}px)`)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [minDesktopWidth])

  useEffect(() => {
    // Load saved width from localStorage if present (keyed by rightKey)
    try {
      const key = rightKey ? `split_right_width:${rightKey}` : 'split_right_width'
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = Number(raw)
        if (!Number.isNaN(parsed) && parsed > 0) setCurrentRightWidth(parsed)
        else setCurrentRightWidth(rightWidth)
      } else {
        setCurrentRightWidth(rightWidth)
      }
    } catch {
      setCurrentRightWidth(rightWidth)
    }
  }, [rightWidth, rightKey])

  useEffect(() => {
    if (!isDesktop) return
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      const winW = window.innerWidth
      const mouseX = e.clientX
      // new width is distance from mouse to right edge
      const newWidth = Math.max(320, Math.min(winW - mouseX, winW - 320))
      setCurrentRightWidth(newWidth)
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, isDesktop])

  // Persist width when it changes
  useEffect(() => {
    try {
      const key = rightKey ? `split_right_width:${rightKey}` : 'split_right_width'
      localStorage.setItem(key, String(currentRightWidth))
    } catch { /* ignore */ }
  }, [currentRightWidth, rightKey])


  // Desktop: two-column layout when rightOpen
  if (isDesktop) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        {rightOpen && rightSide && (
          <>
            <div
              onMouseDown={() => setDragging(true)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  const step = 20
                  const winW = window.innerWidth
                  const maxW = Math.max(320, winW - 320)
                  let next = currentRightWidth + (e.key === 'ArrowLeft' ? step : -step)
                  // ArrowLeft should increase left area (decrease right width) — but invert to make UX consistent with caret
                  if (e.key === 'ArrowLeft') next = Math.max(320, Math.min(maxW, currentRightWidth - step))
                  if (e.key === 'ArrowRight') next = Math.max(320, Math.min(maxW, currentRightWidth + step))
                  setCurrentRightWidth(next)
                }
                if (e.key === 'Home') { setCurrentRightWidth(Math.max(320, Math.floor(window.innerWidth * 0.25))) }
                if (e.key === 'End') { setCurrentRightWidth(Math.max(320, Math.floor(window.innerWidth * 0.5))) }
              }}
              role="separator"
              aria-orientation="vertical"
              tabIndex={0}
              aria-label="Resize split panel"
              style={{ width: 12, cursor: 'col-resize', background: 'transparent', zIndex: 80, outline: 'none' }}
            />
            <div style={{ width: currentRightWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, borderLeft: '1px solid #E6EEF8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#FAFBFC' }}>
                <div style={{ fontWeight: 700, color: '#0F172A' }}>{rightKey ? String(rightKey).replace(/^[a-z]/, (s) => s.toUpperCase()) : 'Detail'}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button title="Pop out" onClick={() => { try { const url = `${window.location.origin}/${rightKey ?? ''}`; window.open(url, '_blank') } catch { } }} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>⤢</button>
                  <button title="Close split" onClick={() => onCloseRight && onCloseRight()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
              </div>
              <div style={{ height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>{rightSide}</div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Mobile: render left only, show right in Modal when open
  return (
    <>
      <div>{children}</div>
      {rightOpen && rightSide && (
      <Modal open={true} title={''} onClose={onCloseRight ?? (() => {})} maxWidth={mobileModalFullWidth ? '100%' : rightWidth} footer={null}>
          {rightSide}
        </Modal>
      )}
    </>
  )
}

export default SplitView
