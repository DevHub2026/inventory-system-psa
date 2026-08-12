declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>
  export function toCanvas(canvas: any, text: string, options?: any): Promise<any>
  const _default: any
  export default _default
}
