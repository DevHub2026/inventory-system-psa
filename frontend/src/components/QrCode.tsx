import { useMemo } from 'react'
import { BrowserQRCodeSvgWriter } from '@zxing/browser'
import { cn } from '@/utils/cn'

interface QrCodeProps {
  value: string
  size?: number
  className?: string
}

export function QrCode({ value, size = 192, className }: QrCodeProps) {
  const svgMarkup = useMemo(() => {
    try {
      const writer = new BrowserQRCodeSvgWriter()
      const svg = writer.write(value, size, size)
      svg.setAttribute('role', 'img')
      svg.setAttribute('aria-label', `QR code for ${value}`)

      return svg.outerHTML
    } catch {
      return null
    }
  }, [value, size])

  if (!svgMarkup) {
    return (
      <div className={cn('flex items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-600', className)} style={{ width: size, height: size }}>
        Unable to generate QR code.
      </div>
    )
  }

  return (
    <div
      className={cn('inline-flex items-center justify-center bg-white text-gray-950', className)}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  )
}
