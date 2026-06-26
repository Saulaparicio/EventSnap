import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      date: true,
      status: true,
      watermarkConfig: true,
      slideshowConfig: true,
      qrCodeUrl: true,
    },
  })

  if (!event || event.status === 'archived') {
    return Response.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  return Response.json(event)
}
