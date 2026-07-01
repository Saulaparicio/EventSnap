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
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al subir el logo')
      } else {
        setLogoUrl(data.url)
        toast.success('Logo subido con éxito')
      }
    } catch {
      toast.error('Error de red al subir el logo')
    } finally {
      setUploadingLogo(false)
    }
  }

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
          logo_url: logoUrl || undefined,
          logo_position: 'bottom-right',
          logo_size: 15,
          logo_opacity: 0.8,
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
      <Card className="shadow-none border border-border bg-white rounded-xl">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg font-medium text-primary tracking-tight">Nuevo evento</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-medium text-primary">Nombre del evento *</Label>
              <Input id="name" name="name" placeholder="Boda de Ana & Carlos" required className="rounded-md border-border focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs font-medium text-primary">Fecha *</Label>
              <Input id="date" name="date" type="date" required className="rounded-md border-border focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="watermarkText" className="text-xs font-medium text-primary">Texto del watermark</Label>
              <Input
                id="watermarkText"
                name="watermarkText"
                placeholder="Boda de Ana & Carlos · 21.06.2026"
                className="rounded-md border-border focus:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground leading-normal">Se mostrará en la parte inferior de cada foto</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="logoFile" className="text-xs font-medium text-primary">Logo del watermark (opcional)</Label>
              <Input
                id="logoFile"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="rounded-md border-border focus:ring-ring file:text-xs file:font-medium"
              />
              {uploadingLogo && <p className="text-xs text-muted-foreground animate-pulse">Subiendo logo...</p>}
              {logoUrl && (
                <div className="mt-2 relative w-32 h-16 border border-border rounded-lg bg-neutral-50/50 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Vista previa del logo" className="max-w-full max-h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 text-xs w-5 h-5 flex items-center justify-center transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground leading-normal">Se colocará en una esquina de la foto como marca de agua</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="autoApprove" name="autoApprove" className="rounded border-border text-ring focus:ring-ring" />
              <Label htmlFor="autoApprove" className="text-xs font-medium text-primary">Aprobar fotos automáticamente</Label>
            </div>
            <div className="flex gap-2 pt-4 border-t border-border mt-6">
              <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-md text-xs border-border hover:bg-neutral-50 shadow-none">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="rounded-md text-xs shadow-none">
                {loading ? 'Creando...' : 'Crear evento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
