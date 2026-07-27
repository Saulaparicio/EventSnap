import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uniqueSlug } from '@/lib/slug'
import { generateQRDataUrl } from '@/lib/qr'
import { getAppUrl } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const events = await prisma.event.findMany({
    where: { orgId: session.user.id },
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(events)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { name, date, watermarkConfig, slideshowConfig } = body

  if (!name || !date) {
    return Response.json({ error: 'Nombre y fecha son requeridos' }, { status: 400 })
  }

  const slug = await uniqueSlug(name)
  const baseUrl = getAppUrl(request)
  const eventUrl = `${baseUrl}/e/${slug}`
  const qrCodeUrl = await generateQRDataUrl(eventUrl)

  const event = await prisma.event.create({
    data: {
      orgId: session.user.id,
      name,
      slug,
      date: new Date(date),
      watermarkConfig: watermarkConfig ?? {},
      slideshowConfig: slideshowConfig ?? { speed: 5, order: 'chronological', transition: 'fade' },
      qrCodeUrl,
    },
  })

  return Response.json(event, { status: 201 })
}
