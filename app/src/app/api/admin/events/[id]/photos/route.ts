import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, orgId: session.user.id } })
  if (!event) return Response.json({ error: 'Evento no encontrado' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null

  const photos = await prisma.photo.findMany({
    where: { eventId: id, ...(status ? { status } : {}) },
    orderBy: { uploadedAt: 'desc' },
  })

  return Response.json(photos)
}
