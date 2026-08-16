declare module 'qrcode' {
  export interface QRCodeOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    margin?: number
    width?: number
    color?: {
      dark?: string
      light?: string
    }
    [key: string]: unknown
  }

  export function toDataURL(text: string, options?: QRCodeOptions): Promise<string>
  export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeOptions): Promise<HTMLCanvasElement>
  const _default: {
    toDataURL: typeof toDataURL
    toCanvas: typeof toCanvas
  }
  export default _default
}
