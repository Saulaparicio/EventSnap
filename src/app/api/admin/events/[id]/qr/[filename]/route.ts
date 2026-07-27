import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateQRBuffer } from '@/lib/qr'

// This route handles: /api/admin/events/[id]/qr/[filename]
// e.g. /api/admin/events/abc123/qr/qr-mi-evento.png
// Chrome uses the URL's last segment as the filename — guaranteed.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('No autorizado', { status: 401 })
  }

  const { id } = await params
  const event = await prisma.event.findFirst({
    where: { id, orgId: session.user.id },
  })

  if (!event) {
    return new Response('Evento no encontrado', { status: 404 })
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const eventUrl = `${appUrl}/e/${event.slug}`
    const qrBuffer = await generateQRBuffer(eventUrl)

    return new Response(new Uint8Array(qrBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr-${event.slug}.png"`,
        'Content-Length': qrBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Error generating QR:', err)
    return new Response('Error al generar el código QR', { status: 500 })
  }
}
