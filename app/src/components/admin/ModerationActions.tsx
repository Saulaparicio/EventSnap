'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  photoId: string
  eventId: string
  currentStatus: string
}

export default function ModerationActions({ photoId, eventId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function moderate(status: 'approved' | 'rejected') {
    setLoading(true)
    const res = await fetch(`/api/admin/events/${eventId}/photos/${photoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    if (res.ok) {
      toast.success(status === 'approved' ? 'Foto aprobada' : 'Foto rechazada')
      router.refresh()
    }
  }

  if (currentStatus === 'approved') {
    return (
      <Button size="sm" variant="destructive" className="w-full text-xs h-7 rounded-md shadow-none" onClick={() => moderate('rejected')} disabled={loading}>
        Rechazar
      </Button>
    )
  }

  return (
    <Button size="sm" className="w-full text-xs h-7 rounded-md bg-[#0D9488] hover:bg-[#0D9488]/90 text-white shadow-none font-medium" onClick={() => moderate('approved')} disabled={loading}>
      Aprobar
    </Button>
  )
}
