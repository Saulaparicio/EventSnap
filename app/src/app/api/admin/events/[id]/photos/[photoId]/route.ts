import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id, photoId } = await params
  const event = await prisma.event.findFirst({ where: { id, orgId: session.user.id } })
  if (!event) return Response.json({ error: 'Evento no encontrado' }, { status: 404 })

  const { status } = await request.json()
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return Response.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const photo = await prisma.photo.update({
    where: { id: photoId, eventId: id },
    data: { status },
  })

  return Response.json(photo)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id, photoId } = await params
  const event = await prisma.event.findFirst({ where: { id, orgId: session.user.id } })
  if (!event) return Response.json({ error: 'Evento no encontrado' }, { status: 404 })

  await prisma.photo.delete({ where: { id: photoId, eventId: id } })
  return Response.json({ success: true })
}
