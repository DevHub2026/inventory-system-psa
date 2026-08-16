import { calculateLayout } from '../src/utils/qrLayout.ts'
import type { Asset } from '../src/types'

type QrLayoutSettings = {
  paperSize: string
  orientation: string
  labelWmm: number
  labelHmm: number
  labelMode: 'auto' | 'custom'
  cols: number
  rows: number | 'auto'
  marginMm: number
  gapMm: number
}

type RecordedResult = {
  name: string
  settings?: QrLayoutSettings
  assetsCount?: number
  perPage?: number
  expectedPages?: number
  actualPages?: number
  fits?: boolean
  lw?: number
  lh?: number
  maxQrMm?: number
  requestedQr?: number
  maxQrAvailable?: number
  layout?: ReturnType<typeof calculateLayout> | null
  positional?: { ok: boolean; errors?: string[] }
  summaryCount?: number
  matrixResults?: unknown[]
}

function makeAsset(id: number, name = `Asset ${id}`) {
  return { id, name, asset_number: `AST-${String(id).padStart(3,'0')}` } as Asset
}

async function run() {
  console.log('Running QR layout tests')

  const results: RecordedResult[] = []

  // helper to record
  function record(name: string, layout: ReturnType<typeof calculateLayout>, assetsCount: number, settings: QrLayoutSettings) {
    const perPage = layout.cols * layout.rows
    const expectedPages = Math.ceil(assetsCount / perPage)
    const actualPages = layout.pages.length
    const okPages = expectedPages === actualPages
    results.push({ name, settings, assetsCount, perPage, expectedPages, actualPages, fits: layout.fits, lw: layout.lw, lh: layout.lh, maxQrMm: layout.maxQrMm })
    console.log(`${name}: assets=${assetsCount}, pages=${actualPages}, perPage=${perPage}, fits=${layout.fits}`)
    if (!okPages) console.warn(`  WARNING: expectedPages=${expectedPages} != actualPages=${actualPages}`)
  }

  // Test 1: one asset
  const assets1 = [makeAsset(1)]
  const settingsDefault = { paperSize: 'A4', orientation: 'portrait', labelWmm: 70, labelHmm: 24, labelMode: 'auto', cols: 3, rows: 'auto', marginMm: 5, gapMm: 2 }
  const layout1 = calculateLayout(settingsDefault, assets1, true)
  record('Test 1 - one asset', layout1, 1, settingsDefault)

  // Test 2: three assets
  const assets3 = [1,2,3].map(i => makeAsset(i))
  const layout3 = calculateLayout(settingsDefault, assets3, true)
  record('Test 2 - three assets', layout3, 3, settingsDefault)

  // Test 3: 28 assets (4 columns auto rows)
  const assets28 = Array.from({length:28}, (_,i) => makeAsset(i+1))
  const settings28 = { ...settingsDefault, cols: 4 }
  const layout28 = calculateLayout(settings28, assets28, true)
  record('Test 3 - 28 assets', layout28, 28, settings28)

  // Test 4: column change effect on maxQrMm
  const assetsA = Array.from({length:6}, (_,i) => makeAsset(i+1))
  const lcols2 = calculateLayout({ ...settingsDefault, cols: 2 }, assetsA, true)
  const lcols3 = calculateLayout({ ...settingsDefault, cols: 3 }, assetsA, true)
  const lcols4 = calculateLayout({ ...settingsDefault, cols: 4 }, assetsA, true)
  record('Test 4 - cols2', lcols2, assetsA.length, { ...settingsDefault, cols: 2 })
  record('Test 4 - cols3', lcols3, assetsA.length, { ...settingsDefault, cols: 3 })
  record('Test 4 - cols4', lcols4, assetsA.length, { ...settingsDefault, cols: 4 })

  // Edge case: tiny margins (15mm), large gap
  const assets50 = Array.from({length:50}, (_,i) => makeAsset(i+1))
  const settingsEdge = { paperSize: 'A4', orientation: 'portrait', labelWmm: 30, labelHmm: 30, labelMode: 'auto', cols: 3, rows: 'auto', marginMm: 15, gapMm: 5 }
  const layoutEdge = calculateLayout(settingsEdge, assets50, true)
  record('Edge - tiny printable area', layoutEdge, assets50.length, settingsEdge)

  // Edge: custom large QR request 50mm and check maxQrMm
  const settingsLargeQr = { ...settingsDefault, cols: 2 }
  const layoutLargeQr = calculateLayout(settingsLargeQr, assetsA, true)
  const requestedQr = 50
  console.log('Large QR requested:', requestedQr, 'layout.maxQrMm=', layoutLargeQr.maxQrMm)
  results.push({ name: 'LargeQR', requestedQr, maxQrAvailable: layoutLargeQr.maxQrMm })

  // Many assets test (100)
  const assets100 = Array.from({length:100}, (_,i) => makeAsset(i+1))
  const settingsMany = { ...settingsDefault, cols: 4 }
  const layout100 = calculateLayout(settingsMany, assets100, true)
  record('Many - 100 assets', layout100, 100, settingsMany)

  // Detailed positional checks for each recorded result
  function positionalChecks(entry: RecordedResult) {
    const l = entry.layout
    if (!l) return { ok: true }
    const padding = 2
    const textReserve = 8
    const errors: string[] = []
    const perPageForEntry = entry.perPage ?? 0
    for (let p = 0; p < l.pages.length; p++) {
      for (let idx = 0; idx < perPageForEntry; idx++) {
        const r = Math.floor(idx / l.cols)
        const c = idx % l.cols
        const x = l.margin + c * (l.lw + l.gap)
        const y = l.margin + r * (l.lh + l.gap)
        // boundary checks
        if (x < l.margin - 1e-6) errors.push(`page${p} idx${idx} x < margin`)
        if (y < l.margin - 1e-6) errors.push(`page${p} idx${idx} y < margin`)
        if (x + l.lw > l.paperW - l.margin + 1e-6) errors.push(`page${p} idx${idx} x+lw > paperW-margin`)
        if (y + l.lh > l.paperH - l.margin + 1e-6) errors.push(`page${p} idx${idx} y+lh > paperH-margin`)
        // QR fit check
        const maxQrByWidth = Math.max(0, l.lw - padding * 2)
        const maxQrByHeight = Math.max(0, l.lh - padding * 2 - textReserve)
        if (l.maxQrMm - 1e-6 > Math.min(maxQrByWidth, maxQrByHeight)) errors.push(`page${p} idx${idx} maxQrMm exceeds available space`)
      }
    }
    return { ok: errors.length === 0, errors }
  }

  // Exhaustive matrix: columns 1..5, margins [2,5,10], gaps [0,2,5], rows auto/custom(3)
  const matrixResults: unknown[] = []
  const columnsList = [1,2,3,4,5]
  const margins = [2,5,10]
  const gaps = [0,2,5]
  const rowsOptions: Array<number|'auto'> = ['auto', 3]
  for (const colsN of columnsList) {
    for (const mg of margins) {
      for (const gp of gaps) {
        for (const rowsOpt of rowsOptions) {
          const s = { paperSize: 'A4', orientation: 'portrait', labelWmm: 70, labelHmm: 24, labelMode: 'auto', cols: colsN, rows: rowsOpt, marginMm: mg, gapMm: gp }
          const assets20 = Array.from({length:20}, (_,i)=> makeAsset(i+1))
          const l = calculateLayout(s, assets20, true)
          const perPage = l.cols * l.rows
          const pages = l.pages.length
          const maxQr = l.maxQrMm
          matrixResults.push({ cols: colsN, margin: mg, gap: gp, rows: rowsOpt, perPage, pages, fits: l.fits, lw: l.lw, lh: l.lh, maxQr })
        }
      }
    }
  }
  results.push({ name: 'matrix', summaryCount: matrixResults.length, matrixResults })

  // Attach layout to results for deeper checks
  for (const r of results) {
    // compute layout again for inclusion (to avoid serializing functions)
    try {
      const layout = calculateLayout(r.settings || { paperSize: 'A4', orientation: 'portrait', labelWmm: 70, labelHmm: 24, labelMode: 'auto', cols: 3, rows: 'auto', marginMm: 5, gapMm: 2 }, Array.from({ length: r.assetsCount || 0 }, (_,i)=> makeAsset(i+1)), true)
      r.layout = layout
      r.positional = positionalChecks(r)
    } catch (err) {
      r.layout = null
      r.positional = { ok: false, errors: [String(err)] }
    }
  }

  // write JSON report (node-only)
  try {
    const fs = await import('fs')
    const out = { timestamp: new Date().toISOString(), results }
    fs.writeFileSync('qr-layout-report.json', JSON.stringify(out, null, 2))
    console.log('Report written to qr-layout-report.json')
  } catch (err) {
    console.warn('Failed to write report:', err)
  }

  console.log('All tests complete')
}

run().catch(err => { console.error(err); process.exit(1) })
