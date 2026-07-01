import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import CameraUpload from '@/components/camera/CameraUpload'

export default async function GuestPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true, name: true, status: true, date: true },
  })

  if (!event || event.status === 'archived') notFound()

  if (event.status === 'closed') {
    return (
      <main className="flex items-center justify-center min-h-screen p-6 text-center bg-[#fcf8fa] text-[#1b1b1d]">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">Este evento ya cerró. Gracias por participar.</p>
        </div>
      </main>
    )
  }

  return (
    <CameraUpload slug={slug} eventName={event.name} eventDate={event.date} />
  )
}
