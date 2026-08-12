// Node-only test harness using jsPDF to generate sample multi-page PDFs
// Does not rasterize QR, but validates pagination, page sizes, and text placement

const fs = require('fs')
const path = require('path')
const { jsPDF } = require('jspdf')

function calculateLayout(settings, assetsList) {
  const { paperSize, orientation, labelWmm: lw, labelHmm: lh, cols: colsN, rows: rowsSetting, marginMm: mg, gapMm: gp } = settings
  const paper = (paperSize === 'A4') ? [210, 297] : (paperSize === 'Letter') ? [215.9, 279.4] : (paperSize === 'A5') ? [148, 210] : [210, 297]
  const paperW = orientation === 'landscape' ? paper[1] : paper[0]
  const paperH = orientation === 'landscape' ? paper[0] : paper[1]
  let rowsN
  if (rowsSetting === 'auto') rowsN = Math.max(1, Math.floor((paperH - 2*mg + gp) / (lh + gp)))
  else rowsN = rowsSetting
  const perPage = colsN * rowsN
  const pages = []
  for (let i = 0; i < assetsList.length; i += perPage) pages.push(assetsList.slice(i, i + perPage))
  return { paperW, paperH, lw, lh, cols: colsN, rows: rowsN, margin: mg, gap: gp, pages }
}

function run() {
  const outDir = path.join(__dirname, '..', 'test-output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const settings = { paperSize: 'A4', orientation: 'portrait', labelWmm: 70, labelHmm: 24, cols: 2, rows: 'auto', marginMm: 2, gapMm: 0 }
  const assets = []
  for (let i = 1; i <= 28; i++) assets.push({ id: i, asset_number: `INV-20260811-A${String(i).padStart(2,'0')}`, name: `Sample Item With Long Name #${i}` })
  const layout = calculateLayout(settings, assets)

  const doc = new jsPDF({ unit: 'mm', format: [layout.paperW, layout.paperH], orientation: 'portrait' })
  for (let p = 0; p < layout.pages.length; p++) {
    const pageAssets = layout.pages[p]
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        const idx = r * layout.cols + c
        const a = pageAssets[idx]
        if (!a) continue
        const x = layout.margin + c * (layout.lw + layout.gap)
        const y = layout.margin + r * (layout.lh + layout.gap)
        // Draw a placeholder rectangle where the label would be
        doc.setDrawColor(220,220,220)
        doc.rect(x, y, layout.lw, layout.lh)
        // Add asset number and name
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text(a.asset_number, x + 2, y + 8)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text(a.name, x + 2, y + 14, { maxWidth: layout.lw - 4 })
      }
    }
    if (p < layout.pages.length - 1) doc.addPage([layout.paperW, layout.paperH], 'portrait')
  }

  const outPath = path.join(outDir, `psa-qr-sheet-node-sample-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`)
  const arr = doc.output('arraybuffer')
  fs.writeFileSync(outPath, Buffer.from(arr))
  console.log('Saved node-generated sample PDF to', outPath)
}

run()
