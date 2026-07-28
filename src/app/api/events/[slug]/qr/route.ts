import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateQRBuffer } from '@/lib/qr'
import { getAppUrl } from '@/lib/utils'

// Public route to serve event QR code images for Live Slideshow & Guest views
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  })

  if (!event) {
    return new Response('Evento no encontrado', { status: 404 })
  }

  try {
    const appUrl = getAppUrl(req)
    const eventUrl = `${appUrl}/e/${event.slug}`
    const qrBuffer = await generateQRBuffer(eventUrl)

    return new Response(new Uint8Array(qrBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('Error generating public QR:', err)
    return new Response('Error al generar el código QR', { status: 500 })
  }
}
