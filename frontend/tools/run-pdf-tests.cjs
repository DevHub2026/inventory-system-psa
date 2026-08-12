// Puppeteer test harness (CommonJS) to generate QR sheet PDFs using the shared layout logic
// Saves PDFs to frontend/test-output/

const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

async function run() {
  const outDir = path.join(__dirname, '..', 'test-output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()

  await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>')
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js' })

  const pdfBase64 = await page.evaluate(async () => {
    function mmToPx(mm, dpi = 600) { return Math.round((mm / 25.4) * dpi) }
    function calculateLayout(settings, assetsList) {
      const { paperSize, orientation, labelWmm: lw, labelHmm: lh, cols: colsN, rows: rowsSetting, marginMm: mg, gapMm: gp } = settings
      const paper = (paperSize === 'A4') ? [210, 297] : (paperSize === 'Letter') ? [215.9, 279.4] : (paperSize === 'A5') ? [148, 210] : [210, 297]
      const paperW = orientation === 'landscape' ? paper[1] : paper[0]
      const paperH = orientation === 'landscape' ? paper[0] : paper[1]
      let rowsN
      if (rowsSetting === 'auto') rowsN = Math.max(1, Math.floor((paperH - 2*mg + gp) / (lh + gp)))
      else rowsN = rowsSetting
      const totalWidthNeeded = colsN * lw + (colsN - 1) * gp + 2 * mg
      const totalHeightNeeded = rowsN * lh + (rowsN - 1) * gp + 2 * mg
      let fits = true
      let warning = null
      if (totalWidthNeeded > paperW + 0.0001) { fits = false; warning = `Required width ${totalWidthNeeded}mm exceeds paper width ${paperW}mm` }
      if (totalHeightNeeded > paperH + 0.0001) { fits = false; warning = (warning ? warning + '; ' : '') + `Required height ${totalHeightNeeded}mm exceeds paper height ${paperH}mm` }
      const perPage = colsN * rowsN
      const pages = []
      for (let i = 0; i < assetsList.length; i += perPage) pages.push(assetsList.slice(i, i + perPage))
      return { paperW, paperH, lw, lh, cols: colsN, rows: rowsN, margin: mg, gap: gp, pages, fits, warning }
    }

    function generateQrSvgPlaceholder(payload, sizePx) {
      const s = sizePx
      return `<?xml version="1.0"?><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${s}\" height=\"${s}\" viewBox=\"0 0 ${s} ${s}\"><rect width=\"100%\" height=\"100%\" fill=\"#000\"/></svg>`
    }

    function renderSvgToPngDataUrl(svg, mmWidth, mmHeight, dpi = 600) {
      return new Promise((resolve, reject) => {
        try {
          const pxW = Math.round((mmWidth / 25.4) * dpi)
          const pxH = Math.round((mmHeight / 25.4) * dpi)
          const img = new Image()
          const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              canvas.width = pxW
              canvas.height = pxH
              const ctx = canvas.getContext('2d')
              ctx.fillStyle = '#fff'
              ctx.fillRect(0,0,canvas.width,canvas.height)
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
              const dataUrl = canvas.toDataURL('image/png')
              URL.revokeObjectURL(url)
              resolve(dataUrl)
            } catch (e) { URL.revokeObjectURL(url); reject(e) }
          }
          img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load SVG into image')) }
          img.src = url
        } catch (e) { reject(e) }
      })
    }

    const settings = { paperSize: 'A4', orientation: 'portrait', labelWmm: 70, labelHmm: 24, cols: 2, rows: 'auto', marginMm: 2, gapMm: 0 }
    const assets = []
    for (let i = 1; i <= 28; i++) {
      assets.push({ id: i, asset_number: `INV-20260811-A${String(i).padStart(2,'0')}`, name: `Sample Item With A Potentially Long Name #${i} - ALTO PROFESSIONAL TS312 SPEAKER (TWO)`, psa_qr_payload: `INV-${i}` })
    }

    const layout = calculateLayout(settings, assets)
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ unit: 'mm', format: [layout.paperW, layout.paperH], orientation: 'portrait' })
    const DPI = 600

    function splitLines(text, maxCharsPerLine = 28) {
      const words = text.split(/\s+/)
      const lines = []
      let cur = ''
      for (const w of words) {
        const cand = cur ? (cur + ' ' + w) : w
        if (cand.length <= maxCharsPerLine) cur = cand
        else { if (cur) lines.push(cur); cur = w }
      }
      if (cur) lines.push(cur)
      return lines
    }

    for (let p = 0; p < layout.pages.length; p++) {
      const pageAssets = layout.pages[p]
      for (let r = 0; r < layout.rows; r++) {
        for (let c = 0; c < layout.cols; c++) {
          const idx = r * layout.cols + c
          const a = pageAssets[idx]
          if (!a) continue
          const x = layout.margin + c * (layout.lw + layout.gap)
          const y = layout.margin + r * (layout.lh + layout.gap)
          const qrSvg = generateQrSvgPlaceholder(a.psa_qr_payload, mmToPx(30, DPI))
          const qrDataUrl = await renderSvgToPngDataUrl(qrSvg, 30, 30, DPI)
          doc.addImage(qrDataUrl, 'PNG', x, y, 30, 30)
          const nameLines = splitLines(a.name, 28)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          for (let i = 0; i < nameLines.length; i++) {
            const line = nameLines[i]
            const lineX = x + layout.lw / 2
            const lineY = y + 30 + 1 + i * 4.5
            doc.text(line, lineX, lineY, { align: 'center' })
          }
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          const metaY = y + 30 + 1 + nameLines.length * 4.5 + 3
          doc.text(String(a.asset_number), x + layout.lw / 2, metaY, { align: 'center' })
        }
      }
      if (p < layout.pages.length - 1) doc.addPage([layout.paperW, layout.paperH], 'portrait')
    }

    const blob = doc.output('arraybuffer')
    const u8 = new Uint8Array(blob)
    const b64 = btoa(String.fromCharCode.apply(null, Array.from(u8)))
    return b64
  })

  const outPath = path.join(__dirname, '..', 'test-output', `psa-qr-sheet-sample-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`)
  fs.writeFileSync(outPath, Buffer.from(pdfBase64, 'base64'))
  console.log('Saved sample PDF to', outPath)

  await browser.close()
}

run().catch(err => { console.error(err); process.exit(1) })
