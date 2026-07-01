import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import GuestHelpCenter from '@/components/help/GuestHelpCenter'

export default async function GuestHelpPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await prisma.event.findUnique({
    where: { slug },
  })

  if (!event || event.status === 'archived') notFound()

  const eventDetails = {
    name: event.name,
    slug: event.slug,
  }

  return (
    <GuestHelpCenter event={eventDetails} />
  )
}
