import type { Asset } from '@/types'

export interface LayoutResult {
  paperW: number
  paperH: number
  usableW: number
  usableH: number
  lw: number
  lh: number
  cols: number
  rows: number
  margin: number
  gap: number
  pages: Asset[][]
  fits: boolean
  warning: string | null
  maxQrMm: number
}

// Shared layout calculation (mm-based) — single source of truth for preview and exports
export function calculateLayout(settings: { paperSize: string, orientation: string, labelWmm: number, labelHmm: number, labelMode?: 'auto'|'custom', cols: number, rows: number | 'auto', marginMm: number, gapMm: number }, assetsList: Asset[] = [], showText = true): LayoutResult {
  const { paperSize, orientation, labelWmm: lwSetting, labelHmm: lhSetting, labelMode: lModeSetting, cols: colsN, rows: rowsSetting, marginMm: mg, gapMm: gp } = settings
  const lMode = (typeof lModeSetting !== 'undefined') ? lModeSetting : 'auto'
  const paper = (paperSize === 'A4') ? [210, 297] : (paperSize === 'Letter') ? [215.9, 279.4] : (paperSize === 'A5') ? [148, 210] : [210, 297]
  const paperW = orientation === 'landscape' ? paper[1] : paper[0]
  const paperH = orientation === 'landscape' ? paper[0] : paper[1]

  const usableW = Math.max(0, paperW - 2 * mg)
  const usableH = Math.max(0, paperH - 2 * mg)

  // compute columns/label width
  const colsEffective = Math.max(1, colsN)
  let lw = lwSetting
  if (lMode === 'auto') {
    lw = (usableW - (colsEffective - 1) * gp) / colsEffective
  }

  // padding and text reserve (used to determine reasonable rows and QR sizes)
  const padding = Math.max(0, 2) // mm padding default
  const textReserve = showText ? 8 : 2 // reserve mm vertically for text area when text is enabled

  // compute rows if auto
  let rowsN: number
  const minLabelHmm = 10
  if (rowsSetting === 'auto') {
    // choose max rows such that label height is at least minLabelHmm AND can reasonably fit a minimal QR
    const assumedMinQr = 15 // mm - conservative minimum QR for auto rows calculation
    const requiredHeightPerLabel = Math.max(minLabelHmm, (assumedMinQr + 2 * padding + textReserve))
    const maxPossibleRows = Math.max(1, Math.floor((usableH + gp) / (requiredHeightPerLabel + gp)))
    rowsN = maxPossibleRows
  } else {
    rowsN = Math.max(1, rowsSetting as number)
  }

  // compute label height
  let lh = lhSetting
  if (lMode === 'auto') {
    lh = (usableH - (rowsN - 1) * gp) / rowsN
  }

  // after computing lw/lh and rows, verify fit
  const totalWidthNeeded = colsEffective * lw + (colsEffective - 1) * gp + 2 * mg
  const totalHeightNeeded = rowsN * lh + (rowsN - 1) * gp + 2 * mg
  let fits = true
  let warning: string | null = null
  if (totalWidthNeeded > paperW + 0.0001) {
    fits = false
    warning = `Required width ${totalWidthNeeded.toFixed(2)}mm exceeds paper width ${paperW}mm`
  }
  if (totalHeightNeeded > paperH + 0.0001) {
    fits = false
    warning = (warning ? warning + '; ' : '') + `Required height ${totalHeightNeeded.toFixed(2)}mm exceeds paper height ${paperH}mm`
  }

  // compute a conservative maximum QR size (mm) that will fit inside label leaving space for text/padding
  const maxQrByWidth = Math.max(0, lw - padding * 2)
  const maxQrByHeight = Math.max(0, lh - padding * 2 - textReserve)
  const maxQrMm = Math.max(0, Math.min(maxQrByWidth, maxQrByHeight))

  // paginate assets deterministically
  const perPage = Math.max(1, colsEffective * rowsN)
  const pages: Asset[][] = []
  for (let i = 0; i < assetsList.length; i += perPage) pages.push(assetsList.slice(i, i + perPage))

  return { paperW, paperH, usableW, usableH, lw, lh, cols: colsEffective, rows: rowsN, margin: mg, gap: gp, pages, fits, warning, maxQrMm }
}
