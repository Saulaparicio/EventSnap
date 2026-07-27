import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import Slideshow from '@/components/slideshow/Slideshow'

export default async function LivePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      status: true,
      slideshowConfig: true,
      qrCodeUrl: true,
      photos: {
        where: { status: 'approved' },
        orderBy: { uploadedAt: 'asc' },
        select: { id: true, watermarkedUrl: true, uploadedAt: true },
      },
    },
  })

  if (!event) notFound()

  type RawPhoto = { id: string; watermarkedUrl: string | null; uploadedAt: Date }

  return (
    <Slideshow
      eventId={event.id}
      eventName={event.name}
      slug={slug}
      initialPhotos={event.photos.map((p: RawPhoto) => ({
        id: p.id,
        url: p.watermarkedUrl ?? '',
        uploadedAt: p.uploadedAt.toISOString(),
      }))}
      config={event.slideshowConfig as { speed?: number; order?: string; transition?: string }}
      qrCodeUrl={event.qrCodeUrl ?? null}
    />
  )
}
