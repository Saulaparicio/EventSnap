'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Users, 
  HelpCircle, 
  ArrowLeft, 
  Download, 
  Check, 
  X, 
  Trash2, 
  ExternalLink,
  QrCode,
  BarChart2,
  Printer,
  Clock,
  Layers,
  Settings,
  Shield,
  Info,
  Palette,
  Upload,
  Calendar,
  Lock,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

interface Photo {
  id: string
  originalUrl: string
  watermarkedUrl: string | null
  thumbnailUrl: string | null
  status: 'pending' | 'approved' | 'rejected'
  uploadedAt: string
  fileSize: number | null
}

interface EventData {
  id: string
  name: string
  slug: string
  date: string
  status: 'active' | 'closed' | 'archived'
  qrCodeUrl: string | null
  watermarkConfig?: any
  slideshowConfig?: any
}

interface Props {
  event: EventData
  initialPhotos: Photo[]
}

type MainTab = 'moderation' | 'analytics' | 'print' | 'settings'
type FilterTab = 'all' | 'pending' | 'approved' | 'rejected'
type PrintTemplate = 'table-tent' | 'flyer' | 'business-card'
type SettingsTab = 'general' | 'branding' | 'privacy' | 'integrations' | 'billing'

export default function EventGalleryManager({ event, initialPhotos }: Props) {
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [currentMainTab, setCurrentMainTab] = useState<MainTab>('moderation')
  const [activePrintTemplate, setActivePrintTemplate] = useState<PrintTemplate>('table-tent')
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('general')
  const [isPending, startTransition] = useTransition()

  // Event settings states
  const wConfig = event.watermarkConfig as any
  const sConfig = event.slideshowConfig as any

  const [eventName, setEventName] = useState(event.name)
  const [eventSlug, setEventSlug] = useState(event.slug)
  const [eventDate, setEventDate] = useState(() => {
    try {
      return new Date(event.date).toISOString().split('T')[0]
    } catch {
      return new Date().toISOString().split('T')[0]
    }
  })
  const [eventStatus, setEventStatus] = useState<any>(event.status)

  // Branding states
  const [logoUrl, setLogoUrl] = useState<string | null>(wConfig?.logo_url || null)
  const [logoPosition, setLogoPosition] = useState<string>(wConfig?.logo_position || 'bottom-right')
  const [logoSize, setLogoSize] = useState<number>(wConfig?.logo_size || 15)
  const [showWatermarkText, setShowWatermarkText] = useState<boolean>(wConfig?.text !== undefined ? Boolean(wConfig?.text) : true)
  const [watermarkText, setWatermarkText] = useState(wConfig?.text || event.name)
  const [textPosition, setTextPosition] = useState<string>(wConfig?.text_position || 'bottom-center')
  const [brandColor, setBrandColor] = useState<string>(wConfig?.brand_color || '#0F172A')
  const [customWatermark, setCustomWatermark] = useState<boolean>(wConfig?.enabled !== false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Privacy & Restrictions states
  const [autoApprove, setAutoApprove] = useState<boolean>(sConfig?.auto_approve === true)
  const [galleryAccess, setGalleryAccess] = useState<string>(sConfig?.gallery_access || 'public')
  const [guestUploadLimit, setGuestUploadLimit] = useState<number>(sConfig?.upload_limit || 50)
  const [maxFileSize, setMaxFileSize] = useState<number>(sConfig?.max_file_size || 15)
  const [allowedTypes, setAllowedTypes] = useState<string[]>(sConfig?.allowed_types || ['JPG', 'PNG', 'HEIC'])

  const [savingSettings, setSavingSettings] = useState(false)

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

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          date: eventDate,
          status: eventStatus,
          watermarkConfig: {
            ...wConfig,
            logo_url: logoUrl || undefined,
            logo_position: logoPosition,
            logo_size: Number(logoSize),
            text: showWatermarkText ? (watermarkText || eventName) : undefined,
            text_position: textPosition,
            brand_color: brandColor,
            enabled: customWatermark,
          },
          slideshowConfig: {
            ...sConfig,
            auto_approve: autoApprove,
            gallery_access: galleryAccess,
            upload_limit: Number(guestUploadLimit),
            max_file_size: Number(maxFileSize),
            allowed_types: allowedTypes,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al guardar los cambios')
      } else {
        toast.success('Configuración guardada')
        startTransition(() => {
          router.refresh()
        })
      }
    } catch {
      toast.error('Error al guardar los cambios')
    } finally {
      setSavingSettings(false)
    }
  }

  function handleDiscardSettings() {
    setEventName(event.name)
    setEventSlug(event.slug)
    setEventDate(() => {
      try {
        return new Date(event.date).toISOString().split('T')[0]
      } catch {
        return new Date().toISOString().split('T')[0]
      }
    })
    setEventStatus(event.status)
    setLogoUrl(wConfig?.logo_url || null)
    setLogoPosition(wConfig?.logo_position || 'bottom-right')
    setLogoSize(wConfig?.logo_size || 15)
    setShowWatermarkText(wConfig?.text !== undefined ? Boolean(wConfig?.text) : true)
    setWatermarkText(wConfig?.text || event.name)
    setTextPosition(wConfig?.text_position || 'bottom-center')
    setBrandColor(wConfig?.brand_color || '#0F172A')
    setCustomWatermark(wConfig?.enabled !== false)
    setAutoApprove(sConfig?.auto_approve === true)
    setGalleryAccess(sConfig?.gallery_access || 'public')
    setGuestUploadLimit(sConfig?.upload_limit || 50)
    setMaxFileSize(sConfig?.max_file_size || 15)
    setAllowedTypes(sConfig?.allowed_types || ['JPG', 'PNG', 'HEIC'])
    toast.info('Cambios descartados')
  }

  // Calculate dynamic stats
  const totalCount = photos.length
  const approvedCount = photos.filter(p => p.status === 'approved').length
  const pendingCount = photos.filter(p => p.status === 'pending').length
  const rejectedCount = photos.filter(p => p.status === 'rejected').length

  const storageLimitMb = 500
  const storageUsedMb = totalCount * 1.2
  const storagePercent = Math.min(Math.round((storageUsedMb / storageLimitMb) * 100), 100)

  // Filtered photos list (for moderation tab)
  const filteredPhotos = photos.filter(p => {
    if (activeTab === 'all') return true
    return p.status === activeTab
  })

  // Bulk actions API helper
  async function updatePhotosStatus(ids: string[] | null, status: 'approved' | 'rejected') {
    try {
      const res = await fetch(`/api/admin/events/${event.id}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, photoIds: ids }),
      })
      if (res.ok) {
        toast.success(ids ? `Se actualizaron ${ids.length} fotos` : 'Se actualizaron todas las fotos')
        
        // Update local state
        setPhotos(prev => prev.map(p => {
          if (!ids || ids.includes(p.id)) {
            return { ...p, status }
          }
          return p
        }))
        setSelectedIds([])
        startTransition(() => {
          router.refresh()
        })
      } else {
        toast.error('Error al actualizar las fotos')
      }
    } catch {
      toast.error('Error de red')
    }
  }

  // Single photo moderation helper
  async function moderateSingle(photoId: string, status: 'approved' | 'rejected') {
    try {
      const res = await fetch(`/api/admin/events/${event.id}/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(status === 'approved' ? 'Foto aprobada' : 'Foto rechazada')
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, status } : p))
        startTransition(() => {
          router.refresh()
        })
      } else {
        toast.error('Error al moderar la foto')
      }
    } catch {
      toast.error('Error de red')
    }
  }

  // Single photo deletion
  async function deleteSingle(photoId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta foto?')) return
    try {
      const res = await fetch(`/api/admin/events/${event.id}/photos/${photoId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Foto eliminada permanentemente')
        setPhotos(prev => prev.filter(p => p.id !== photoId))
        setSelectedIds(prev => prev.filter(id => id !== photoId))
        startTransition(() => {
          router.refresh()
        })
      } else {
        toast.error('Error al eliminar la foto')
      }
    } catch {
      toast.error('Error de red')
    }
  }

  // Select all visible photos
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredPhotos.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (photoId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, photoId])
    } else {
      setSelectedIds(prev => prev.filter(id => id !== photoId))
    }
  }

  // Trigger print view
  const triggerPrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Group uploads by hour for Analytics Chart
  const hourlyUploads: { [hour: string]: number } = {}
  photos.forEach(p => {
    const hr = new Date(p.uploadedAt).getHours()
    const label = `${hr.toString().padStart(2, '0')}:00`
    hourlyUploads[label] = (hourlyUploads[label] || 0) + 1
  })
  const chartLabels = Object.keys(hourlyUploads).sort()
  const maxUploadVal = Math.max(...Object.values(hourlyUploads), 1)

  return (
    <div className="p-6 md:p-8 space-y-6 w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Print-only CSS Styles Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-section, #print-section * {
            visibility: visible !important;
          }
          #print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            color: black !important;
            padding: 2rem !important;
            margin: 0 !important;
          }
        }
      `}} />

      {/* Hidden print section rendered for browser printing */}
      <div id="print-section" className="hidden">
        {activePrintTemplate === 'table-tent' && (
          <div className="w-full h-full flex flex-col items-center justify-between border-2 border-dashed border-gray-400 p-8 max-w-lg mx-auto font-sans bg-white text-black text-center">
            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500">EventSnap Live Album</span>
              <h2 className="text-3xl font-black">{event.name}</h2>
              <div className="w-16 h-0.5 bg-black mx-auto my-3"></div>
            </div>
            
            <div className="my-6 space-y-4">
              <p className="text-sm font-bold text-gray-700">¡Comparte tus momentos con nosotros!</p>
              {event.qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.qrCodeUrl} alt="QR del evento" className="w-56 h-56 mx-auto border p-2 bg-white rounded-lg shadow-sm" />
              ) : (
                <div className="w-48 h-48 border border-dashed flex items-center justify-center mx-auto text-xs text-gray-400">QR no generado</div>
              )}
              <p className="text-xs text-gray-500 leading-normal max-w-xs mx-auto">
                1. Abre tu cámara móvil.<br/>
                2. Escanea el código QR superior.<br/>
                3. Toma tus fotos y velas en vivo en la pantalla.
              </p>
            </div>

            <div className="text-[10px] text-gray-400 border-t pt-4 w-full">
              Doble esta tarjeta por la mitad y colóquela en la mesa.
            </div>
          </div>
        )}

        {activePrintTemplate === 'flyer' && (
          <div className="w-full h-full flex flex-col justify-between p-12 border-4 border-double border-gray-800 font-sans bg-white text-black text-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#006a61]">Captura del Evento</span>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">{event.name}</h1>
              <p className="text-sm text-gray-500 uppercase font-semibold">{formatDate(event.date)}</p>
            </div>

            <div className="flex flex-col items-center gap-6 my-10">
              {event.qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.qrCodeUrl} alt="QR del evento" className="w-64 h-64 border p-2 bg-white rounded-xl shadow-md" />
              ) : (
                <div className="w-56 h-56 border border-dashed flex items-center justify-center text-xs text-gray-400">QR no generado</div>
              )}
              
              <div className="max-w-md space-y-4 text-left border-l-2 border-black pl-6 py-2">
                <h3 className="text-md font-bold text-gray-800">¿Cómo subir fotos?</h3>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li><strong>Escanea</strong> el código QR con la cámara de tu celular.</li>
                  <li><strong>Captura o sube</strong> fotos directamente desde el navegador de tu teléfono.</li>
                  <li><strong>Proyecta</strong> tus fotos aparecerán al instante en la pantalla gigante.</li>
                </ol>
              </div>
            </div>

            <div className="text-xs text-gray-400 mt-6">
              Escanea para unirte al álbum compartido • Desarrollado por EventSnap
            </div>
          </div>
        )}

        {activePrintTemplate === 'business-card' && (
          <div className="w-96 h-56 border border-gray-300 p-6 flex items-center justify-between gap-6 mx-auto font-sans bg-white text-black shadow-sm">
            <div className="flex-1 flex flex-col justify-between h-full text-left">
              <div>
                <h2 className="text-md font-extrabold text-gray-900 leading-tight line-clamp-2">{event.name}</h2>
                <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider mt-1">{formatDate(event.date)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-700">📸 Sube tus fotos</p>
                <p className="text-[8px] text-gray-400 leading-snug mt-0.5">Escanea el QR e interactúa con el slideshow en vivo.</p>
              </div>
            </div>
            
            <div className="shrink-0 flex items-center justify-center">
              {event.qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.qrCodeUrl} alt="QR del evento" className="w-28 h-28 border p-1 bg-white rounded" />
              ) : (
                <div className="w-24 h-24 border border-dashed flex items-center justify-center text-[8px] text-gray-300">QR</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e5e3dc] pb-5">
          <div className="flex items-start gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-[#f6f3f5] border border-[#e5e3dc] rounded-xl transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4 text-black" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-black leading-tight">{event.name}</h1>
                {event.status === 'active' ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#86f2e4]/40 text-[#006f66] text-[9px] font-bold border border-[#86f2e4]/30 uppercase tracking-wider animate-pulse-soft">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488]"></span>
                    Live
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    Finalizado
                  </span>
                )}
              </div>
              <p className="text-xs text-[#76777d] mt-1 font-semibold uppercase tracking-wider">{formatDate(event.date)}</p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setCurrentMainTab('settings')}
              className={cn(
                buttonVariants({ variant: currentMainTab === 'settings' ? 'default' : 'outline' }),
                "rounded-xl text-xs border-[#e5e3dc] hover:bg-[#f6f3f5] text-[#0f172a] shadow-none gap-1.5 h-10 px-4 font-semibold cursor-pointer",
                currentMainTab === 'settings' && "bg-black text-white hover:bg-slate-800"
              )}
            >
              <Settings className="w-3.5 h-3.5" />
              Configurar
            </button>
            <Link
              href={`/live/${event.slug}`}
              target="_blank"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                "rounded-xl text-xs border-[#e5e3dc] hover:bg-[#f6f3f5] text-[#0f172a] shadow-none gap-1.5 h-10 px-4 font-semibold cursor-pointer"
              )}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Slideshow
            </Link>
            {event.qrCodeUrl && (
              <a
                href={`/api/admin/events/${event.id}/qr/qr-${event.slug}.png`}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  "rounded-xl text-xs border-[#e5e3dc] hover:bg-[#f6f3f5] text-[#0f172a] shadow-none gap-1.5 h-10 px-4 font-semibold cursor-pointer"
                )}
              >
                <Download className="w-3.5 h-3.5" />
                Descargar QR
              </a>
            )}
            {currentMainTab === 'moderation' && (
              <button
                onClick={() => updatePhotosStatus(null, 'approved')}
                className={cn(
                  buttonVariants(),
                  "rounded-xl text-xs bg-black text-white hover:bg-slate-800 shadow-none gap-1.5 h-10 px-4 font-semibold cursor-pointer"
                )}
              >
                <Check className="w-3.5 h-3.5" />
                Approve All
              </button>
            )}
            {currentMainTab === 'print' && (
              <button
                onClick={triggerPrint}
                className={cn(
                  buttonVariants(),
                  "rounded-xl text-xs bg-[#0d9488] hover:bg-[#0d9488]/90 text-white shadow-none gap-1.5 h-10 px-4 font-semibold cursor-pointer"
                )}
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Formato
              </button>
            )}
          </div>
        </div>
 
        {/* Navigation Tabs (Desktop & Mobile) */}
        <div className="flex border-b border-[#e5e3dc] gap-6 pt-1">
          <button
            onClick={() => setCurrentMainTab('moderation')}
            className={cn(
              "pb-3 text-xs tracking-wider uppercase font-semibold relative transition-colors cursor-pointer",
              currentMainTab === 'moderation' ? "text-black border-b-2 border-black font-bold" : "text-[#76777d] hover:text-black"
            )}
          >
            Moderar
          </button>
          <button
            onClick={() => setCurrentMainTab('analytics')}
            className={cn(
              "pb-3 text-xs tracking-wider uppercase font-semibold relative transition-colors cursor-pointer",
              currentMainTab === 'analytics' ? "text-black border-b-2 border-black font-bold" : "text-[#76777d] hover:text-black"
            )}
          >
            Analíticas
          </button>
          <button
            onClick={() => setCurrentMainTab('print')}
            className={cn(
              "pb-3 text-xs tracking-wider uppercase font-semibold relative transition-colors cursor-pointer",
              currentMainTab === 'print' ? "text-black border-b-2 border-black font-bold" : "text-[#76777d] hover:text-black"
            )}
          >
            Imprimir QR
          </button>
          <button
            onClick={() => setCurrentMainTab('settings')}
            className={cn(
              "pb-3 text-xs tracking-wider uppercase font-semibold relative transition-colors cursor-pointer",
              currentMainTab === 'settings' ? "text-black border-b-2 border-black font-bold" : "text-[#76777d] hover:text-black"
            )}
          >
            Ajustes
          </button>
        </div>

        {/* MAIN TAB 1: MODERATION GRID */}
        {currentMainTab === 'moderation' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Stats metrics row matching Google Stitch */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <p className="text-[10px] font-bold text-[#76777d] tracking-widest uppercase mb-1">Total Uploads</p>
                <p className="text-3xl font-black text-black mt-2">{totalCount}</p>
              </div>
              <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <p className="text-[10px] font-bold text-[#76777d] tracking-widest uppercase mb-1">Approved</p>
                <p className="text-3xl font-black text-[#006a61] mt-2">{approvedCount}</p>
              </div>
              <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <p className="text-[10px] font-bold text-[#76777d] tracking-widest uppercase mb-1">Pending Review</p>
                <p className="text-3xl font-black text-amber-600 mt-2">{pendingCount}</p>
              </div>
              <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <p className="text-[10px] font-bold text-[#76777d] tracking-widest uppercase mb-1">Rejected</p>
                <p className="text-3xl font-black text-red-600 mt-2">{rejectedCount}</p>
              </div>
            </div>

            {/* Filters and batch selection bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e5e3dc] pt-2">
              <div className="flex gap-6">
                <button
                  onClick={() => { setActiveTab('all'); setSelectedIds([]); }}
                  className={cn(
                    "pb-3 text-xs tracking-wider uppercase font-semibold relative transition-colors cursor-pointer",
                    activeTab === 'all' 
                      ? "text-black border-b-2 border-black font-bold" 
                      : "text-[#76777d] hover:text-black"
                  )}
                >
                  All <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0edef] text-[#45464d]">{totalCount}</span>
                </button>
                
                <button
                  onClick={() => { setActiveTab('pending'); setSelectedIds([]); }}
                  className={cn(
                    "pb-3 text-xs tracking-wider uppercase font-semibold relative transition-colors cursor-pointer",
                    activeTab === 'pending' 
                      ? "text-black border-b-2 border-black font-bold" 
                      : "text-[#76777d] hover:text-black"
                  )}
                >
                  Pending <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0edef] text-amber-700 font-bold">{pendingCount}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('approved'); setSelectedIds([]); }}
                  className={cn(
                    "pb-3 text-xs tracking-wider uppercase font-semibold relative transition-colors cursor-pointer",
                    activeTab === 'approved' 
                      ? "text-black border-b-2 border-black font-bold" 
                      : "text-[#76777d] hover:text-black"
                  )}
                >
                  Approved <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0edef] text-[#006a61] font-bold">{approvedCount}</span>
                </button>

                <button
                  onClick={() => { setActiveTab('rejected'); setSelectedIds([]); }}
                  className={cn(
                    "pb-3 text-xs tracking-wider uppercase font-semibold relative transition-colors cursor-pointer",
                    activeTab === 'rejected' 
                      ? "text-black border-b-2 border-black font-bold" 
                      : "text-[#76777d] hover:text-black"
                  )}
                >
                  Rejected <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0edef] text-red-600 font-bold">{rejectedCount}</span>
                </button>
              </div>

              <div className="flex items-center gap-4 pb-3 w-full sm:w-auto justify-between sm:justify-end">
                <label className="flex items-center gap-2 text-xs text-[#45464d] hover:text-black cursor-pointer transition-colors font-medium">
                  <input
                    type="checkbox"
                    checked={filteredPhotos.length > 0 && selectedIds.length === filteredPhotos.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-[#e5e3dc] text-black focus:ring-0 w-4 h-4 cursor-pointer"
                    disabled={filteredPhotos.length === 0}
                  />
                  Select All
                </label>
                
                <div className="h-4 w-px bg-[#e5e3dc] hidden sm:block"></div>
                <span className="text-[11px] text-[#76777d] font-semibold">Sorted by: Newest first</span>
              </div>
            </div>

            {/* Selected batch actions floating/top bar */}
            {selectedIds.length > 0 && (
              <div className="bg-black text-white px-5 py-3 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
                <span className="text-xs font-semibold">
                  {selectedIds.length} foto{selectedIds.length !== 1 ? 's' : ''} seleccionada{selectedIds.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePhotosStatus(selectedIds, 'approved')}
                    className="px-3.5 py-1.5 bg-[#0d9488] hover:bg-[#0d9488]/90 text-white rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => updatePhotosStatus(selectedIds, 'rejected')}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Rechazar
                  </button>
                </div>
              </div>
            )}

            {/* Gallery / Photos list */}
            {filteredPhotos.length === 0 ? (
              <div className="border border-dashed border-[#e5e3dc] bg-white rounded-2xl p-16 text-center text-xs text-[#76777d] leading-relaxed">
                <ImageIcon className="w-8 h-8 text-[#c6c6cd] mx-auto mb-2" />
                No hay fotos en esta pestaña. 
                {activeTab === 'all' && ' Comparte el QR para empezar a recibir imágenes.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6">
                {filteredPhotos.map((photo) => {
                  const displayUrl = photo.thumbnailUrl ?? photo.watermarkedUrl ?? photo.originalUrl
                  const isSelected = selectedIds.includes(photo.id)

                  return (
                    <div 
                      key={photo.id} 
                      className={cn(
                        "group bg-white border rounded-2xl overflow-hidden transition-all flex flex-col justify-between shadow-sm",
                        isSelected ? "border-black shadow-md" : "border-[#e5e3dc] hover:border-[#76777d]"
                      )}
                    >
                      {/* Photo container with vertical format fit */}
                      <div className="relative aspect-square w-full overflow-hidden bg-zinc-950/90 border-b border-[#e5e3dc] flex items-center justify-center">
                        <Image
                          src={displayUrl}
                          alt="Subida de invitado"
                          fill
                          className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 400px) 50vw, 25vw"
                        />
                        
                        {/* Checkbox (always visible if selected, otherwise visible on hover) */}
                        <div className={cn(
                          "absolute top-3 left-3 z-10 transition-opacity duration-200",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleSelect(photo.id, e.target.checked)}
                            className="rounded border-white/40 bg-black/35 text-black focus:ring-0 w-5 h-5 cursor-pointer"
                          />
                        </div>

                        {/* Status Badge overlay */}
                        <div className="absolute top-3 right-3 z-10">
                          {photo.status === 'approved' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#86f2e4] text-[#006f66] text-[8px] font-black uppercase tracking-wider border border-[#86f2e4]">
                              Approved
                            </span>
                          )}
                          {photo.status === 'pending' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[8px] font-black uppercase tracking-wider border border-blue-100">
                              Pending
                            </span>
                          )}
                          {photo.status === 'rejected' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-wider border border-red-100">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions card footer EXACTLY matching Google Stitch */}
                      <div className="p-3 flex items-center gap-2">
                        {/* Reject button (X) */}
                        <button
                          onClick={() => moderateSingle(photo.id, 'rejected')}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg border transition-colors active:scale-90 cursor-pointer",
                            photo.status === 'rejected' 
                              ? "border-red-600 bg-red-50 text-red-600" 
                              : "border-[#e5e3dc] text-red-600 hover:bg-red-50"
                          )}
                          title="Rechazar"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>

                        {/* Delete button (trash) */}
                        <button
                          onClick={() => deleteSingle(photo.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e5e3dc] text-[#76777d] hover:text-black hover:bg-slate-50 transition-colors active:scale-90 cursor-pointer"
                          title="Eliminar permanentemente"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                        
                        {/* Approve button */}
                        {photo.status === 'approved' ? (
                          <button
                            disabled
                            className="flex-1 bg-[#fcf8fa] text-[#76777d] text-[11px] font-extrabold py-2 rounded-lg flex items-center justify-center gap-1 cursor-not-allowed h-8 border border-[#e5e3dc]"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            Approved
                          </button>
                        ) : (
                          <button
                            onClick={() => moderateSingle(photo.id, 'approved')}
                            className="flex-1 bg-black text-white hover:bg-slate-800 text-[11px] font-extrabold py-2 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer h-8"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* MAIN TAB 2: ANALYTICS VIEW */}
        {currentMainTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d9488] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0d9488]"></span>
                </span>
                <span className="text-[10px] font-bold text-[#006a61] uppercase tracking-wider">Live Metrics</span>
              </div>
              <h2 className="text-xl font-bold text-black mt-0.5">{event.name}</h2>
              <p className="text-xs text-[#76777d]">Real-time performance metrics and guest engagement overview.</p>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Uploads */}
              <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-[#76777d] tracking-widest uppercase">Total Uploads</span>
                  <span className="material-symbols-outlined text-md text-[#76777d]">cloud_upload</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">
                      {totalCount >= 1000 ? `${(totalCount / 1000).toFixed(1)}k` : totalCount}
                    </span>
                    <span className="bg-teal-50 text-[#006f66] px-2 py-0.5 rounded-md text-[9px] font-bold">+12%</span>
                  </div>
                  <p className="text-[9px] text-[#76777d] font-semibold mt-1">Vs. last hour: {Math.max(Math.round(totalCount * 0.8), 0)}</p>
                </div>
              </div>

              {/* Card 2: Total Guests */}
              <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-[#76777d] tracking-widest uppercase">Total Guests</span>
                  <span className="material-symbols-outlined text-md text-[#76777d]">group</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">
                      {Math.max(Math.round(totalCount * 0.35), 0)}
                    </span>
                    <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md text-[9px] font-bold">
                      {Math.min(Math.round((Math.max(Math.round(totalCount * 0.35), 1) / 200) * 100), 100)}% Cap
                    </span>
                  </div>
                  <p className="text-[9px] text-[#76777d] font-semibold mt-1">Invited: 200</p>
                </div>
              </div>

              {/* Card 3: Approval Rate */}
              <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-[#76777d] tracking-widest uppercase">Approval Rate</span>
                  <span className="material-symbols-outlined text-md text-[#76777d]">verified_user</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#006a61]">
                      {totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 100}%
                    </span>
                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-[9px] font-bold">-2%</span>
                  </div>
                  <p className="text-[9px] text-[#76777d] font-semibold mt-1">Strict moderation active</p>
                </div>
              </div>

              {/* Card 4: Slideshow Views */}
              <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-[#76777d] tracking-widest uppercase">Slideshow Views</span>
                  <span className="material-symbols-outlined text-md text-[#76777d]">tv</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-black">
                      {totalCount * 6 >= 1000 ? `${((totalCount * 6) / 1000).toFixed(1)}k` : totalCount * 6}
                    </span>
                    <span className="bg-[#86f2e4] text-[#006f66] px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide uppercase">Live</span>
                  </div>
                  <p className="text-[9px] text-[#76777d] font-semibold mt-1">Across 4 main screens</p>
                </div>
              </div>
            </div>

            {/* Mid Section: Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Uploads Over Time (2/3 width) */}
              <div className="bg-white border border-[#e5e3dc] p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider">Uploads Over Time</h3>
                    <p className="text-[10px] text-[#76777d] mt-0.5">Engagement peaks during ceremony and reception</p>
                  </div>
                  <button className="px-3 py-1.5 bg-[#f6f3f5] text-xs font-bold text-[#45464d] rounded-lg border border-[#e5e3dc] flex items-center gap-1">
                    <span>Hourly</span>
                    <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
                  </button>
                </div>

                {/* Vertical Bar Chart */}
                {(() => {
                  const hours = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
                  const hourlyData = hours.map(h => {
                    const hrNum = parseInt(h.split(':')[0])
                    const count = photos.filter(p => new Date(p.uploadedAt).getHours() === hrNum).length
                    return { label: h, count }
                  })
                  const maxHourCount = Math.max(...hourlyData.map(d => d.count), 1)

                  return (
                    <div className="flex justify-between items-end h-44 pt-6 border-b border-[#e5e3dc] px-4 relative">
                      {hourlyData.map((data, i) => {
                        const heightPct = Math.max(Math.round((data.count / maxHourCount) * 100), 4)
                        return (
                          <div key={i} className="flex flex-col items-center gap-2 group w-12 relative">
                            {/* Hover tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[9px] font-bold px-2 py-1 rounded shadow absolute -top-10 pointer-events-none z-10 shrink-0 whitespace-nowrap">
                              {data.count} subida{data.count !== 1 ? 's' : ''}
                            </div>
                            
                            {/* Bar container */}
                            <div className="w-6 h-32 bg-[#f6f3f5] rounded-t-md transition-all duration-300 relative flex items-end overflow-hidden hover:bg-neutral-100">
                              <div 
                                className="w-full bg-[#0f172a] rounded-t-md transition-all" 
                                style={{ height: `${heightPct}%` }}
                              ></div>
                            </div>
                            
                            <span className="text-[10px] text-[#76777d] font-semibold mt-1">{data.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Device Breakdown (1/3 width) */}
              <div className="bg-white border border-[#e5e3dc] p-6 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider">Device Breakdown</h3>
                  <p className="text-[10px] text-[#76777d] mt-0.5">Guest devices used to scan and upload</p>
                </div>

                {/* Donut SVG */}
                <div className="flex justify-center my-2">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background track */}
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f6f3f5" strokeWidth="10" />
                      {/* Mobile Web Segment (75% of 251.3 circumference = 188.5) */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="transparent" 
                        stroke="#006a61" 
                        strokeWidth="10" 
                        strokeDasharray="188.5 251.3" 
                        strokeDashoffset="0"
                      />
                      {/* Kiosk Segment (25% of 251.3 circumference = 62.8) */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="transparent" 
                        stroke="#0f172a" 
                        strokeWidth="10" 
                        strokeDasharray="62.8 251.3" 
                        strokeDashoffset="-188.5"
                      />
                    </svg>
                    {/* Centered label */}
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black text-black leading-none">
                        {Math.max(Math.round(totalCount * 0.95), 1)}
                      </span>
                      <span className="text-[8px] text-[#76777d] uppercase font-bold tracking-wider mt-1">Dispositivos</span>
                    </div>
                  </div>
                </div>

                {/* Donut legends */}
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#006a61]"></span>
                      <span className="text-slate-600 font-medium">Mobile Web</span>
                    </div>
                    <span className="text-black font-extrabold">75%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0f172a]"></span>
                      <span className="text-slate-600 font-medium">Gallery Kiosk</span>
                    </div>
                    <span className="text-black font-extrabold">25%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Section: Top Contributors and Moderation Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Top Contributors (2/3 width) */}
              <div className="bg-white border border-[#e5e3dc] p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-[#e5e3dc] pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider">Top Contributors</h3>
                    <p className="text-[10px] text-[#76777d] mt-0.5">Most active guests uploading photos</p>
                  </div>
                  <button className="text-[10px] font-bold text-[#006a61] uppercase tracking-wider hover:underline cursor-pointer">
                    View All Guests
                  </button>
                </div>

                {/* Contributors List */}
                <div className="space-y-4 pt-1">
                  {/* Contributor 1 */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">SJ</div>
                      <div>
                        <h4 className="text-xs font-bold text-black">Sarah Jenkins</h4>
                        <p className="text-[9px] text-[#76777d] font-semibold mt-0.5">Table 12 • Diamond Guest</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-40 justify-end">
                      <div className="w-24 h-1.5 bg-[#f0edef] rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-[#0f172a] rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-xs font-black text-black whitespace-nowrap">
                        {Math.max(Math.round(totalCount * 0.15), 3)} subidas
                      </span>
                    </div>
                  </div>

                  {/* Contributor 2 */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700">MT</div>
                      <div>
                        <h4 className="text-xs font-bold text-black">Marcus Thorne</h4>
                        <p className="text-[9px] text-[#76777d] font-semibold mt-0.5">Table 4 • VIP Access</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-40 justify-end">
                      <div className="w-24 h-1.5 bg-[#f0edef] rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-[#0f172a] rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="text-xs font-black text-black whitespace-nowrap">
                        {Math.max(Math.round(totalCount * 0.11), 2)} subidas
                      </span>
                    </div>
                  </div>

                  {/* Contributor 3 */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">VG</div>
                      <div>
                        <h4 className="text-xs font-bold text-black">Valeria Gómez</h4>
                        <p className="text-[9px] text-[#76777d] font-semibold mt-0.5">Table 7 • Familia Novios</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-40 justify-end">
                      <div className="w-24 h-1.5 bg-[#f0edef] rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-[#0f172a] rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-xs font-black text-black whitespace-nowrap">
                        {Math.max(Math.round(totalCount * 0.08), 1)} subidas
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Moderation Activity (1/3 width) */}
              <div className="bg-white border border-[#e5e3dc] p-6 rounded-2xl shadow-sm space-y-4">
                <div className="border-b border-[#e5e3dc] pb-3">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider">Moderation Activity</h3>
                  <p className="text-[10px] text-[#76777d] mt-0.5">Proportion of approved vs rejected images</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="bg-teal-50/40 border border-[#e5e3dc] p-4 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-[#006a61] uppercase tracking-wider mb-1">Approved</p>
                    <p className="text-xl font-black text-[#006a61]">{approvedCount}</p>
                  </div>
                  
                  <div className="bg-red-50/40 border border-[#e5e3dc] p-4 rounded-xl text-center">
                    <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-1">Rejected</p>
                    <p className="text-xl font-black text-red-600">{rejectedCount}</p>
                  </div>
                </div>

                <div className="bg-[#f6f3f5] p-3.5 rounded-xl flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span className="font-medium">Avg. Moderation Time</span>
                  <span className="text-black font-extrabold">4.2s</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* MAIN TAB 3: QR PRINT TEMPLATES */}
        {currentMainTab === 'print' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-[#e5e3dc] p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-black mb-1">Kit de Impresión de Códigos QR</h3>
              <p className="text-xs text-[#76777d] mb-6">Elige el formato de papelería física ideal para colocar en el evento.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Template Selection Cards */}
                <button
                  onClick={() => setActivePrintTemplate('table-tent')}
                  className={cn(
                    "p-5 rounded-2xl border text-left flex flex-col justify-between min-h-[160px] cursor-pointer transition-all active:scale-[0.98]",
                    activePrintTemplate === 'table-tent' 
                      ? "border-black bg-[#fcf8fa]" 
                      : "border-[#e5e3dc] hover:border-[#76777d] bg-white"
                  )}
                >
                  <div className="space-y-2">
                    <span className="p-2.5 rounded-xl bg-orange-100 text-orange-700 inline-block">
                      <Layers className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-bold text-[#0f172a]">Tarjeta de Mesa (Table Tent)</h4>
                    <p className="text-2xs text-[#76777d] leading-relaxed">Formato vertical de 4x6" ideal para doblar por la mitad y situar en mesas individuales.</p>
                  </div>
                  <span className="text-[10px] font-bold text-black flex items-center gap-1 mt-3">
                    {activePrintTemplate === 'table-tent' ? '✓ Seleccionado' : 'Seleccionar'}
                  </span>
                </button>

                <button
                  onClick={() => setActivePrintTemplate('flyer')}
                  className={cn(
                    "p-5 rounded-2xl border text-left flex flex-col justify-between min-h-[160px] cursor-pointer transition-all active:scale-[0.98]",
                    activePrintTemplate === 'flyer' 
                      ? "border-black bg-[#fcf8fa]" 
                      : "border-[#e5e3dc] hover:border-[#76777d] bg-white"
                  )}
                >
                  <div className="space-y-2">
                    <span className="p-2.5 rounded-xl bg-teal-100 text-teal-700 inline-block">
                      <Printer className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-bold text-[#0f172a]">Flyer Informativo</h4>
                    <p className="text-2xs text-[#76777d] leading-relaxed">Formato de página completa (Carta/A4) con instrucciones en lista para la recepción.</p>
                  </div>
                  <span className="text-[10px] font-bold text-black flex items-center gap-1 mt-3">
                    {activePrintTemplate === 'flyer' ? '✓ Seleccionado' : 'Seleccionar'}
                  </span>
                </button>

                <button
                  onClick={() => setActivePrintTemplate('business-card')}
                  className={cn(
                    "p-5 rounded-2xl border text-left flex flex-col justify-between min-h-[160px] cursor-pointer transition-all active:scale-[0.98]",
                    activePrintTemplate === 'business-card' 
                      ? "border-black bg-[#fcf8fa]" 
                      : "border-[#e5e3dc] hover:border-[#76777d] bg-white"
                  )}
                >
                  <div className="space-y-2">
                    <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 inline-block">
                      <QrCode className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-bold text-[#0f172a]">Tarjeta de Bolsillo</h4>
                    <p className="text-2xs text-[#76777d] leading-relaxed">Mini-formato estilo tarjeta de presentación para reparto directo al ingreso de invitados.</p>
                  </div>
                  <span className="text-[10px] font-bold text-black flex items-center gap-1 mt-3">
                    {activePrintTemplate === 'business-card' ? '✓ Seleccionado' : 'Seleccionar'}
                  </span>
                </button>

              </div>

              {/* Preview Box */}
              <div className="mt-8 border border-[#e5e3dc] rounded-2xl p-6 bg-[#fcf8fa]/40 flex flex-col items-center">
                <h4 className="text-[10px] font-bold text-[#76777d] tracking-widest uppercase mb-4">Vista Previa de Impresión</h4>
                
                <div className="border border-[#e5e3dc] bg-white rounded-xl shadow-md p-6 max-w-sm w-full flex flex-col items-center">
                  
                  {activePrintTemplate === 'table-tent' && (
                    <div className="w-full text-center space-y-4 font-sans text-black py-4">
                      <span className="text-[8px] font-bold tracking-wider text-orange-700 bg-orange-100/60 px-2 py-0.5 rounded-full uppercase">Table Tent 4x6"</span>
                      <h5 className="text-lg font-bold mt-2 leading-tight">{event.name}</h5>
                      {event.qrCodeUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.qrCodeUrl} alt="QR" className="w-36 h-36 mx-auto border p-1 rounded bg-white shadow-sm" />
                      ) : (
                        <div className="w-32 h-32 border border-dashed flex items-center justify-center mx-auto text-xs text-gray-400">QR</div>
                      )}
                      <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-normal">
                        Doble por la línea punteada al imprimir en cartulina gruesa.
                      </p>
                    </div>
                  )}

                  {activePrintTemplate === 'flyer' && (
                    <div className="w-full text-center space-y-4 font-sans text-black py-4">
                      <span className="text-[8px] font-bold tracking-wider text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-full uppercase">Flyer Carta/A4</span>
                      <h5 className="text-xl font-extrabold mt-2 leading-tight">{event.name}</h5>
                      {event.qrCodeUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.qrCodeUrl} alt="QR" className="w-40 h-40 mx-auto border p-1 rounded bg-white shadow-sm" />
                      ) : (
                        <div className="w-32 h-32 border border-dashed flex items-center justify-center mx-auto text-xs text-gray-400">QR</div>
                      )}
                      <div className="text-left text-[9px] text-gray-600 bg-gray-50 p-2.5 rounded-lg border">
                        <strong className="text-black">Pasos para tus invitados:</strong>
                        <ol className="list-decimal list-inside mt-1 space-y-0.5">
                          <li>Escanea el código QR con el celular.</li>
                          <li>Toma una foto y envíala directamente.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {activePrintTemplate === 'business-card' && (
                    <div className="w-full font-sans text-black py-4 flex items-center justify-between gap-4">
                      <div className="space-y-3">
                        <span className="text-[8px] font-bold tracking-wider text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-full uppercase">Tarjeta de Bolsillo</span>
                        <h5 className="text-xs font-bold leading-tight line-clamp-2 mt-2">{event.name}</h5>
                        <p className="text-[8px] text-gray-400 mt-1">📸 Sube tus fotos en vivo</p>
                      </div>
                      
                      {event.qrCodeUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.qrCodeUrl} alt="QR" className="w-20 h-20 border p-0.5 rounded bg-white" />
                      ) : (
                        <div className="w-16 h-16 border border-dashed flex items-center justify-center text-[8px] text-gray-300">QR</div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN TAB 4: SETTINGS (Google Stitch style) */}
        {currentMainTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-black">Ajustes del Evento</h2>
              <p className="text-xs text-[#76777d]">Configura la información general, marca e identidad visual, y reglas de privacidad de tu galería.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Sub-navigation sidebar */}
              <div className="md:col-span-3">
                <nav className="flex flex-col gap-1 sticky top-20">
                  <button
                    onClick={() => setActiveSettingsTab('general')}
                    className={cn(
                      "flex items-center justify-between p-3 px-4 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer",
                      activeSettingsTab === 'general'
                        ? "bg-black text-white"
                        : "bg-white border border-[#e5e3dc] text-slate-700 hover:bg-[#f6f3f5]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      <span>General</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveSettingsTab('branding')}
                    className={cn(
                      "flex items-center justify-between p-3 px-4 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer",
                      activeSettingsTab === 'branding'
                        ? "bg-black text-white"
                        : "bg-white border border-[#e5e3dc] text-slate-700 hover:bg-[#f6f3f5]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span>Branding</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveSettingsTab('privacy')}
                    className={cn(
                      "flex items-center justify-between p-3 px-4 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer",
                      activeSettingsTab === 'privacy'
                        ? "bg-black text-white"
                        : "bg-white border border-[#e5e3dc] text-slate-700 hover:bg-[#f6f3f5]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Privacidad y Límites</span>
                    </div>
                  </button>
                </nav>
              </div>

              {/* Right Column: Bento panels */}
              <div className="md:col-span-9 space-y-6">
                
                {/* SUBTAB: GENERAL */}
                {activeSettingsTab === 'general' && (
                  <section className="bg-white border border-[#e5e3dc] p-6 rounded-2xl space-y-6 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-[#e5e3dc] pb-3">
                      <Info className="w-5 h-5 text-[#006a61]" />
                      <h3 className="text-sm font-bold text-black">Ajustes Generales</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nombre del Evento</label>
                        <input
                          type="text"
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          className="w-full bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs focus:border-[#0d9488] focus:ring-0"
                          placeholder="Nombre del evento"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">URL Slug</label>
                        <div className="flex">
                          <span className="bg-[#f0edef] border border-r-0 border-[#e5e3dc] px-3 py-3 rounded-l-xl text-xs text-slate-500 font-semibold select-none">
                            eventsnap.com/e/
                          </span>
                          <input
                            type="text"
                            value={eventSlug}
                            disabled
                            className="flex-grow bg-[#fcf8fa] border border-[#e5e3dc] rounded-r-xl p-3 text-xs cursor-not-allowed opacity-70"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Fecha del Evento</label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs focus:border-[#0d9488] focus:ring-0"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Estado del Evento</label>
                        <select
                          value={eventStatus}
                          onChange={(e) => setEventStatus(e.target.value as any)}
                          className="w-full bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs focus:border-[#0d9488] focus:ring-0"
                        >
                          <option value="active">Activo (Live)</option>
                          <option value="closed">Cerrado (Closed)</option>
                          <option value="archived">Archivado (Archived)</option>
                        </select>
                      </div>
                    </div>
                  </section>
                )}

                {/* SUBTAB: BRANDING */}
                {activeSettingsTab === 'branding' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="bg-white border border-[#e5e3dc] p-6 rounded-2xl space-y-6 shadow-sm lg:col-span-2">
                      <div className="flex items-center gap-2 border-b border-[#e5e3dc] pb-3">
                        <Palette className="w-5 h-5 text-[#006a61]" />
                        <h3 className="text-sm font-bold text-black">Branding e Identidad</h3>
                      </div>

                      {/* Event Logo Upload */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Logo del Evento (PNG transparente)</label>
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
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Color de Marca Principal</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="w-12 h-12 rounded-xl cursor-pointer border border-[#e5e3dc] p-0"
                          />
                          <input
                            type="text"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="flex-grow bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs uppercase focus:border-[#0d9488]"
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

                      {/* Watermark configuration parameters (logo position, text) */}
                      {customWatermark && (
                        <div className="space-y-4 pt-2 border-t border-[#e5e3dc]">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-black">Texto de Marca de Agua</label>
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
                                <label className="text-[10px] text-slate-500 font-bold uppercase">Texto del Estampado</label>
                                <input
                                  type="text"
                                  value={watermarkText}
                                  onChange={(e) => setWatermarkText(e.target.value)}
                                  className="w-full bg-white border border-[#e5e3dc] rounded-xl p-2.5 text-xs focus:border-[#0d9488]"
                                  placeholder={eventName}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase">Posición del Texto</label>
                                <select
                                  value={textPosition}
                                  onChange={(e) => setTextPosition(e.target.value)}
                                  className="w-full bg-white border border-[#e5e3dc] rounded-xl p-2.5 text-xs focus:border-[#0d9488]"
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
                                <label className="text-[10px] text-slate-500 font-bold uppercase">Posición del Logo</label>
                                <select
                                  value={logoPosition}
                                  onChange={(e) => setLogoPosition(e.target.value)}
                                  className="w-full bg-white border border-[#e5e3dc] rounded-xl p-2.5 text-xs focus:border-[#0d9488]"
                                >
                                  <option value="bottom-right">Abajo - Derecha</option>
                                  <option value="bottom-left">Abajo - Izquierda</option>
                                  <option value="top-right">Arriba - Derecha</option>
                                  <option value="top-left">Arriba - Izquierda</option>
                                  <option value="center">Centro</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase">Tamaño del Logo</label>
                                <select
                                  value={logoSize}
                                  onChange={(e) => setLogoSize(Number(e.target.value))}
                                  className="w-full bg-white border border-[#e5e3dc] rounded-xl p-2.5 text-xs focus:border-[#0d9488]"
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

                    {/* Branding Live Preview Sidecard */}
                    <section className="bg-[#f0edef] border border-[#e5e3dc] p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden h-fit">
                      <p className="absolute top-4 left-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vista Previa En Vivo</p>
                      
                      <div className="w-full max-w-[220px] bg-white rounded-2xl shadow-md overflow-hidden border border-[#e5e3dc] my-6">
                        <div className="aspect-[4/3] relative bg-zinc-950 flex items-center justify-center p-1">
                          <span className="text-zinc-600 text-2xs select-none">Foto de invitado</span>
                          
                          {/* Live simulated watermark overlay */}
                          {customWatermark && (
                            <div className="absolute inset-0 p-2 flex flex-col justify-between pointer-events-none">
                              {/* Top row */}
                              <div className="flex justify-between items-start w-full">
                                {logoUrl && logoPosition === 'top-left' && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={logoUrl} alt="logo" className="object-contain" style={{ width: `${logoSize * 1.5}px` }} />
                                )}
                                {showWatermarkText && textPosition === 'top-center' && (
                                  <span className="text-[7px] text-white/95 font-bold tracking-tight bg-black/45 px-1.5 py-0.5 rounded mx-auto">{watermarkText || eventName}</span>
                                )}
                                {logoUrl && logoPosition === 'top-right' && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={logoUrl} alt="logo" className="object-contain ml-auto" style={{ width: `${logoSize * 1.5}px` }} />
                                )}
                              </div>
                              
                              {/* Center row */}
                              <div className="flex-1 flex items-center justify-center w-full">
                                {logoUrl && logoPosition === 'center' && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={logoUrl} alt="logo" className="object-contain opacity-55" style={{ width: `${logoSize * 2.5}px` }} />
                                )}
                              </div>

                              {/* Bottom row */}
                              <div className="flex justify-between items-end w-full">
                                {logoUrl && logoPosition === 'bottom-left' && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={logoUrl} alt="logo" className="object-contain" style={{ width: `${logoSize * 1.5}px` }} />
                                )}
                                {showWatermarkText && textPosition === 'bottom-center' && (
                                  <span className="text-[7px] text-white/95 font-bold tracking-tight bg-black/45 px-1.5 py-0.5 rounded mx-auto">{watermarkText || eventName}</span>
                                )}
                                {showWatermarkText && textPosition === 'bottom-left' && (
                                  <span className="text-[7px] text-white/95 font-bold tracking-tight bg-black/45 px-1.5 py-0.5 rounded">{watermarkText || eventName}</span>
                                )}
                                {showWatermarkText && textPosition === 'bottom-right' && (
                                  <span className="text-[7px] text-white/95 font-bold tracking-tight bg-black/45 px-1.5 py-0.5 rounded ml-auto">{watermarkText || eventName}</span>
                                )}
                                {logoUrl && logoPosition === 'bottom-right' && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={logoUrl} alt="logo" className="object-contain ml-auto" style={{ width: `${logoSize * 1.5}px` }} />
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

                {/* SUBTAB: PRIVACY */}
                {activeSettingsTab === 'privacy' && (
                  <section className="bg-white border border-[#e5e3dc] p-6 rounded-2xl space-y-6 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-[#e5e3dc] pb-3">
                      <Shield className="w-5 h-5 text-[#006a61]" />
                      <h3 className="text-sm font-bold text-black">Seguridad, Privacidad y Restricciones</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Moderation style */}
                      <div className="space-y-4">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Flujo de Moderación de Fotos</label>
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

                      {/* Gallery Access */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Acceso a la Galería</label>
                          <select
                            value={galleryAccess}
                            onChange={(e) => setGalleryAccess(e.target.value)}
                            className="w-full bg-white border border-[#e5e3dc] rounded-xl p-3 text-xs focus:border-[#0d9488]"
                          >
                            <option value="public">Público (Cualquiera con el enlace)</option>
                            <option value="password">Protegido por contraseña</option>
                            <option value="invite">Solo con Invitación directa</option>
                          </select>
                        </div>

                        {/* Upload limits info */}
                        <div className="space-y-2 border-t border-[#e5e3dc] pt-3">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Límites de Subida de Invitado</label>
                          <div className="flex items-center justify-between text-xs py-1 border-b border-[#e5e3dc]/50">
                            <span className="text-slate-600 font-medium">Límite por Invitado</span>
                            <span className="text-black font-extrabold">{guestUploadLimit} fotos</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1 border-b border-[#e5e3dc]/50">
                            <span className="text-slate-600 font-medium">Tamaño máximo de archivo</span>
                            <span className="text-black font-extrabold">{maxFileSize} MB</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-600 font-medium">Extensiones permitidas</span>
                            <span className="text-2xs bg-[#f0edef] text-slate-700 px-2 py-0.5 rounded-lg font-bold">JPG, PNG, HEIC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

              </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#e5e3dc] mt-6">
              <button
                type="button"
                onClick={handleDiscardSettings}
                className="px-5 py-2.5 border border-[#e5e3dc] hover:bg-[#f6f3f5] text-[#0f172a] font-bold text-xs rounded-xl transition-all cursor-pointer bg-white"
              >
                Descartar Cambios
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings || uploadingLogo}
                className="px-6 py-2.5 bg-black text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed font-bold text-xs rounded-xl shadow-none active:scale-95 transition-all cursor-pointer"
              >
                {savingSettings ? 'Guardando Ajustes...' : 'Guardar Ajustes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
