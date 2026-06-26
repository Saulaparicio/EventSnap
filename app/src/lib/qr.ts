import QRCode from 'qrcode'

export async function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  })
}

export async function generateQRBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { width: 400, margin: 2 })
}
