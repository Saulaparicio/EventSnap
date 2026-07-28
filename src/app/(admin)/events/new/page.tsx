'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Info, 
  Palette, 
  Shield, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  Rocket, 
  ArrowLeft,
  Calendar,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NewEventPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Step 1: Details
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [timezone, setTimezone] = useState('Eastern Standard Time (EST)')

  // Step 2: Branding / Watermark
  const [customWatermark, setCustomWatermark] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPosition, setLogoPosition] = useState('bottom-right')
  const [logoSize, setLogoSize] = useState(15)
  const [showWatermarkText, setShowWatermarkText] = useState(true)
  const [watermarkText, setWatermarkText] = useState('')
  const [textPosition, setTextPosition] = useState('bottom-center')
  const [brandColor, setBrandColor] = useState('#0F172A')

  // Step 3: Gallery Settings
  const [autoApprove, setAutoApprove] = useState(false)
  const [galleryAccess, setGalleryAccess] = useState('public')
  const [guestUploadLimit, setGuestUploadLimit] = useState(50)
  const [maxFileSize, setMaxFileSize] = useState(15)
  const [allowedTypes, setAllowedTypes] = useState<string[]>(['JPG', 'PNG', 'HEIC'])

  const handleNameChange = (val: string) => {
    setName(val)
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(generated)
    if (!watermarkText) {
      setWatermarkText(val)
    }
  }

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

  async function handleLaunch() {
    if (!name.trim()) {
      toast.error('Por favor, ingresa el nombre del evento')
      setStep(1)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          date: startDate,
          watermarkConfig: {
            logo_url: logoUrl || undefined,
            logo_position: logoPosition,
            logo_size: Number(logoSize),
            text: showWatermarkText ? (watermarkText || name) : undefined,
            text_position: textPosition,
            brand_color: brandColor,
            enabled: customWatermark,
          },
          slideshowConfig: {
            auto_approve: autoApprove,
            gallery_access: galleryAccess,
            upload_limit: Number(guestUploadLimit),
            max_file_size: Number(maxFileSize),
            allowed_types: allowedTypes,
          },
        }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        toast.error(data.error ?? 'Error al crear el evento')
      } else {
        toast.success('¡Evento lanzado con éxito!')
        router.push(`/events/${data.id}`)
      }
    } catch {
      setLoading(false)
      toast.error('Error de red al crear el evento')
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[#e5e3dc] pb-5">
        <button onClick={() => router.back()} className="p-2 hover:bg-[#f6f3f5] border border-[#e5e3dc] rounded-xl transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4 text-black" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black leading-tight">Crear Nuevo Evento</h1>
          <p className="text-xs text-[#76777d]">Configura tu galería interactiva en vivo paso a paso.</p>
        </div>
      </div>

      {/* Progress Steps bar */}
      <div className="grid grid-cols-4 gap-2 border-b border-[#e5e3dc] pb-4">
        {[
          { num: 1, label: 'Detalles', icon: Info },
          { num: 2, label: 'Branding', icon: Palette },
          { num: 3, label: 'Ajustes', icon: Shield },
          { num: 4, label: 'Lanzamiento', icon: Rocket }
        ].map((s) => {
          const IconComponent = s.icon
          const isActive = step === s.num
          const isDone = step > s.num

          return (
            <div key={s.num} className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                  isActive ? "bg-black text-white" : isDone ? "bg-[#0d9488] text-white" : "bg-[#f0edef] text-[#76777d]"
                )}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                </span>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider hidden md:inline",
                  isActive ? "text-black" : "text-[#76777d]"
                )}>
                  {s.label}
                </span>
              </div>
              <div className={cn(
                "h-1 w-full rounded mt-1.5 transition-all",
                isActive ? "bg-black" : isDone ? "bg-[#0d9488]" : "bg-[#f0edef]"
              )}></div>
            </div>
          )
        })}
      </div>

      {/* Steps Content Bento Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={cn("space-y-6", step === 2 ? "lg:col-span-8" : "lg:col-span-12")}>
          
          {/* STEP 1: DETAILS */}
          {step === 1 && (
            <section className="bg-white border border-[#e5e3dc] p-6 rounded-2xl space-y-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#e5e3dc] pb-3">
                <Info className="w-5 h-5 text-[#006a61]" />
                <h3 className="text-sm font-bold text-black">Paso 1: Detalles del Evento</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="eventName" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nombre del Evento *</Label>
                  <Input
                    id="eventName"
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Boda de Ana & Carlos"
                    required
                    className="rounded-xl border-[#e5e3dc] focus:border-[#0d9488] p-3 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eventSlug" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">URL Slug</Label>
                  <div className="flex">
                    <span className="bg-[#f0edef] border border-r-0 border-[#e5e3dc] px-3 py-2.5 rounded-l-xl text-xs text-slate-500 font-semibold select-none flex items-center">
                      eventsnap.com/e/
                    </span>
                    <Input
                      id="eventSlug"
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                      className="rounded-r-xl border-[#e5e3dc] focus:border-[#0d9488] p-3 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha de Inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="rounded-xl border-[#e5e3dc] focus:border-[#0d9488] p-3 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha de Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-xl border-[#e5e3dc] focus:border-[#0d9488] p-3 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="timezone" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Zona Horaria</Label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs focus:border-[#0d9488] focus:ring-0"
                  >
                    <option>Eastern Standard Time (EST)</option>
                    <option>Pacific Standard Time (PST)</option>
                    <option>London (GMT)</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2: WATERMARK CONFIG */}
          {step === 2 && (
            <section className="bg-white border border-[#e5e3dc] p-6 rounded-2xl space-y-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#e5e3dc] pb-3">
                <Palette className="w-5 h-5 text-[#006a61]" />
                <h3 className="text-sm font-bold text-black">Paso 2: Marca de Agua & Marca</h3>
              </div>

              {/* Event Logo Upload */}
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Logo del Evento (PNG transparente)</Label>
                <div className="border-2 border-dashed border-[#e5e3dc] rounded-2xl p-6 flex flex-col items-center justify-center bg-[#fcf8fa] hover:bg-neutral-50 transition-colors cursor-pointer relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-[#76777d] group-hover:scale-110 transition-transform mb-2" />
                  <p className="text-xs text-slate-500 text-center font-medium">
                    {uploadingLogo ? 'Subiendo logo...' : 'Suelta tu logo aquí o haz clic para explorar'}
                  </p>
                </div>

                {logoUrl && (
                  <div className="mt-3 relative w-36 h-20 border border-[#e5e3dc] rounded-xl bg-[#fcf8fa] flex items-center justify-center overflow-hidden p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center transition-colors font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Brand Color */}
              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Color de Marca Principal</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border border-[#e5e3dc] p-0"
                  />
                  <Input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="flex-grow bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs uppercase"
                  />
                </div>
              </div>

              {/* Watermark toggle */}
              <div className="flex items-center justify-between p-4 bg-[#fcf8fa] border border-[#e5e3dc] rounded-xl">
                <div>
                  <p className="text-xs font-bold text-black">Marca de Agua Personalizada</p>
                  <p className="text-[10px] text-slate-500">Aplica logo y nombre del evento en las fotos de los invitados</p>
                </div>
                <input
                  type="checkbox"
                  checked={customWatermark}
                  onChange={(e) => setCustomWatermark(e.target.checked)}
                  className="rounded border-[#e5e3dc] text-black focus:ring-0 w-5 h-5 cursor-pointer"
                />
              </div>

              {/* Watermark parameters */}
              {customWatermark && (
                <div className="space-y-4 pt-2 border-t border-[#e5e3dc]">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-black">Texto de Marca de Agua</Label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showWatermarkText}
                        onChange={(e) => setShowWatermarkText(e.target.checked)}
                        className="rounded border-[#e5e3dc] text-black focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      Mostrar texto
                    </label>
                  </div>
                  
                  {showWatermarkText && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-500 font-bold uppercase">Texto del Estampado</Label>
                        <Input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="w-full bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs"
                          placeholder="Nombre del evento"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-500 font-bold uppercase">Posición del Texto</Label>
                        <select
                          value={textPosition}
                          onChange={(e) => setTextPosition(e.target.value)}
                          className="w-full bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs focus:border-[#0d9488]"
                        >
                          <option value="bottom-center">Abajo - Centro</option>
                          <option value="top-center">Arriba - Centro</option>
                          <option value="bottom-left">Abajo - Izquierda</option>
                          <option value="bottom-right">Abajo - Derecha</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {logoUrl && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-500 font-bold uppercase">Posición del Logo</Label>
                        <select
                          value={logoPosition}
                          onChange={(e) => setLogoPosition(e.target.value)}
                          className="w-full bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs focus:border-[#0d9488]"
                        >
                          <option value="bottom-right">Abajo - Derecha</option>
                          <option value="bottom-left">Abajo - Izquierda</option>
                          <option value="top-right">Arriba - Derecha</option>
                          <option value="top-left">Arriba - Izquierda</option>
                          <option value="center">Centro</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-500 font-bold uppercase">Tamaño del Logo</Label>
                        <select
                          value={logoSize}
                          onChange={(e) => setLogoSize(Number(e.target.value))}
                          className="w-full bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs focus:border-[#0d9488]"
                        >
                          <option value="10">Pequeño (10%)</option>
                          <option value="15">Mediano (15%)</option>
                          <option value="20">Grande (20%)</option>
                          <option value="25">Extra Grande (25%)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* STEP 3: SLIDESHOW SETTINGS */}
          {step === 3 && (
            <section className="bg-white border border-[#e5e3dc] p-6 rounded-2xl space-y-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#e5e3dc] pb-3">
                <Shield className="w-5 h-5 text-[#006a61]" />
                <h3 className="text-sm font-bold text-black">Paso 3: Privacidad & Ajustes</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Moderation style */}
                <div className="space-y-4">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Flujo de Moderación de Fotos</label>
                  <div className="flex flex-col gap-2">
                    <label className={cn(
                      "flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors",
                      autoApprove ? "border-[#0d9488] bg-teal-50/10" : "border-[#e5e3dc]"
                    )}>
                      <input
                        type="radio"
                        name="autoApprove"
                        checked={autoApprove}
                        onChange={() => setAutoApprove(true)}
                        className="text-black focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-black">Aprobación Automática (Auto-approve)</p>
                        <p className="text-[10px] text-slate-500">Las fotos subidas aparecen al instante en la galería</p>
                      </div>
                    </label>

                    <label className={cn(
                      "flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors",
                      !autoApprove ? "border-[#0d9488] bg-teal-50/10" : "border-[#e5e3dc]"
                    )}>
                      <input
                        type="radio"
                        name="autoApprove"
                        checked={!autoApprove}
                        onChange={() => setAutoApprove(false)}
                        className="text-black focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-black">Moderación Manual (Manual Moderation)</p>
                        <p className="text-[10px] text-slate-500">Los administradores deben aprobar cada foto antes de mostrarla</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Gallery Access & limits */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Acceso a la Galería</Label>
                    <select
                      value={galleryAccess}
                      onChange={(e) => setGalleryAccess(e.target.value)}
                      className="w-full bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs focus:border-[#0d9488] focus:ring-0"
                    >
                      <option value="public">Público (Cualquiera con el enlace)</option>
                      <option value="password">Protegido por contraseña</option>
                      <option value="invite">Solo con Invitación directa</option>
                    </select>
                  </div>

                  {/* Upload limits */}
                  <div className="space-y-2 border-t border-[#e5e3dc] pt-3">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Límites de Subida de Invitado</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-500 font-bold">Límite por Invitado</Label>
                        <Input
                          type="number"
                          value={guestUploadLimit}
                          onChange={(e) => setGuestUploadLimit(Number(e.target.value))}
                          className="p-2.5 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-500 font-bold">Peso máx. de archivo (MB)</Label>
                        <Input
                          type="number"
                          value={maxFileSize}
                          onChange={(e) => setMaxFileSize(Number(e.target.value))}
                          className="p-2.5 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 4: REVIEW & LAUNCH */}
          {step === 4 && (
            <section className="bg-white border border-[#e5e3dc] p-6 rounded-2xl space-y-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#e5e3dc] pb-3">
                <Rocket className="w-5 h-5 text-[#006a61]" />
                <h3 className="text-sm font-bold text-black">Paso 4: Revisar y Lanzar Evento</h3>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-[#fcf8fa] border border-[#e5e3dc] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-black border-b pb-1">Resumen del Evento</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-slate-500 font-semibold">Nombre:</span>
                    <span className="text-black font-extrabold">{name}</span>
                    
                    <span className="text-slate-500 font-semibold">Enlace de Galería:</span>
                    <span className="text-black font-extrabold">eventsnap.com/e/{slug}</span>

                    <span className="text-slate-500 font-semibold">Fecha:</span>
                    <span className="text-black font-extrabold">{startDate}</span>

                    <span className="text-slate-500 font-semibold">Zona Horaria:</span>
                    <span className="text-black font-extrabold">{timezone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-[#e5e3dc] rounded-xl text-xs space-y-2">
                    <h5 className="font-bold text-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span> Branding
                    </h5>
                    <p className="text-slate-500 font-medium">Color de Marca: <span className="font-bold text-black uppercase">{brandColor}</span></p>
                    <p className="text-slate-500 font-medium">Marca de agua: <span className="font-bold text-black">{customWatermark ? 'Habilitada' : 'Deshabilitada'}</span></p>
                    {logoUrl && <p className="text-slate-500 font-medium">Logo personalizado: <span className="text-[#0d9488] font-bold">Subido ✓</span></p>}
                  </div>

                  <div className="p-4 border border-[#e5e3dc] rounded-xl text-xs space-y-2">
                    <h5 className="font-bold text-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006a61]"></span> Configuración
                    </h5>
                    <p className="text-slate-500 font-medium">Moderación: <span className="font-bold text-black">{autoApprove ? 'Automática (Auto-approve)' : 'Manual'}</span></p>
                    <p className="text-slate-500 font-medium">Acceso: <span className="font-bold text-black capitalize">{galleryAccess}</span></p>
                    <p className="text-slate-500 font-medium">Límite subida: <span className="font-bold text-black">{guestUploadLimit} fotos / invitado</span></p>
                  </div>
                </div>

                <div className="p-4 bg-teal-50/20 border border-teal-100 rounded-xl flex items-start gap-3">
                  <Rocket className="w-5 h-5 text-[#006a61] mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-black">Listo para despegar</p>
                    <p className="text-slate-500 leading-relaxed mt-0.5">Al hacer clic en lanzar, generaremos el código QR y tu álbum de fotos compartido estará listo para recibir imágenes de los invitados en tiempo real.</p>
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* STEP 2: LIVE SIMULATED WATERMARK PREVIEW SIDECARD */}
        {step === 2 && (
          <div className="lg:col-span-4 h-fit">
            <section className="bg-[#f0edef] border border-[#e5e3dc] p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <p className="absolute top-4 left-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vista Previa En Vivo</p>
              
              <div className="w-full max-w-[200px] bg-white rounded-2xl shadow-md overflow-hidden border border-[#e5e3dc] my-6">
                <div className="aspect-[4/3] relative bg-zinc-950 flex items-center justify-center p-1">
                  <span className="text-zinc-600 text-2xs select-none">Foto de invitado</span>
                  
                  {/* Live simulated watermark overlay */}
                  {customWatermark && (
                    <div className="absolute inset-0 p-2 flex flex-col justify-between pointer-events-none">
                      {/* Top row */}
                      <div className="flex justify-between items-start w-full">
                        {logoUrl && logoPosition === 'top-left' && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="logo" className="object-contain" style={{ width: `${logoSize * 1.2}px` }} />
                        )}
                        {showWatermarkText && textPosition === 'top-center' && (
                          <span className="text-[6px] text-white/95 font-bold tracking-tight bg-black/45 px-1.5 py-0.5 rounded mx-auto">{watermarkText || name || 'Mi Evento'}</span>
                        )}
                        {logoUrl && logoPosition === 'top-right' && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="logo" className="object-contain ml-auto" style={{ width: `${logoSize * 1.2}px` }} />
                        )}
                      </div>
                      
                      {/* Center row */}
                      <div className="flex-1 flex items-center justify-center w-full">
                        {logoUrl && logoPosition === 'center' && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="logo" className="object-contain opacity-55" style={{ width: `${logoSize * 2}px` }} />
                        )}
                      </div>

                      {/* Bottom row */}
                      <div className="flex justify-between items-end w-full">
                        {logoUrl && logoPosition === 'bottom-left' && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="logo" className="object-contain" style={{ width: `${logoSize * 1.2}px` }} />
                        )}
                        {showWatermarkText && textPosition === 'bottom-center' && (
                          <span className="text-[6px] text-white/95 font-bold tracking-tight bg-black/45 px-1.5 py-0.5 rounded mx-auto">{watermarkText || name || 'Mi Evento'}</span>
                        )}
                        {showWatermarkText && textPosition === 'bottom-left' && (
                          <span className="text-[6px] text-white/95 font-bold tracking-tight bg-black/45 px-1.5 py-0.5 rounded">{watermarkText || name || 'Mi Evento'}</span>
                        )}
                        {showWatermarkText && textPosition === 'bottom-right' && (
                          <span className="text-[6px] text-white/95 font-bold tracking-tight bg-black/45 px-1.5 py-0.5 rounded ml-auto">{watermarkText || name || 'Mi Evento'}</span>
                        )}
                        {logoUrl && logoPosition === 'bottom-right' && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="logo" className="object-contain ml-auto" style={{ width: `${logoSize * 1.2}px` }} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="h-2.5 w-3/4 bg-[#f0edef] rounded"></div>
                  <div className="h-1.5 w-full bg-[#f0edef] rounded"></div>
                  <div className="h-5 w-full rounded mt-2" style={{ backgroundColor: brandColor }}></div>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-500 font-bold text-center">Simulador de Estampado Móvil</p>
            </section>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#e5e3dc] mt-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(prev => prev - 1)}
            className="px-5 py-2.5 border border-[#e5e3dc] hover:bg-[#f6f3f5] text-[#0f172a] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-[#e5e3dc] hover:bg-[#f6f3f5] text-[#0f172a] font-bold text-xs rounded-xl cursor-pointer bg-white"
          >
            Cancelar
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && !name.trim()) {
                toast.error('Por favor, ingresa el nombre del evento')
                return
              }
              setStep(prev => prev + 1)
            }}
            className="px-6 py-2.5 bg-black text-white hover:bg-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLaunch}
            disabled={loading || uploadingLogo}
            className="px-6 py-2.5 bg-[#0d9488] hover:bg-[#0d9488]/90 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-none"
          >
            {loading ? 'Lanzando...' : 'Lanzar Evento'}
            <Rocket className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
