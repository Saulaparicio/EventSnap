'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Play, Tv, Sparkles, QrCode } from 'lucide-react'

interface Photo {
  id: string
  url: string
  uploadedAt: string
}

interface Props {
  eventId: string
  eventName: string
  slug: string
  initialPhotos: Photo[]
  config: { speed?: number; order?: string; transition?: string }
  qrCodeUrl: string | null
}

interface Particle {
  id: number
  size: number
  left: number
  top: number
  delay: number
  duration: number
}

export default function Slideshow({ eventId, eventName, slug, initialPhotos, config, qrCodeUrl }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(
    config.order === 'random'
      ? [...initialPhotos].sort(() => Math.random() - 0.5)
      : initialPhotos
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreenActive, setIsFullscreenActive] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])

  // Double layer crossfade states
  const [activeLayer, setActiveLayer] = useState<1 | 2>(1)
  const [layer1Photo, setLayer1Photo] = useState<Photo | null>(photos[0] ?? null)
  const [layer2Photo, setLayer2Photo] = useState<Photo | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const speed = (config.speed ?? 8) * 1000 // default 8s

  // Generate particles on mount
  useEffect(() => {
    const list: Particle[] = []
    for (let i = 0; i < 35; i++) {
      list.push({
        id: i,
        size: Math.random() * 4 + 1.5,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 4 + 4,
      })
    }
    setParticles(list)
  }, [])

  // Detect Esc / fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenActive(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
      setIsFullscreenActive(true)
    } catch (err) {
      console.error('Error entering fullscreen:', err)
      setIsFullscreenActive(true) // fallback
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Poll for new photos
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${slug}/photos`)
        if (!res.ok) return
        const newPhotos: Photo[] = (await res.json()).map((p: { id: string; watermarkedUrl: string | null; uploadedAt: string }) => ({
          id: p.id,
          url: p.watermarkedUrl ?? '',
          uploadedAt: p.uploadedAt,
        }))
        setPhotos((prev) => {
          const apiIds = new Set(newPhotos.map((p) => p.id))
          const filtered = prev.filter((p) => apiIds.has(p.id))
          const existingIds = new Set(filtered.map((p) => p.id))
          const added = newPhotos.filter((p) => !existingIds.has(p.id))
          
          if (added.length === 0 && filtered.length === prev.length) return prev
          
          const all = config.order === 'random'
            ? [...filtered, ...added].sort(() => Math.random() - 0.5)
            : [...filtered, ...added]
          return all
        })
      } catch { /* silent */ }
    }, 5000)
    return () => clearInterval(poll)
  }, [slug, config.order])

  // Sync state if photos list is updated from polling
  useEffect(() => {
    if (photos.length === 0) {
      setLayer1Photo(null)
      setLayer2Photo(null)
      setCurrentIndex(0)
      return
    }

    // If the active photo was deleted, reset to the first available photo
    if (activeLayer === 1 && layer1Photo && !photos.some(p => p.id === layer1Photo.id)) {
      setLayer1Photo(photos[0] ?? null)
      setCurrentIndex(0)
    } else if (activeLayer === 2 && layer2Photo && !photos.some(p => p.id === layer2Photo.id)) {
      setLayer2Photo(photos[0] ?? null)
      setCurrentIndex(0)
    }

    if (photos.length > 0 && !layer1Photo && !layer2Photo) {
      setLayer1Photo(photos[0])
    }
  }, [photos, layer1Photo, layer2Photo, activeLayer])

  // Slide transition logic (Cross-fade layers)
  const advance = useCallback(() => {
    if (photos.length <= 1) return

    const nextIndex = (currentIndex + 1) % photos.length
    const nextPhoto = photos[nextIndex]

    if (activeLayer === 1) {
      setLayer2Photo(nextPhoto)
      setActiveLayer(2)
    } else {
      setLayer1Photo(nextPhoto)
      setActiveLayer(1)
    }
    
    setCurrentIndex(nextIndex)
  }, [photos, currentIndex, activeLayer])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isFullscreenActive && photos.length > 1) {
      intervalRef.current = setInterval(advance, speed)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [advance, speed, isFullscreenActive, photos.length])

  // URL of guest upload
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const eventUrl = `${appUrl}/e/${slug}`

  // Render Waiting Screen (Instructions before fullscreen)
  if (!isFullscreenActive) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center gap-8 text-white p-6 text-center select-none font-sans">
        <div className="space-y-3 max-w-lg">
          <div className="flex items-center justify-center gap-2 text-[#86f2e4] text-xs font-bold uppercase tracking-widest">
            <Tv className="w-4 h-4" />
            <span>Presentación en vivo</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{eventName}</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Proyecta esta pantalla en televisores o proyectores del salón. Las fotos tomadas por tus invitados aparecerán aquí automáticamente en tiempo real.
          </p>
        </div>

        <button
          onClick={enterFullscreen}
          className="px-8 py-4 bg-white text-black font-semibold rounded-xl text-md hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-white/5 flex items-center gap-2.5 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          Iniciar pantalla completa
        </button>

        <div className="mt-6 border border-slate-800 rounded-2xl p-5 bg-slate-900/40 backdrop-blur max-w-xs flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/events/${slug}/qr`}
            alt="QR del evento"
            className="w-28 h-28 rounded-lg object-contain bg-white p-1"
          />
          <div className="text-center">
            <p className="text-xs text-slate-300 font-semibold">Escanear código QR</p>
            <p className="text-[10px] text-slate-500 mt-1">Los invitados escanean para subir fotos desde el celular</p>
          </div>
        </div>
      </div>
    )
  }

  // Render Live Slideshow
  return (
    <div
      className="fixed inset-0 bg-black cursor-pointer overflow-hidden h-full w-full select-none"
      onClick={toggleFullscreen}
    >
      {/* Background & Centered Photo Presentation */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        {/* Layer 1 */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            activeLayer === 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {layer1Photo && (
            <>
              {/* Blurred background filling whole TV/screen */}
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-65 scale-110 brightness-75 transition-all duration-1000 ken-burns"
                style={{ backgroundImage: `url('${layer1Photo.url}')` }}
              />
              {/* Foreground full photo in original aspect ratio (vertical or horizontal) */}
              <div className="absolute inset-0 flex items-center justify-center p-6 md:p-12 z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={layer1Photo.url}
                  alt={eventName}
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)] transition-transform duration-1000"
                />
              </div>
            </>
          )}
        </div>

        {/* Layer 2 */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            activeLayer === 2 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {layer2Photo && (
            <>
              {/* Blurred background filling whole TV/screen */}
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-65 scale-110 brightness-75 transition-all duration-1000 ken-burns"
                style={{ backgroundImage: `url('${layer2Photo.url}')` }}
              />
              {/* Foreground full photo in original aspect ratio (vertical or horizontal) */}
              <div className="absolute inset-0 flex items-center justify-center p-6 md:p-12 z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={layer2Photo.url}
                  alt={eventName}
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)] transition-transform duration-1000"
                />
              </div>
            </>
          )}
        </div>
        
        {/* Cinematic overlays */}
        <div className="absolute inset-0 vignette pointer-events-none z-10" />
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-10" />
      </div>

      {/* Floating Particles Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bg-white/20 rounded-full blur-[1.5px] glimmer-particle"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Top Left: Live Feed indicator */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 slide-up shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-bold text-white tracking-widest uppercase font-sans">En Vivo</span>
        </div>
      </div>

      {/* Bottom overlay UI */}
      <div className="absolute bottom-0 left-0 w-full z-20 p-8 flex flex-col md:flex-row items-end justify-between gap-6">
        
        {/* Left: Event Details */}
        <div className="flex flex-col gap-2 slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-dark px-6 py-4 rounded-2xl flex flex-col shadow-2xl">
            <span className="text-xl md:text-2xl font-bold text-white leading-tight">{eventName}</span>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-white/60 font-sans">
              <span>Slideshow en vivo</span>
              <span className="w-1 h-1 rounded-full bg-white/40"></span>
              <span>{photos.length} foto{photos.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Right: QR Code invite */}
        <div className="flex items-center gap-4 slide-up z-20" style={{ animationDelay: '0.4s' }}>
          <div className="hidden sm:flex flex-col items-end gap-1 text-right max-w-[200px] text-white">
            <h3 className="text-sm font-bold flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-[#86f2e4]" />
              Sube tus fotos
            </h3>
            <p className="text-[10px] text-white/60 leading-normal font-sans">
              Escanea el código para unirte al álbum en vivo y subir tus capturas.
            </p>
          </div>
          
          <div className="p-2 qr-gradient rounded-xl shadow-2xl border border-white/10 transition-transform hover:scale-105 duration-300">
            <div className="relative w-24 h-24 md:w-28 md:h-28 bg-white flex items-center justify-center rounded-lg overflow-hidden border border-[#e5e3dc]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/events/${slug}/qr`}
                alt="QR del evento"
                className="w-full h-full p-1 object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-white p-1 rounded-md shadow-md border border-[#e5e3dc]">
                  <QrCode className="w-5 h-5 text-black" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
