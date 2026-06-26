'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        date: fd.get('date'),
        watermarkConfig: {
          text: fd.get('watermarkText') || undefined,
          text_position: 'bottom-center',
          text_color: '#FFFFFF',
          text_size: 28,
          background_bar: true,
          background_opacity: 0.4,
        },
        slideshowConfig: {
          speed: 5,
          order: 'chronological',
          transition: 'fade',
          auto_approve: fd.get('autoApprove') === 'on',
        },
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Error al crear el evento')
    } else {
      const event = await res.json()
      toast.success('Evento creado')
      router.push(`/events/${event.id}`)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nombre del evento *</Label>
              <Input id="name" name="name" placeholder="Boda de Ana & Carlos" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="watermarkText">Texto del watermark</Label>
              <Input
                id="watermarkText"
                name="watermarkText"
                placeholder="Boda de Ana & Carlos · 21.06.2026"
              />
              <p className="text-xs text-muted-foreground">Se mostrará en la parte inferior de cada foto</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="autoApprove" name="autoApprove" className="rounded" />
              <Label htmlFor="autoApprove">Aprobar fotos automáticamente</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear evento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
