import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui'
import type { Asset } from '@/types'
import { BrowserQRCodeSvgWriter } from '@zxing/browser'
import { Button } from '@/components/ui/Button'
import JSZip from 'jszip'
import { SelectItemsInline } from './SelectItemsInline'
import { assetService } from '@/services/assetService'
import { jsPDF } from 'jspdf'
import { calculateLayout } from '@/utils/qrLayout'

interface PrintQrModalProps {
  open: boolean
  assets: Asset[]
  onClose: () => void
  selectedAssetIds?: number[]
  onSelectionChange?: (ids: number[]) => void
}

export default function PrintQrModal({ open, assets, onClose, selectedAssetIds = [], onSelectionChange }: PrintQrModalProps) {
  const SHEET_TEMPLATE_KEY = 'psa_qr_sheet_template'
  const SHEET_SETTINGS_KEY = 'psa_qr_sheet_settings'
  const [qrSizeMm, setQrSizeMm] = useState<number>(() => {
    try {
      const s = localStorage.getItem(SHEET_SETTINGS_KEY)
      return s ? (JSON.parse(s).qrSizeMm ?? 30) : 30
    } catch (err) {
      return 30
    }
  })

  const [qrMode, setQrMode] = useState<'auto'|'custom'>(() => {
    try {
      const s = localStorage.getItem(SHEET_SETTINGS_KEY)
      return s ? (JSON.parse(s).qrMode ?? 'auto') : 'auto'
    } catch (err) {
      return 'auto'
    }
  })

  const [minQrMm, setMinQrMm] = useState<number>(() => {
    try {
      const s = localStorage.getItem(SHEET_SETTINGS_KEY)
      return s ? (JSON.parse(s).minQrMm ?? 15) : 15
    } catch (err) {
      return 15
    }
  })

  const [maxQrAllowedMm, setMaxQrAllowedMm] = useState<number>(() => {
    try {
      const s = localStorage.getItem(SHEET_SETTINGS_KEY)
      return s ? (JSON.parse(s).maxQrAllowedMm ?? 40) : 40
    } catch (err) {
      return 40
    }
  })

  const [labelWmm, setLabelWmm] = useState<number>(() => { try { const s = localStorage.getItem(SHEET_SETTINGS_KEY); return s ? JSON.parse(s).labelWmm ?? 70 : 70 } catch { return 70 } })
  const [labelHmm, setLabelHmm] = useState<number>(() => { try { const s = localStorage.getItem(SHEET_SETTINGS_KEY); return s ? JSON.parse(s).labelHmm ?? 24 : 24 } catch { return 24 } })
  const [labelMode, setLabelMode] = useState<'auto'|'custom'>(() => { try { const s = localStorage.getItem(SHEET_SETTINGS_KEY); return s ? JSON.parse(s).labelMode ?? 'auto' : 'auto' } catch { return 'auto' } })
  const [cols, setCols] = useState<number>(() => { try { const s = localStorage.getItem(SHEET_SETTINGS_KEY); return s ? JSON.parse(s).cols ?? 2 : 2 } catch { return 2 } })
  const [rows, setRows] = useState<number | 'auto'>(() => { try { const s = localStorage.getItem(SHEET_SETTINGS_KEY); return s ? JSON.parse(s).rows ?? 'auto' : 'auto' } catch { return 'auto' } })

  const [paperSize, setPaperSize] = useState<'A4'|'Letter'|'A5'|'Custom'>(() => { try { const s = localStorage.getItem(SHEET_SETTINGS_KEY); return s ? JSON.parse(s).paperSize ?? 'A4' : 'A4' } catch { return 'A4' } })
  const [orientation, setOrientation] = useState<'portrait'|'landscape'>(() => { try { const s = localStorage.getItem(SHEET_SETTINGS_KEY); return s ? JSON.parse(s).orientation ?? 'portrait' : 'portrait' } catch { return 'portrait' } })
  const [marginMm, setMarginMm] = useState<number>(() => { try { const s = localStorage.getItem(SHEET_SETTINGS_KEY); return s ? JSON.parse(s).marginMm ?? 2 : 2 } catch { return 2 } })
  const [gapMm, setGapMm] = useState<number>(() => { try { const s = localStorage.getItem(SHEET_SETTINGS_KEY); return s ? JSON.parse(s).gapMm ?? 0 : 0 } catch { return 0 } })
  const [textSize, setTextSize] = useState<number | 'auto'>(() => { try { const s = localStorage.getItem(SHEET_SETTINGS_KEY); return s ? JSON.parse(s).textSize ?? 12 : 12 } catch { return 12 } })
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedAssetIds || [])
  const [assetsForSelectionLocal, setAssetsForSelectionLocal] = useState<Asset[]>([])
  const [previewPageIndex, setPreviewPageIndex] = useState(0)
  const [isLoadingSelectedAssets, setIsLoadingSelectedAssets] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [collapsedSelection, setCollapsedSelection] = useState(false)
  // keep remaining collapse flags for future expansion; reference them to avoid TS unused errors
  const [collapsedQrSettings, setCollapsedQrSettings] = useState(false); void collapsedQrSettings; void setCollapsedQrSettings
  const [collapsedTextSettings, setCollapsedTextSettings] = useState(false); void collapsedTextSettings; void setCollapsedTextSettings
  const [collapsedLabelSettings, setCollapsedLabelSettings] = useState(false); void collapsedLabelSettings; void setCollapsedLabelSettings
  const [collapsedPaperSettings, setCollapsedPaperSettings] = useState(false); void collapsedPaperSettings; void setCollapsedPaperSettings
  const [collapsedExportSettings, setCollapsedExportSettings] = useState(false); void collapsedExportSettings; void setCollapsedExportSettings
  // new editor controls
  const [showName, setShowName] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem(SHEET_SETTINGS_KEY)
      return s ? (JSON.parse(s).showName ?? true) : true
    } catch (err) { return true }
  })
  const [showAssetNumber, setShowAssetNumber] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem(SHEET_SETTINGS_KEY)
      return s ? (JSON.parse(s).showAssetNumber ?? true) : true
    } catch (err) { return true }
  })
  const [showPropertyNumber, setShowPropertyNumber] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem(SHEET_SETTINGS_KEY)
      return s ? (JSON.parse(s).showPropertyNumber ?? true) : true
    } catch (err) { return true }
  })
  const [showSerialNumber, setShowSerialNumber] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem(SHEET_SETTINGS_KEY)
      return s ? (JSON.parse(s).showSerialNumber ?? true) : true
    } catch (err) { return true }
  })
  const [paddingMm, setPaddingMm] = useState<number>(2)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [isNarrow, setIsNarrow] = useState<boolean>(false)
  const [showLabelBounds, setShowLabelBounds] = useState<boolean>(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    const handler = (ev: MediaQueryListEvent) => setIsNarrow(ev.matches)
    setIsNarrow(mq.matches)
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler as any)
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', handler); else mq.removeListener(handler as any) }
  }, [])

  // Load selected assets when modal opens or selection changes
  useEffect(() => {
    let active = true
    async function load() {
      if (!open) return
      if (!selectedIds || selectedIds.length === 0) return
      setIsLoadingSelectedAssets(true)
      try {
        await ensureSelectedAssets()
      } finally {
        if (active) setIsLoadingSelectedAssets(false)
      }
    }
    load()
    return () => { active = false }
  }, [open, selectedIds])
  // Reference setters and state vars to avoid unused-variable build errors while UI controls may be added later
  void setPreviewPageIndex
  void setShowName
  void setShowAssetNumber
  void setShowPropertyNumber
  void setShowSerialNumber
  void setPaddingMm
  void setValidationMessage
  void setQrMode
  void setMinQrMm
  void setMaxQrAllowedMm
  void setLabelMode
  // also reference the state variables themselves where they may not yet be read by UI
  void showName
  void showAssetNumber
  void showPropertyNumber
  void showSerialNumber
  void paddingMm
  void qrMode
  void minQrMm
  void maxQrAllowedMm
  void labelMode

  function mmToPx(mm: number, dpi = 96) {
    return Math.round((mm / 25.4) * dpi)
  }

  function generateQrSvg(payload: string, sizePx: number) {
    try {
      const writer = new BrowserQRCodeSvgWriter()
      const svg = writer.write(String(payload).replace(/[<>]/g, ''), sizePx, sizePx)
      return svg.outerHTML
    } catch (err) {
      console.error('QR generation error', err)
      return ''
    }
  }

  async function ensureSelectedAssets(): Promise<Asset[]> {
    if (!selectedIds || selectedIds.length === 0) return []
    const cached = (assetsForSelectionLocal || []).filter(a => selectedIds.includes(a.id))
    const missing = selectedIds.filter(id => !cached.some(c => c.id === id))
    if (missing.length === 0) return cached
    try {
      const fetched = await Promise.all(missing.map(id => assetService.show(id).catch((e) => { console.error('Failed to fetch asset', id, e); return null })))
      const valid = fetched.filter(Boolean) as Asset[]
      // merge without losing existing cached items
      const combinedMap = new Map<number, Asset>()
      for (const a of cached) combinedMap.set(a.id, a)
      for (const a of valid) if (a) combinedMap.set(a.id, a)
      const combined = Array.from(combinedMap.values())
      setAssetsForSelectionLocal(prev => {
        // merge with any other cached items not in combined
        const map = new Map<number, Asset>()
        for (const a of (prev || [])) map.set(a.id, a)
        for (const a of combined) map.set(a.id, a)
        return Array.from(map.values())
      })
      return combined
    } catch (err) {
      console.error(err)
      return cached
    }
  }

  // Use external layout engine (calculateLayout) from utils
  // This keeps preview and PDF generation using the same mm-based layout

  // derive final assets list (either selectedIds mapped to cached assets, or the assets prop)
  const finalAssets = (selectedIds && selectedIds.length > 0)
    ? (assetsForSelectionLocal.filter(a => selectedIds.includes(a.id)))
    : (assets && assets.length > 0 ? assets : [])

  const [templateName, setTemplateName] = useState<string>(() => { try { return localStorage.getItem(SHEET_TEMPLATE_KEY) || 'custom' } catch { return 'custom' } })

  function persistSettings() {
    try {
      localStorage.setItem(SHEET_SETTINGS_KEY, JSON.stringify({ qrSizeMm, labelWmm, labelHmm, cols, rows, paperSize, orientation, marginMm, gapMm, textSize, showName, showAssetNumber, showPropertyNumber, showSerialNumber }))
      localStorage.setItem(SHEET_TEMPLATE_KEY, templateName)
    } catch (e) { /* ignore */ }
  }

  function applyTemplate(name: string) {
    setTemplateName(name)
    try { localStorage.setItem(SHEET_TEMPLATE_KEY, name) } catch {}
    switch (name) {
      case 'A4-2':
        setPaperSize('A4'); setOrientation('portrait'); setCols(2); setRows('auto'); setMarginMm(2); setGapMm(0); setLabelWmm(70); setLabelHmm(24); setQrSizeMm(30); setTextSize(12); break
      case 'A4-3':
        setPaperSize('A4'); setOrientation('portrait'); setCols(3); setRows('auto'); setMarginMm(2); setGapMm(2); setLabelWmm(60); setLabelHmm(24); setQrSizeMm(25); setTextSize(11); break
      case 'A4-4':
        setPaperSize('A4'); setOrientation('portrait'); setCols(4); setRows('auto'); setMarginMm(3); setGapMm(2); setLabelWmm(48); setLabelHmm(20); setQrSizeMm(22); setTextSize(10); break
      case 'small':
        setPaperSize('A4'); setOrientation('portrait'); setCols(4); setRows('auto'); setMarginMm(3); setGapMm(1); setLabelWmm(40); setLabelHmm(18); setQrSizeMm(20); setTextSize(9); break
      case 'large':
        setPaperSize('A4'); setOrientation('portrait'); setCols(2); setRows('auto'); setMarginMm(4); setGapMm(2); setLabelWmm(90); setLabelHmm(30); setQrSizeMm(40); setTextSize(14); break
      default:
        // custom - do not change
        break
    }
    // persist after applying
    setTimeout(persistSettings, 50)
  }

  function generateLabelSvgForAsset_mm(a: Asset, qrMm: number, wMm: number, hMm: number, txtSize: number | 'auto', exportDpi = 300) {
    const payload = a.psa_qr_payload ?? a.psa_qr_identifier ?? String(a.asset_number ?? a.id)
    const outerW = mmToPx(wMm, exportDpi)
    const outerH = mmToPx(hMm, exportDpi)
    const dpi = exportDpi

    // padding from state (in mm)
    const padMm = Math.max(0, paddingMm || 2)
    const padPx = mmToPx(padMm, dpi)
    const textGapMm = 1 // mm gap between QR and text
    const textGapPx = mmToPx(textGapMm, dpi)

    // desired text size
    const desiredPt = (typeof txtSize === 'number') ? txtSize : 12
    const minPt = 6

    // canvas for measurements
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
    const ctx = canvas ? (canvas.getContext('2d') as CanvasRenderingContext2D | null) : null

    const maxTextWidthPx = Math.max(10, outerW - padPx * 2)

    function measureTextWidth(text: string, pt: number) {
      const px = Math.round(pt * dpi / 72)
      if (ctx) {
        ctx.font = `${px}px Inter, sans-serif`
        return ctx.measureText(text).width
      }
      return text.length * px * 0.55
    }

    function wrapTextGreedy(text: string, pt: number) {
      const words = text.split(/\s+/)
      const lines: string[] = []
      let current = ''
      for (const w of words) {
        const candidate = current ? `${current} ${w}` : w
        if (measureTextWidth(candidate, pt) <= maxTextWidthPx) {
          current = candidate
        } else {
          if (current) lines.push(current)
          // break long single word
          if (measureTextWidth(w, pt) > maxTextWidthPx) {
            let chunk = ''
            for (const ch of w) {
              const cand = chunk + ch
              if (measureTextWidth(cand, pt) <= maxTextWidthPx) chunk = cand
              else { if (chunk) lines.push(chunk); chunk = ch }
            }
            if (chunk) current = chunk
            else current = ''
          } else {
            current = w
          }
        }
      }
      if (current) lines.push(current)
      return lines
    }

    // determine name lines and fontPt such that text width fits
    const rawName = showName ? (a.name || 'asset') : ''
    let fontPt = desiredPt
    let nameLines: string[] = rawName ? wrapTextGreedy(rawName, fontPt) : []
    while (nameLines.length > 0 && nameLines.some(l => measureTextWidth(l, fontPt) > maxTextWidthPx) && fontPt > minPt) {
      fontPt -= 1
      nameLines = wrapTextGreedy(rawName, fontPt)
    }
    const fontPx = Math.round(fontPt * dpi / 72)
    const lineHeightPx = Math.round(fontPx * 1.15)
    const nameHeightPx = nameLines.length * lineHeightPx

    // meta lines
    const rawMetaLines: string[] = []
    if (showAssetNumber && a.asset_number) rawMetaLines.push(String(a.asset_number))
    if (showPropertyNumber && (a as any).property_number) rawMetaLines.push(`Property: ${(a as any).property_number}`)
    if (showSerialNumber && (a as any).serial_number) rawMetaLines.push(`Serial: ${(a as any).serial_number}`)
    const metaPt = Math.max(6, Math.round((typeof txtSize === 'number' ? txtSize : 12) - 2))
    const metaPx = Math.round(metaPt * dpi / 72)
    const metaLineHeightPx = Math.round(metaPx * 1.1)
    const metaLines: string[] = []
    for (const rawLine of rawMetaLines) {
      const wrapped = wrapTextGreedy(rawLine, metaPt)
      metaLines.push(...wrapped)
    }
    const metaHeightPx = metaLines.length * metaLineHeightPx

    const hasText = nameLines.length > 0 || metaLines.length > 0
    const effectiveTextGapPx = hasText ? textGapPx : 0

    // compute available space for QR after reserving padding and text (auto QR behavior)
    const availableForQrPx = Math.max(0, outerH - padPx * 2 - effectiveTextGapPx - nameHeightPx - metaHeightPx)
    const maxQrByWidthPx = Math.max(0, outerW - padPx * 2)
    const requestedQrPx = Math.max(0, mmToPx(qrMm, dpi))

    // determine final qrPx (respect width and height)
    let qrPx = Math.min(requestedQrPx, maxQrByWidthPx, availableForQrPx)
    // if auto and qrPx smaller than min, try to reduce text first
    const minQrPx = mmToPx(minQrMm || 10, dpi)
    if (qrMode === 'auto' && qrPx < minQrPx) {
      // reduce font until qr can be minQr or font reaches minPt
      while (fontPt > minPt) {
        fontPt -= 1
        nameLines = wrapTextGreedy(rawName, fontPt)
        const newFontPx = Math.round(fontPt * dpi / 72)
        const newLineHeightPx = Math.round(newFontPx * 1.15)
        const newNameHeightPx = nameLines.length * newLineHeightPx
        const avail = Math.max(0, outerH - padPx * 2 - textGapPx - newNameHeightPx - metaHeightPx)
        const newQrPx = Math.min(requestedQrPx, maxQrByWidthPx, avail)
        if (newQrPx >= minQrPx) { qrPx = newQrPx; break }
      }
      // if still too small, clamp to available space (may be < min)
      qrPx = Math.max(0, Math.min(qrPx, availableForQrPx))
    }

    // enforce non-overlap by computing placement: QR at top area, text below
    const qrX = Math.round((outerW - qrPx) / 2)
    const qrY = padPx
    const textStartY = qrY + qrPx + effectiveTextGapPx

    // build qr inner svg sized to qrPx
    const svgInner = generateQrSvg(payload, qrPx)

    // build combined text image (rendered to an offscreen canvas and embedded as a PNG) to ensure rasterization includes text
    let textImageSvg = ''
    const totalTextHeightPx = nameHeightPx + metaHeightPx
    if (totalTextHeightPx > 0) {
      try {
        const textCanvas = document.createElement('canvas')
        // ensure at least 1px dimensions
        const textCanvasW = Math.max(1, Math.ceil(maxTextWidthPx))
        const textCanvasH = Math.max(1, Math.ceil(totalTextHeightPx))
        textCanvas.width = textCanvasW
        textCanvas.height = textCanvasH
        const tctx = textCanvas.getContext('2d')
        if (tctx) {
          // draw background transparent
          tctx.clearRect(0, 0, textCanvasW, textCanvasH)
          // draw name lines (bold)
          tctx.fillStyle = '#0F172A'
          tctx.textAlign = 'center'
          tctx.textBaseline = 'top'
          // compute x center
          const centerX = textCanvasW / 2
          // name font
          const nameFontPx = fontPx
          tctx.font = `700 ${nameFontPx}px Inter, sans-serif`
          let y = 0
          for (const line of nameLines) {
            tctx.fillText(line, centerX, y)
            y += lineHeightPx
          }
          // meta font
          const metaFontPx = metaPx
          tctx.fillStyle = '#64748B'
          tctx.font = `${metaFontPx}px Inter, sans-serif`
          for (const mline of metaLines) {
            tctx.fillText(mline, centerX, y)
            y += metaLineHeightPx
          }
          const dataUrl = textCanvas.toDataURL('image/png')
          const imgX = Math.round((outerW - textCanvasW) / 2)
          const imgY = textStartY
          textImageSvg = `<image href="${dataUrl}" x="${imgX}" y="${imgY}" width="${textCanvasW}" height="${textCanvasH}" preserveAspectRatio="xMidYMin slice" />`
        }
      } catch (e) {
        // fallback to text nodes if canvas rendering fails
        let nameTextSvg = ''
        if (nameLines.length > 0) {
          let tspans = ''
          for (let i = 0; i < nameLines.length; i++) {
            const line = nameLines[i].replace(/</g, '&lt;').replace(/>/g, '&gt;')
            const dy = i === 0 ? '0' : '1.1em'
            tspans += `<tspan x="50%" dy="${dy}">${line}</tspan>`
          }
          const textY = textStartY + Math.round(fontPx * 0.2)
          nameTextSvg = `<text x="50%" y="${textY}" font-family="sans-serif" font-size="${fontPx}" font-weight="700" fill="#0F172A" text-anchor="middle">${tspans}</text>`
        }
        let metaSvg = ''
        if (metaLines.length > 0) {
          let metaTspans = ''
          for (let i = 0; i < metaLines.length; i++) {
            const line = metaLines[i].replace(/</g, '&lt;').replace(/>/g, '&gt;')
            const dy = i === 0 ? '0' : '1.05em'
            metaTspans += `<tspan x="50%" dy="${dy}">${line}</tspan>`
          }
          const metaY = textStartY + nameLines.length * lineHeightPx + Math.round(metaPx * 0.8)
          metaSvg = `<text x="50%" y="${metaY}" font-family="sans-serif" font-size="${metaPx}" fill="#64748B" text-anchor="middle">${metaTspans}</text>`
        }
        textImageSvg = nameTextSvg + '\n' + metaSvg
      }
    }

    const svgContent = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${wMm}mm" height="${hMm}mm" viewBox="0 0 ${outerW} ${outerH}">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <g transform="translate(${qrX}, ${qrY})">\n    ${svgInner}\n  </g>\n  ${textImageSvg}\n</svg>`
    return svgContent
  }

  function generatePageSvgFromLayout(pageAssets: Asset[], layout: ReturnType<typeof calculateLayout>, exportDpi = 300, effectiveQrMm?: number) {
    const { paperW, paperH, lw, lh, cols, rows, margin, gap } = layout
    const sheetW_px = mmToPx(paperW, exportDpi)
    const sheetH_px = mmToPx(paperH, exportDpi)
    // collect clipPath defs to constrain each label to its rectangle
    let defs = '<defs>\n'
    let body = ''
    let svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${paperW}mm" height="${paperH}mm" viewBox="0 0 ${sheetW_px} ${sheetH_px}">\n  <rect width="100%" height="100%" fill="#fff"/>\n`
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        const a = pageAssets[idx]
        if (!a) continue
        const x_px = mmToPx(margin, exportDpi) + c * (mmToPx(lw, exportDpi) + mmToPx(gap, exportDpi))
        const y_px = mmToPx(margin, exportDpi) + r * (mmToPx(lh, exportDpi) + mmToPx(gap, exportDpi))
        const labelW_px = mmToPx(lw, exportDpi)
        const labelH_px = mmToPx(lh, exportDpi)
        const clipId = `clip-${r}-${c}`
        defs += `<clipPath id=\"${clipId}\"><rect x=\"0\" y=\"0\" width=\"${labelW_px}\" height=\"${labelH_px}\"/></clipPath>\n`
        const qrForLabel = typeof effectiveQrMm === 'number' ? effectiveQrMm : qrSizeMm
        const labelSvg = generateLabelSvgForAsset_mm(a, qrForLabel, lw, lh, textSize, exportDpi)
        const inner = labelSvg.replace(/^<\?xml[^>]*>\s*/i, '').replace(/<\/?svg[^>]*>/gi, '')
        body += `<g transform=\"translate(${x_px}, ${y_px})\">\n  <g clip-path=\"url(#${clipId})\">${inner}</g>\n</g>\n`
      }
    }
    defs += '</defs>\n'
    svg += defs + body + '</svg>'
    return svg
  }

  async function downloadSvgs() {
    let usedAssets = finalAssets
    if ((!usedAssets || usedAssets.length === 0) && selectedIds && selectedIds.length > 0) {
      await ensureSelectedAssets()
      usedAssets = assetsForSelectionLocal.filter(a => selectedIds.includes(a.id))
    }
    if (!usedAssets || usedAssets.length === 0) { window.alert('No assets selected'); return }
    try {
      const layout = calculateLayout({ paperSize, orientation, labelWmm, labelHmm, cols, rows, marginMm, gapMm }, usedAssets, showName)
      if (!layout.fits) { if (layout.warning) { setValidationMessage(layout.warning); return } }
      const effectiveQr = (qrMode === 'auto') ? Math.max(minQrMm, Math.min(maxQrAllowedMm, layout.maxQrMm)) : qrSizeMm
      if (layout.pages.length === 1) {
        const svg = generatePageSvgFromLayout(layout.pages[0], layout, 300, effectiveQr)
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const aEl = document.createElement('a')
        aEl.href = url
        aEl.download = `psa-qr-sheet-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.svg`
        document.body.appendChild(aEl)
        aEl.click()
        aEl.remove()
        URL.revokeObjectURL(url)
        return
      }
      const zip = new JSZip()
      for (let i = 0; i < layout.pages.length; i++) {
        const svg = generatePageSvgFromLayout(layout.pages[i], layout, 300, effectiveQr)
        zip.file(`psa-qr-sheet-page-${i+1}.svg`, svg)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const aEl = document.createElement('a')
      aEl.href = url
      aEl.download = `psa-qr-sheets-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.zip`
      document.body.appendChild(aEl)
      aEl.click()
      aEl.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download SVGs', err)
      window.alert('Failed to prepare SVG download: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  async function downloadPngs() {
    let usedAssets = finalAssets
    if ((!usedAssets || usedAssets.length === 0) && selectedIds && selectedIds.length > 0) {
      await ensureSelectedAssets()
      usedAssets = assetsForSelectionLocal.filter(a => selectedIds.includes(a.id))
    }
    if (!usedAssets || usedAssets.length === 0) { window.alert('No assets selected'); return }
    try {
      const layout = calculateLayout({ paperSize, orientation, labelWmm, labelHmm, cols, rows, marginMm, gapMm }, usedAssets, showName)
      if (!layout.fits) { if (layout.warning) { setValidationMessage(layout.warning); return } }
      const effectiveQr = (qrMode === 'auto') ? Math.max(minQrMm, Math.min(maxQrAllowedMm, layout.maxQrMm)) : qrSizeMm
      const DPI = 300
      if (layout.pages.length === 1) {
        const svg = generatePageSvgFromLayout(layout.pages[0], layout, DPI, effectiveQr)
        const img = new Image()
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(mmToPx(layout.paperW, DPI))
          canvas.height = Math.round(mmToPx(layout.paperH, DPI))
          const ctx = canvas.getContext('2d')
          if (ctx) { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); canvas.toBlob((blob) => {
            if (!blob) { window.alert('Failed to render PNG'); return }
            const url2 = URL.createObjectURL(blob)
            const aEl = document.createElement('a')
            aEl.href = url2
            aEl.download = `psa-qr-sheet-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`
            document.body.appendChild(aEl)
            aEl.click()
            aEl.remove()
            URL.revokeObjectURL(url2)
          }, 'image/png', 0.95) }
          URL.revokeObjectURL(url)
        }
        img.onerror = () => { window.alert('Failed to load generated SVG into image') }
        img.src = url
        return
      }
      const zip = new JSZip()
      for (let i = 0; i < layout.pages.length; i++) {
        const svg = generatePageSvgFromLayout(layout.pages[i], layout, DPI, effectiveQr)
        const pngBlob = await (async () => {
          return await new Promise<Blob | null>((res) => {
            const img = new Image()
            const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(svgBlob)
            img.onload = () => {
              const canvas = document.createElement('canvas')
              canvas.width = Math.round(mmToPx(layout.paperW, DPI))
              canvas.height = Math.round(mmToPx(layout.paperH, DPI))
              const ctx = canvas.getContext('2d')
              if (ctx) { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); canvas.toBlob((b) => { res(b) }, 'image/png', 0.95) }
              URL.revokeObjectURL(url)
            }
            img.onerror = () => { console.error('image error'); res(null) }
            img.src = url
          })
        })()
        if (pngBlob) zip.file(`psa-qr-sheet-page-${i+1}.png`, pngBlob)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const aEl = document.createElement('a')
      aEl.href = url
      aEl.download = `psa-qr-sheets-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.zip`
      document.body.appendChild(aEl)
      aEl.click()
      aEl.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download PNG', err)
      window.alert('Failed to prepare PNG download')
    }
  }



  // Robust SVG -> PNG renderer: tries multiple strategies and DPI fallbacks to avoid transient "Failed to load SVG into image" errors
  async function renderSvgToPngDataUrl(svg: string, mmWidth: number, mmHeight: number, dpi = 600) {
    // helpers
    function buildBlobUrl(svgContent: string) {
      return URL.createObjectURL(new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' }))
    }
    function buildDataUrl(svgContent: string) {
      // use base64 encoding for broader browser compatibility
      try {
        // encode unicode-safe
        const base64 = typeof btoa === 'function'
          ? btoa(unescape(encodeURIComponent(svgContent)))
          : Buffer.from(svgContent, 'utf8').toString('base64')
        return 'data:image/svg+xml;base64,' + base64
      } catch (e) {
        // fallback to URI encoding if base64 fails
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent)
      }
    }

    const tryDpis = [dpi, 300, 150]
    let lastError: any = null
    for (const d of tryDpis) {
      try {
        const pxW = mmToPx(mmWidth, d)
        const pxH = mmToPx(mmHeight, d)
        // ensure width/height attributes in px present on svg for some browsers
        let svgToUse = svg
        if (!/viewBox=/.test(svgToUse)) {
          // if no viewBox, we add one matching pixel dimensions
          svgToUse = svgToUse.replace(/<svg([^>]*)>/i, (_m, g1) => {
            return `<svg${g1} viewBox="0 0 ${pxW} ${pxH}" `
          })
        }
        // try blob URL approach first
        const blobUrl = buildBlobUrl(svgToUse)
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const img = new Image()
            // try crossOrigin to improve loading in some browsers
            try { img.crossOrigin = 'anonymous' } catch (e) { /* ignore */ }
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas')
                canvas.width = pxW
                canvas.height = pxH
                const ctx = canvas.getContext('2d')
                if (!ctx) { URL.revokeObjectURL(blobUrl); return reject(new Error('Canvas not supported')) }
                ctx.fillStyle = '#fff'
                ctx.fillRect(0,0,canvas.width,canvas.height)
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                const out = canvas.toDataURL('image/png')
                URL.revokeObjectURL(blobUrl)
                resolve(out)
              } catch (e) { URL.revokeObjectURL(blobUrl); reject(e) }
            }
            img.onerror = (ev) => { URL.revokeObjectURL(blobUrl); const info = (ev && (ev as any).message) ? (ev as any).message : 'unknown'; reject(new Error('Failed to load SVG into image (blob) - ' + info)) }
            img.src = blobUrl
          })
          return dataUrl
        } catch (errBlob) {
          lastError = errBlob
          // try data URL fallback for this DPI
          try {
            const dataUri = buildDataUrl(svgToUse)
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const img2 = new Image()
              // set crossOrigin to anonymous to improve blob/data-uri loading in some browsers
              try { img2.crossOrigin = 'anonymous' } catch (e) { /* ignore if not supported */ }
              img2.onload = () => {
                try {
                  const canvas = document.createElement('canvas')
                  canvas.width = pxW
                  canvas.height = pxH
                  const ctx = canvas.getContext('2d')
                  if (!ctx) return reject(new Error('Canvas not supported'))
                  ctx.fillStyle = '#fff'
                  ctx.fillRect(0,0,canvas.width,canvas.height)
                  ctx.drawImage(img2, 0, 0, canvas.width, canvas.height)
                  resolve(canvas.toDataURL('image/png'))
                } catch (e) { reject(e) }
              }
              img2.onerror = (ev) => {
                // include event info to help debugging
                const info = (ev && (ev as any).message) ? (ev as any).message : 'unknown'
                reject(new Error('Failed to load SVG into image (data-uri) - ' + info))
              }
              img2.src = dataUri
            })
            return dataUrl
          } catch (errDataUri) {
            lastError = errDataUri
            // try next DPI
            continue
          }
        }
      } catch (e) {
        lastError = e
        continue
      }
    }
    throw lastError || new Error('Failed to render SVG to PNG')
  }

  async function downloadPdf() {
    // ensure selected assets are loaded and use the cached assetsForSelectionLocal
    let usedAssets = finalAssets
    if ((!usedAssets || usedAssets.length === 0) && selectedIds && selectedIds.length > 0) {
      await ensureSelectedAssets()
      usedAssets = assetsForSelectionLocal.filter(a => selectedIds.includes(a.id))
    }
    if (!usedAssets || usedAssets.length === 0) { window.alert('No assets selected'); return }

    const layout = calculateLayout({ paperSize, orientation, labelWmm, labelHmm, cols, rows, marginMm, gapMm }, usedAssets, showName)
    if (!layout.fits) { if (layout.warning) { setValidationMessage(layout.warning); return } }
    // ensure we are not silently shrinking a user-requested custom QR size
    if (qrMode === 'custom' && qrSizeMm > layout.maxQrMm) { setValidationMessage(`QR size ${qrSizeMm} mm exceeds available label space. Use maximum: ${layout.maxQrMm} mm`); return }

    try {
      if (isGeneratingPdf) { window.alert('PDF generation already in progress'); return }
      setIsGeneratingPdf(true)
      const paperW = layout.paperW
      const paperH = layout.paperH
      const orient = orientation === 'landscape' ? 'landscape' : 'portrait'
      const doc = new jsPDF({ unit: 'mm', format: [paperW, paperH], orientation: orient })
      const DPI = 600 // high DPI for sharp QR raster embedding

      // Render each page as a single SVG then rasterize that page into the PDF to guarantee preview/PDF parity
      const effectiveQr = (qrMode === 'auto') ? Math.max(minQrMm, Math.min(maxQrAllowedMm, layout.maxQrMm)) : qrSizeMm
      for (let p = 0; p < layout.pages.length; p++) {
        const pageSvg = generatePageSvgFromLayout(layout.pages[p], layout, DPI, effectiveQr)
        try {
          const pagePng = await renderSvgToPngDataUrl(pageSvg, paperW, paperH, DPI)
          // add full-page image at 0,0 with paperW x paperH (mm units)
          doc.addImage(pagePng, 'PNG', 0, 0, paperW, paperH)
        } catch (pageErr) {
          console.error('Failed to render page', p + 1, pageErr)
          setIsGeneratingPdf(false)
          const msg = pageErr instanceof Error ? pageErr.message : String(pageErr)
          window.alert(`Failed to render page ${p + 1}: ${msg}`)
          return
        }
        if (p < layout.pages.length - 1) doc.addPage([paperW, paperH], orient)
      }

      const name = `psa-qr-sheet-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`
      doc.save(name)
      setIsGeneratingPdf(false)
    } catch (err) {
      console.error('Failed to generate PDF', err)
      setIsGeneratingPdf(false)
      const message = err instanceof Error ? err.message : String(err)
      window.alert(`Failed to generate PDF: ${message}`)
    }
  }

  function printSheet() {
    const assetsList = finalAssets
    const layout = calculateLayout({ paperSize, orientation, labelWmm, labelHmm, cols, rows, marginMm, gapMm }, assetsList, showName)
    if (!layout.fits) { if (layout.warning) { setValidationMessage(layout.warning); return } }
    const effectiveQr = (qrMode === 'auto') ? Math.max(minQrMm, Math.min(maxQrAllowedMm, layout.maxQrMm)) : qrSizeMm
    const win = window.open('', '_blank')
    if (!win) { window.alert('Unable to open print window'); return }
    const html = ['<html><head><title>Print QR Labels</title><style>body{margin:0;padding:0} .page{page-break-after:always}</style>']
    html.push(`<style>@page { size: ${layout.paperW}mm ${layout.paperH}mm; margin: 0 }</style>`)
    html.push('</head><body>')
    for (let i = 0; i < layout.pages.length; i++) {
      const svg = generatePageSvgFromLayout(layout.pages[i], layout, 96, effectiveQr)
      html.push(`<div class="page">${svg}</div>`)
    }
    html.push('</body></html>')
    win.document.open()
    win.document.write(html.join('\n'))
    win.document.close()
    setTimeout(() => { win.print(); }, 500)
  }

  void downloadSvgs; void downloadPngs; void printSheet;

  return (
    <Modal open={open} title={"QR Label Editor"} onClose={onClose} maxWidth={900} footer={null}>
      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '320px 1fr', gap: 16 }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <label className="block text-sm font-semibold">Select Items</label>
            <div style={{ marginTop: 6 }}>
              <SelectItemsInline initialSelected={selectedIds} onChange={(ids) => { setSelectedIds(ids); /* keep cached assetsForSelectionLocal: ensureSelectedAssets will fetch missing items */ if (onSelectionChange) onSelectionChange(ids); setPreviewPageIndex(0); }} />
              <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button style={{ border: 'none', background: 'transparent', color: '#1E40AF', cursor: 'pointer' }} onClick={() => { setSelectedIds([]); if (onSelectionChange) onSelectionChange([]); setAssetsForSelectionLocal([]) }}>Clear Selection</button>
                <div style={{ marginLeft: 'auto', fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{(selectedIds && selectedIds.length) || 0} selected</div>
              </div>

              <div style={{ marginTop: 8 }}>
                <button onClick={() => setCollapsedSelection(!collapsedSelection)} style={{ background: 'transparent', border: 'none', color: '#0F172A', fontWeight: 600 }}>{collapsedSelection ? 'Show' : 'Hide'} Selection Controls</button>
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="block text-sm font-semibold">Template</label>
                <select value={templateName} onChange={(e) => applyTemplate(e.target.value)} style={{ marginTop: 6, width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #E6EEF8' }}>
                  <option value="custom">Custom</option>
                  <option value="A4-2">A4 Sticker � 2 Columns</option>
                  <option value="A4-3">A4 Sticker � 3 Columns</option>
                  <option value="A4-4">A4 Sticker � 4 Columns</option>
                  <option value="small">A4 Sticker � Small Labels</option>
                  <option value="large">A4 Sticker � Large Labels</option>
                </select>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => { persistSettings(); window.alert('Settings saved') }} style={{ padding: '6px 8px', borderRadius: 6 }}>Save Settings</button>
                </div>
                  
                <div style={{ marginTop: 12, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                  <label className="block text-sm font-semibold">Label Content</label>
                  <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input type="checkbox" checked={showName} onChange={(e) => { setShowName(e.target.checked); setValidationMessage(null) }} /> Item Name
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input type="checkbox" checked={showAssetNumber} onChange={(e) => { setShowAssetNumber(e.target.checked); setValidationMessage(null) }} /> Asset Number
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input type="checkbox" checked={showPropertyNumber} onChange={(e) => { setShowPropertyNumber(e.target.checked); setValidationMessage(null) }} /> Property Number
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input type="checkbox" checked={showSerialNumber} onChange={(e) => { setShowSerialNumber(e.target.checked); setValidationMessage(null) }} /> Serial Number
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: 12, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                  <label className="block text-sm font-semibold">QR Settings</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 13 }}>QR size (mm)</div>
                    <input type="number" value={qrSizeMm} onChange={(e) => { setQrSizeMm(Number(e.target.value)); setValidationMessage(null) }} min={1} style={{ width: 80, padding: 6, borderRadius: 6, border: '1px solid #E6EEF8' }} />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {validationMessage ? (
                      <div style={{ background: 'rgba(255,240,240,0.95)', color: '#B91C1C', padding: 8, borderRadius: 6 }}>
                        {validationMessage} <button onClick={() => {
                          // try to offer the maximum QR size as suggested action
                          const assetsList = (selectedIds && selectedIds.length > 0) ? assetsForSelectionLocal.filter(a => selectedIds.includes(a.id)) : (assets && assets.length > 0 ? assets : [])
                          const layout = calculateLayout({ paperSize, orientation, labelWmm, labelHmm, cols, rows, marginMm, gapMm }, assetsList, showName || showAssetNumber || showPropertyNumber || showSerialNumber)
                          if (layout && layout.maxQrMm) setQrSizeMm(Math.max(1, Math.floor(layout.maxQrMm)))
                          setValidationMessage(null)
                        }} style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6 }}>Use maximum</button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={{ marginTop: 12, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                  <label className="block text-sm font-semibold">Label Settings</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 13 }}>Label width (mm)</div>
                      <input type="number" value={labelWmm} onChange={(e) => { setLabelWmm(Number(e.target.value)); setValidationMessage(null) }} min={1} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #E6EEF8' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13 }}>Label height (mm)</div>
                      <input type="number" value={labelHmm} onChange={(e) => { setLabelHmm(Number(e.target.value)); setValidationMessage(null) }} min={1} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #E6EEF8' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13 }}>Columns</div>
                      <input type="number" value={cols} onChange={(e) => { setCols(Math.max(1, Number(e.target.value))); setValidationMessage(null) }} min={1} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #E6EEF8' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13 }}>Rows ('auto' allowed)</div>
                      <input type="text" value={rows === 'auto' ? 'auto' : String(rows)} onChange={(e) => { const v = e.target.value.trim(); setRows(v === 'auto' ? 'auto' : Math.max(1, Number(v))); setValidationMessage(null) }} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #E6EEF8' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13 }}>Margin (mm)</div>
                      <input type="number" value={marginMm} onChange={(e) => { setMarginMm(Number(e.target.value)); setValidationMessage(null) }} min={0} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #E6EEF8' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13 }}>Gap (mm)</div>
                      <input type="number" value={gapMm} onChange={(e) => { setGapMm(Number(e.target.value)); setValidationMessage(null) }} min={0} style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #E6EEF8' }} />
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13 }}>Paper</div>
                      <select value={paperSize} onChange={(e) => { setPaperSize(e.target.value as any); setValidationMessage(null) }} style={{ padding: 6, borderRadius: 6, border: '1px solid #E6EEF8' }}>
                        <option value="A4">A4</option>
                        <option value="Letter">Letter</option>
                        <option value="A5">A5</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 13 }}>Orientation</div>
                      <select value={orientation} onChange={(e) => { setOrientation(e.target.value as any); setValidationMessage(null) }} style={{ padding: 6, borderRadius: 6, border: '1px solid #E6EEF8' }}>
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                  <label className="block text-sm font-semibold">Text Settings</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 13 }}>Text size (pt)</div>
                    <input type="number" value={textSize === 'auto' ? 12 : textSize} onChange={(e) => { const v = e.target.value; setTextSize(v === '' ? 'auto' : Number(v)); setValidationMessage(null) }} min={6} style={{ width: 80, padding: 6, borderRadius: 6, border: '1px solid #E6EEF8' }} />
                    <div style={{ marginLeft: 12 }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={true} readOnly /> Auto Fit Text
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', marginLeft: 4 }}>
              <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 600 }}>Selected: {(selectedIds && selectedIds.length) || (assets && assets.length) || 0} items</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button variant="primary" onClick={downloadPdf} disabled={isGeneratingPdf || (((selectedIds && selectedIds.length) || (assets && assets.length) || 0) === 0)}>Download PDF</Button>
            </div>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div style={{ borderLeft: '1px solid #E5E7EB', paddingLeft: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Preview</div>
          <div style={{ border: '1px solid #E5E7EB', padding: 10, height: 640, overflow: 'auto', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 820 }}>
              {/* calculate layout and render first page */}
              {
                (() => {
                  const assetsList = finalAssets
                  const layout = calculateLayout({ paperSize, orientation, labelWmm, labelHmm, cols, rows, marginMm, gapMm }, assetsList, showName)
                  const pages = layout.pages
                  const page = pages[previewPageIndex] || []
                  return (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ border: '1px solid #E6EEF8', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', background: '#fff', padding: 8 }}>
                        <div style={{ width: `${layout.paperW}mm`, height: `${layout.paperH}mm`, position: 'relative', overflow: 'hidden', background: '#fff' }}>
                          {!layout.fits ? (<div style={{ position: 'absolute', inset: 8, background: 'rgba(255,240,240,0.9)', color: '#B91C1C', padding: 8, borderRadius: 6, zIndex: 5 }}>{layout.warning}</div>) : null}
                          {qrSizeMm < 20 ? (<div style={{ position: 'absolute', left: 8, top: 8, background: 'rgba(255,250,205,0.95)', color: '#92400E', padding: 8, borderRadius: 6, zIndex: 6 }}>Warning: QR size is small ({qrSizeMm} mm). Scannability may be reduced.</div>) : null}
                          {isLoadingSelectedAssets && selectedIds && selectedIds.length > 0 ? (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading selected assets...</div>
                          ) : (
                            page.map((a: Asset, idx: number) => {
                              const perRow = layout.cols
                              const r = Math.floor(idx / perRow)
                              const c = idx % perRow
                              const left = layout.margin + c * (layout.lw + layout.gap)
                              const top = layout.margin + r * (layout.lh + layout.gap)
                              const effectiveQrPreview = (qrMode === 'auto') ? Math.max(minQrMm, Math.min(maxQrAllowedMm, layout.maxQrMm)) : qrSizeMm
                              const labelSvgForPreview = generateLabelSvgForAsset_mm(a, effectiveQrPreview, layout.lw, layout.lh, textSize, 96)
                              return (
                                <div key={a.id} style={{ position: 'absolute', left: `${left}mm`, top: `${top}mm`, width: `${layout.lw}mm`, height: `${layout.lh}mm`, boxSizing: 'border-box', padding: 0 }}>
                                  <div dangerouslySetInnerHTML={{ __html: labelSvgForPreview }} />
                                  {showLabelBounds ? (
                                    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', border: '1px dashed rgba(220, 38, 38, 0.8)', pointerEvents: 'none' }} />
                                  ) : null}
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()
              }
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                <button onClick={() => setPreviewPageIndex(Math.max(0, previewPageIndex - 1))} disabled={previewPageIndex <= 0} style={{ padding: '6px 10px', borderRadius: 6 }}>Previous</button>
                <div style={{ alignSelf: 'center' }}>Page {previewPageIndex + 1} / {(() => { const layout = calculateLayout({ paperSize, orientation, labelWmm, labelHmm, cols, rows, marginMm, gapMm }, finalAssets, showName); return layout.pages.length || 1 })()}</div>
                <button onClick={() => setPreviewPageIndex(previewPageIndex + 1)} disabled={(() => { const layout = calculateLayout({ paperSize, orientation, labelWmm, labelHmm, cols, rows, marginMm, gapMm }, finalAssets, showName); return previewPageIndex >= layout.pages.length - 1 })()} style={{ padding: '6px 10px', borderRadius: 6 }}>Next</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={showLabelBounds} onChange={(e) => setShowLabelBounds(e.target.checked)} />
                  <span style={{ fontSize: 13 }}>Show label bounds (debug)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>  )
}


