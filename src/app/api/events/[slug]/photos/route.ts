import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { uploadFile } from '@/lib/storage'
import { applyWatermark, createThumbnail } from '@/lib/watermark'
import type { WatermarkConfig } from '@/lib/watermark'
import sharp from 'sharp'

// Rate limit: simple in-memory (para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return true
  }
  if (entry.count >= 30) return false
  entry.count++
  return true
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return Response.json({ error: 'Demasiadas fotos. Espera 10 minutos.' }, { status: 429 })
    }

    const { slug } = await params
    const event = await prisma.event.findUnique({
      where: { slug },
      select: { id: true, status: true, watermarkConfig: true, slideshowConfig: true },
    })

    if (!event || event.status === 'closed' || event.status === 'archived') {
      return Response.json({ error: 'Evento no disponible' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('photo') as File | null
    if (!file) return Response.json({ error: 'No se recibió foto' }, { status: 400 })

    const maxSize = 15 * 1024 * 1024 // 15MB
    if (file.size > maxSize) {
      return Response.json({ error: 'Foto demasiado grande (máx 15MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const meta = await sharp(buffer).metadata()

    const timestamp = Date.now()
    const originalKey = `events/${event.id}/originals/${timestamp}.webp`
    const watermarkedKey = `events/${event.id}/watermarked/${timestamp}.webp`
    const thumbnailKey = `events/${event.id}/thumbnails/${timestamp}.webp`

    const originalUrl = await uploadFile(originalKey, buffer, 'image/webp')

    const config = event.watermarkConfig as WatermarkConfig
    const watermarkedBuffer = await applyWatermark(buffer, config)
    const thumbnailBuffer = await createThumbnail(buffer)

    const [watermarkedUrl, thumbnailUrl] = await Promise.all([
      uploadFile(watermarkedKey, watermarkedBuffer, 'image/webp'),
      uploadFile(thumbnailKey, thumbnailBuffer, 'image/webp'),
    ])

    const slideshowCfg = event.slideshowConfig as { auto_approve?: boolean }
    const autoApprove = slideshowCfg?.auto_approve === true

    const photo = await prisma.photo.create({
      data: {
        eventId: event.id,
        originalUrl,
        watermarkedUrl,
        thumbnailUrl,
        status: autoApprove ? 'approved' : 'pending',
        fileSize: file.size,
        width: meta.width,
        height: meta.height,
      },
    })

    return Response.json({
      id: photo.id,
      watermarkedUrl: photo.watermarkedUrl,
      status: photo.status,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in photo upload route:', error)
    return Response.json(
      { error: error?.message || 'Error al procesar y subir la foto' },
      { status: 500 }
    )
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const event = await prisma.event.findUnique({ where: { slug }, select: { id: true } })
  if (!event) return Response.json({ error: 'Evento no encontrado' }, { status: 404 })

  const photos = await prisma.photo.findMany({
    where: { eventId: event.id, status: 'approved' },
    orderBy: { uploadedAt: 'asc' },
    select: { id: true, watermarkedUrl: true, thumbnailUrl: true, uploadedAt: true },
  })

  return Response.json(photos)
}
