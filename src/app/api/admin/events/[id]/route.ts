import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAppUrl } from '@/lib/utils'
import { generateQRDataUrl } from '@/lib/qr'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findFirst({
    where: { id, orgId: session.user.id },
    include: { _count: { select: { photos: true } } },
  })

  if (!event) return Response.json({ error: 'Evento no encontrado' }, { status: 404 })
  return Response.json(event)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const event = await prisma.event.findFirst({ where: { id, orgId: session.user.id } })
  if (!event) return Response.json({ error: 'Evento no encontrado' }, { status: 404 })

  const baseUrl = getAppUrl(request)
  const eventUrl = `${baseUrl}/e/${event.slug}`
  const freshQrCodeUrl = await generateQRDataUrl(eventUrl)

  const updated = await prisma.event.update({
    where: { id },
    data: {
      name: body.name,
      date: body.date ? new Date(body.date) : undefined,
      status: body.status,
      watermarkConfig: body.watermarkConfig,
      slideshowConfig: body.slideshowConfig,
      qrCodeUrl: freshQrCodeUrl,
    },
  })

  return Response.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, orgId: session.user.id } })
  if (!event) return Response.json({ error: 'Evento no encontrado' }, { status: 404 })

  await prisma.event.delete({ where: { id } })
  return Response.json({ success: true })
}
