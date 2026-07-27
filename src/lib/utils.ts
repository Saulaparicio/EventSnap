import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Fecha no disponible'
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return 'Fecha no disponible'
  }
}

export function getAppUrl(req?: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('192.168.')) {
    return envUrl.replace(/\/$/, '')
  }
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
    const proto = req.headers.get('x-forwarded-proto') || (host && !host.includes('localhost') ? 'https' : 'http')
    if (host) {
      return `${proto}://${host}`
    }
  }
  return envUrl ? envUrl.replace(/\/$/, '') : 'http://localhost:3000'
}

export function toBuffer(input: any): Buffer {
  let bytes: Uint8Array
  if (input instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && input instanceof SharedArrayBuffer)) {
    bytes = new Uint8Array(input)
  } else if (ArrayBuffer.isView(input)) {
    bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
  } else {
    bytes = new Uint8Array(input)
  }

  const standaloneArrayBuffer = new ArrayBuffer(bytes.byteLength)
  const uint8 = new Uint8Array(standaloneArrayBuffer)
  uint8.set(bytes)
  return Buffer.from(standaloneArrayBuffer)
}
