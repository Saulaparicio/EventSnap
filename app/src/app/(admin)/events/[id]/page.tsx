import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import EventGalleryManager from '@/components/admin/EventGalleryManager'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const event = await prisma.event.findFirst({
    where: { id, orgId: session!.user!.id! },
    include: { 
      photos: { 
        orderBy: { uploadedAt: 'desc' }
      } 
    },
  })

  if (!event) notFound()

  // Format details for the manager component
  const eventDetails = {
    id: event.id,
    name: event.name,
    slug: event.slug,
    date: (() => { try { return event.date.toISOString() } catch { return new Date().toISOString() } })(),
    status: event.status as 'active' | 'closed' | 'archived',
    qrCodeUrl: event.qrCodeUrl,
  }

  const initialPhotos = event.photos.map((p) => ({
    id: p.id,
    originalUrl: p.originalUrl,
    watermarkedUrl: p.watermarkedUrl,
    thumbnailUrl: p.thumbnailUrl,
    status: p.status as 'pending' | 'approved' | 'rejected',
    uploadedAt: p.uploadedAt.toISOString(),
    fileSize: p.fileSize,
  }))

  return (
    <EventGalleryManager 
      event={eventDetails} 
      initialPhotos={initialPhotos} 
    />
  )
}
