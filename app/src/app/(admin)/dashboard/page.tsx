import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, cn } from '@/lib/utils'
import type { EventStatus } from '@prisma/client'

export default async function DashboardPage() {
  const session = await auth()
  const events = await prisma.event.findMany({
    where: { orgId: session!.user!.id! },
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis eventos</h1>
          <p className="text-muted-foreground">Hola, {session!.user!.name}</p>
        </div>
        <Link href="/events/new" className={cn(buttonVariants())}>
          + Nuevo evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="border rounded-xl p-12 text-center space-y-3">
          <p className="text-lg font-medium">Aún no tienes eventos</p>
          <p className="text-muted-foreground">Crea tu primer evento y genera el QR para tus invitados.</p>
          <Link href="/events/new" className={cn(buttonVariants(), 'mt-2')}>
            Crear primer evento
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                    {statusLabel(event.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>📅 {formatDate(event.date)}</p>
                    <p>📸 {event._count.photos} fotos</p>
                    <p>🔗 /e/{event.slug}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/events/${event.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                      Gestionar
                    </Link>
                    <Link href={`/live/${event.slug}`} target="_blank" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                      Ver slideshow
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function statusLabel(status: EventStatus) {
  if (status === 'active') return 'Activo'
  if (status === 'closed') return 'Cerrado'
  return 'Archivado'
}
