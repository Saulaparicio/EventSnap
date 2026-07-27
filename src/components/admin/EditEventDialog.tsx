'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Settings } from 'lucide-react'

interface Event {
  id: string
  name: string
  date: Date | string
  status: string
  watermarkConfig?: any
  slideshowConfig?: any
}

export default function EditEventDialog({ event }: { event: Event }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(event.name)

  const formatDateForInput = (dateVal: Date | string) => {
    const d = new Date(dateVal)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const [date, setDate] = useState(formatDateForInput(event.date))
  const [status, setStatus] = useState(event.status)

  const wConfig = event.watermarkConfig as any
  const [watermarkText, setWatermarkText] = useState(wConfig?.text || '')
  const [logoUrl, setLogoUrl] = useState<string | null>(wConfig?.logo_url || null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const sConfig = event.slideshowConfig as any
  const [autoApprove, setAutoApprove] = useState(sConfig?.auto_approve === true)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          date,
          status,
          watermarkConfig: {
            ...wConfig,
            text: watermarkText || undefined,
            logo_url: logoUrl || undefined,
          },
          slideshowConfig: {
            ...sConfig,
            auto_approve: autoApprove,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al guardar los cambios')
      } else {
        toast.success('Configuración guardada')
        setOpen(false)
        router.refresh()
      }
    } catch {
      toast.error('Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="rounded-md text-xs border-border hover:bg-neutral-50 shadow-none gap-1.5">
          <Settings className="w-3.5 h-3.5" strokeWidth={2} />
          Configurar
        </Button>
      } />
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border shadow-none bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-primary tracking-tight">Editar configuración del evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs font-medium text-primary">Nombre del evento *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-md border-border focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date" className="text-xs font-medium text-primary">Fecha *</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="rounded-md border-border focus:ring-ring" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="status" className="text-xs font-medium text-primary">Estado del evento</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="active">Activo</option>
              <option value="closed">Cerrado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="watermarkText" className="text-xs font-medium text-primary">Texto del watermark</Label>
            <Input
              id="watermarkText"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Boda de Ana & Carlos"
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
            <input
              type="checkbox"
              id="autoApprove"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="rounded border-border text-ring focus:ring-ring"
            />
            <Label htmlFor="autoApprove" className="text-xs font-medium text-primary">Aprobar fotos automáticamente</Label>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-md text-xs border-border hover:bg-neutral-50 shadow-none">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploadingLogo} className="rounded-md text-xs shadow-none">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
