import { useEffect, useState } from 'react'
import { Modal, Button, Spinner } from '@/components/ui'

interface Issue {
  id: string
  description: string
  selector: string
  element: Element | null
}

export function AccessibilityQaPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [scanning, setScanning] = useState(false)
  const [issues, setIssues] = useState<Issue[]>([])
  const [highlighted, setHighlighted] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let mounted = true

    const scan = async () => {
      setScanning(true)
      try {
        const found: Issue[] = []

        // 1. Images without alt
        Array.from(document.querySelectorAll('img')).forEach((img, idx) => {
          const alt = img.getAttribute('alt')
          if (alt === null || alt.trim() === '') {
            found.push({ id: `img-${idx}`, description: 'Image missing alt text', selector: getSelector(img), element: img })
          }
        })

        // 2. Buttons or interactive elements without accessible name
        Array.from(document.querySelectorAll('button, a, [role="button"], [role="link"]')).forEach((el, idx) => {
          const name = (el as HTMLElement).getAttribute('aria-label') || (el as HTMLElement).innerText || (el as HTMLButtonElement).value || ''
          if (!name || name.trim() === '') {
            found.push({ id: `btn-${idx}`, description: 'Interactive element without accessible name', selector: getSelector(el), element: el })
          }
        })

        // 3. Form inputs without label or aria-label
        Array.from(document.querySelectorAll('input, textarea, select')).forEach((el, idx) => {
          const id = (el as HTMLElement).id
          const hasLabel = id ? Boolean(document.querySelector(`label[for="${id}"]`)) : false
          const aria = (el as HTMLElement).getAttribute('aria-label')
          const placeholder = (el as HTMLInputElement).placeholder
          // ignore hidden or type=hidden
          if ((el as HTMLInputElement).getAttribute('type') === 'hidden') return
          if (!hasLabel && (!aria || aria.trim() === '') && (!placeholder || placeholder.trim() === '')) {
            found.push({ id: `input-${idx}`, description: 'Form control without label/aria-label', selector: getSelector(el), element: el })
          }
        })

        // 4. Landmark regions missing role or label (main/nav/header/footer aside semantics check)
        Array.from(document.querySelectorAll('main, nav, header, footer, aside, section')).forEach((el, idx) => {
          // check for aria-label or aria-labelledby for landmarks
          const role = el.getAttribute('role')
          const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
          if (!role && !aria) {
            // not necessarily an issue but surface it
            found.push({ id: `landmark-${idx}`, description: `Landmark <${el.tagName.toLowerCase()}> missing role/label`, selector: getSelector(el), element: el })
          }
        })

        // Limit and dedupe by selector
        const dedup = [] as Issue[]
        const seen = new Set<string>()
        for (const i of found) {
          if (!seen.has(i.selector)) { seen.add(i.selector); dedup.push(i) }
        }

        if (mounted) setIssues(dedup)
      } catch (e) {
        console.error('Accessibility scan failed', e)
      } finally {
        if (mounted) setScanning(false)
      }
    }

    scan()
    return () => { mounted = false }
  }, [open])

  useEffect(() => {
    // apply highlight style to currently highlighted element
    const prev = document.querySelector('[data-a11y-highlight]') as HTMLElement | null
    if (prev) {
      prev.removeAttribute('data-a11y-highlight')
      prev.style.outline = ''
      prev.style.boxShadow = ''
      prev.style.transition = ''
    }
    if (highlighted) {
      const el = document.querySelector(highlighted) as HTMLElement | null
      if (el) {
        el.setAttribute('data-a11y-highlight', '1')
        el.style.outline = '3px solid #FFD95A'
        el.style.boxShadow = '0 0 0 4px rgba(255, 217, 90, 0.14)'
        el.style.transition = 'box-shadow 0.15s ease'
        // scroll into view
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch { }
      }
    }
  }, [highlighted])

  function getSelector(el: Element) {
    if (!el) return ''
    let selector = el.tagName.toLowerCase()
    if (el.id) selector += `#${el.id}`
    if (el.className && typeof el.className === 'string') selector += '.' + el.className.split(' ').filter(Boolean).join('.')
    return selector
  }

  return (
    <Modal open={open} title="Accessibility QA" onClose={onClose} maxWidth={900}>
      <div style={{ minHeight: 240 }}>
        {scanning ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
        ) : (
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 380, maxHeight: 480, overflowY: 'auto', borderRight: '1px solid #EEF2F7', paddingRight: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Detected issues ({issues.length})</div>
              {issues.length === 0 ? (
                <div style={{ color: '#475569' }}>No obvious issues found by the lightweight scan. This is not a replacement for axe-core or manual testing.</div>
              ) : (
                <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {issues.map((it) => (
                    <li key={it.id} style={{ padding: 8, borderRadius: 8, background: '#fff', border: '1px solid #EEF2F7', display: 'flex', gap: 8, alignItems: 'center' }} onMouseEnter={() => setHighlighted(it.selector)} onMouseLeave={() => setHighlighted(null)}>
                      <div style={{ flex: '0 0 8px', height: 8, background: '#F59E0B', borderRadius: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{it.description}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{it.selector}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" variant="secondary" onClick={() => {
                          if (it.element && (it.element as HTMLElement).focus) try { (it.element as HTMLElement).focus(); setHighlighted(it.selector) } catch {}
                        }}>Focus</Button>
                        <Button size="sm" onClick={() => { if (it.element) {
                          const html = (it.element as Element).outerHTML
                          // open a small window for inspection
                          const w = window.open('', '_blank', 'width=600,height=400,menubar=no,toolbar=no,location=no')
                          if (w) {
                            w.document.write('<pre style="white-space:pre-wrap">' + escapeHtml(html) + '</pre>')
                            w.document.title = 'Element inspector'
                          }
                        } }}>Inspect</Button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Preview / Guidance</div>
              <div style={{ color: '#475569', fontSize: 13 }}>
                Use this panel to find common accessibility issues: images missing alt text, interactive elements without an accessible name, and form controls without labels. This lightweight scanner is a quick aid — run a full automated audit (axe-core) or manual testing for complete coverage.
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Button variant="secondary" onClick={() => window.location.reload()}>Rerun Scan</Button>
                <Button onClick={() => {
                  // simple export
                  const data = issues.map(i => ({ description: i.description, selector: i.selector }))
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'a11y-issues.json'
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                  URL.revokeObjectURL(url)
                }}>Export JSON</Button>
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Notes</div>
                <ul style={{ marginTop: 0, color: '#475569' }}>
                  <li>Keyboard navigation and screen reader testing are recommended.</li>
                  <li>Color contrast checks require computed color access and are not included in this quick scan.</li>
                  <li>For deeper automated checks consider integrating axe-core or Lighthouse.</li>
                </ul>
              </div>

            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default AccessibilityQaPanel
