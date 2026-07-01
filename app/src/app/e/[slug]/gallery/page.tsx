import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import GuestPublicGallery from '@/components/gallery/GuestPublicGallery'

export default async function GuestGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      photos: {
        where: { status: 'approved' },
        orderBy: { uploadedAt: 'desc' },
      },
    },
  })

  if (!event || event.status === 'archived') notFound()

  const eventDetails = {
    name: event.name,
    slug: event.slug,
    date: event.date.toISOString(),
  }

  const photos = event.photos.map((p) => ({
    id: p.id,
    watermarkedUrl: p.watermarkedUrl,
    thumbnailUrl: p.thumbnailUrl,
    originalUrl: p.originalUrl,
    uploadedAt: p.uploadedAt.toISOString(),
  }))

  return (
    <GuestPublicGallery event={eventDetails} photos={photos} />
  )
}
