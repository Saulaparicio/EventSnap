import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, orgId: session.user.id } })
  if (!event) return Response.json({ error: 'Evento no encontrado' }, { status: 404 })

  const [total, approved, pending, rejected] = await Promise.all([
    prisma.photo.count({ where: { eventId: id } }),
    prisma.photo.count({ where: { eventId: id, status: 'approved' } }),
    prisma.photo.count({ where: { eventId: id, status: 'pending' } }),
    prisma.photo.count({ where: { eventId: id, status: 'rejected' } }),
  ])

  // Photos per hour (last 24h)
  const photos = await prisma.photo.findMany({
    where: { eventId: id, uploadedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    select: { uploadedAt: true },
  })

  const perHour: Record<number, number> = {}
  for (const p of photos) {
    const h = p.uploadedAt.getHours()
    perHour[h] = (perHour[h] ?? 0) + 1
  }

  return Response.json({ total, approved, pending, rejected, perHour })
}
