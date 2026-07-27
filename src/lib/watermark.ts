import sharp, { type OverlayOptions } from 'sharp'
import { toBuffer } from '@/lib/utils'

export interface WatermarkConfig {
  logo_url?: string
  logo_position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  logo_size?: number       // % del ancho de la foto
  logo_opacity?: number
  text?: string
  text_position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center'
  text_color?: string
  text_size?: number
  background_bar?: boolean
  background_opacity?: number
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  return toBuffer(await res.arrayBuffer())
}

export async function applyWatermark(
  imageBuffer: Buffer,
  config: WatermarkConfig
): Promise<Buffer> {
  let image = sharp(imageBuffer)
  const meta = await image.metadata()
  const width = meta.width ?? 1200
  const height = meta.height ?? 800

  const composites: OverlayOptions[] = []

  // Logo watermark
  if (config.logo_url) {
    const logoBuffer = await fetchBuffer(config.logo_url)
    const logoWidth = Math.floor(width * ((config.logo_size ?? 15) / 100))
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoWidth)
      .toBuffer()

    const opacity = config.logo_opacity ?? 0.8
    const logoMeta = await sharp(resizedLogo).metadata()
    const lh = logoMeta.height ?? logoWidth
    const margin = 20

    let gravity = 'southeast'
    let left: number | undefined
    let top: number | undefined

    switch (config.logo_position ?? 'bottom-right') {
      case 'top-left':
        left = margin; top = margin; break
      case 'top-right':
        left = width - logoWidth - margin; top = margin; break
      case 'bottom-left':
        left = margin; top = height - lh - margin; break
      case 'bottom-right':
        left = width - logoWidth - margin; top = height - lh - margin; break
      case 'center':
        left = Math.floor((width - logoWidth) / 2)
        top = Math.floor((height - lh) / 2)
        break
    }

    // Apply opacity via modulate/ensureAlpha
    const opacityLogo = await sharp(resizedLogo)
      .ensureAlpha()
      .composite([{
        input: Buffer.alloc(logoWidth * lh * 4, Math.floor(opacity * 255)),
        raw: { width: logoWidth, height: lh, channels: 4 },
        blend: 'dest-in',
      }])
      .toBuffer()

    composites.push({ input: opacityLogo, left, top, blend: 'over' })
  }

  // Text watermark
  if (config.text) {
    const textSize = config.text_size ?? 28
    const color = config.text_color ?? '#FFFFFF'
    const text = config.text

    const svgText = `
      <svg width="${width}" height="${textSize + 20}">
        ${config.background_bar ? `<rect width="${width}" height="${textSize + 20}" fill="rgba(0,0,0,${config.background_opacity ?? 0.4})"/>` : ''}
        <text
          x="50%"
          y="${textSize}"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="${textSize}"
          fill="${color}"
        >${text}</text>
      </svg>`

    const textBuffer = Buffer.from(svgText)
    const barHeight = textSize + 20

    let top: number
    switch (config.text_position ?? 'bottom-center') {
      case 'top-center':
        top = 0; break
      case 'bottom-left':
      case 'bottom-right':
      case 'bottom-center':
      default:
        top = height - barHeight; break
    }

    composites.push({ input: textBuffer, top, left: 0 })
  }

  if (composites.length === 0) {
    return imageBuffer
  }

  return image.composite(composites).webp({ quality: 85 }).toBuffer()
}

export async function createThumbnail(imageBuffer: Buffer, size = 400): Promise<Buffer> {
  return sharp(imageBuffer).resize(size, size, { fit: 'cover' }).webp({ quality: 70 }).toBuffer()
}
