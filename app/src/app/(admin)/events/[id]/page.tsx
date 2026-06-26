import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import ModerationActions from '@/components/admin/ModerationActions'
import type { Photo } from '@prisma/client'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const event = await prisma.event.findFirst({
    where: { id, orgId: session!.user!.id! },
    include: { photos: { orderBy: { uploadedAt: 'desc' }, take: 50 } },
  })

  if (!event) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const eventUrl = `${appUrl}/e/${event.slug}`

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">{formatDate(event.date)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/live/${event.slug}`} target="_blank" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            📺 Abrir slideshow
          </Link>
          <Link href={eventUrl} target="_blank" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            🔗 Link QR
          </Link>
        </div>
      </div>

      {/* QR Code */}
      {event.qrCodeUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Código QR del evento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <Image src={event.qrCodeUrl} alt="QR" width={200} height={200} />
            <p className="text-sm text-muted-foreground break-all">{eventUrl}</p>
            <a href={event.qrCodeUrl} download={`qr-${event.slug}.png`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Descargar QR
            </a>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      <div>
        <h2 className="font-semibold mb-3">Fotos ({event.photos.length})</h2>
        {event.photos.length === 0 ? (
          <div className="border rounded-xl p-8 text-center text-muted-foreground">
            Aún no hay fotos. Comparte el QR con tus invitados.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {event.photos.map((photo: Photo) => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden border">
                <Image
                  src={photo.thumbnailUrl ?? photo.watermarkedUrl ?? photo.originalUrl}
                  alt="foto"
                  width={300}
                  height={300}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge
                    variant={
                      photo.status === 'approved'
                        ? 'default'
                        : photo.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="text-xs mb-1"
                  >
                    {photo.status === 'approved' ? 'Aprobada' : photo.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                  </Badge>
                  <ModerationActions photoId={photo.id} eventId={event.id} currentStatus={photo.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
