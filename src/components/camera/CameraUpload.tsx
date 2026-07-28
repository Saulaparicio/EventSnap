'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Camera, Image as ImageIcon, RotateCw, X, Download, Share2, Link2, Users, Calendar, ChevronRight } from 'lucide-react'
import confetti from 'canvas-confetti'

type ScreenState = 'welcome' | 'camera' | 'preview' | 'confirmation'

interface Props {
  slug: string
  eventName: string
  eventDate: Date | string
}

interface ApprovedPhoto {
  id: string
  thumbnailUrl: string | null
  watermarkedUrl: string | null
}

export default function CameraUpload({ slug, eventName, eventDate }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [screen, setScreen] = useState<ScreenState>('welcome')
  const [preview, setPreview] = useState<string | null>(null)
  const [watermarkedUrl, setWatermarkedUrl] = useState<string | null>(null)
  const [fileToUpload, setFileToUpload] = useState<Blob | File | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [uploading, setUploading] = useState(false)
  const [latestPhotos, setLatestPhotos] = useState<ApprovedPhoto[]>([])

  // Fetch approved photos for the welcome screen collage
  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch(`/api/events/${slug}/photos`)
        if (res.ok) {
          const data = await res.json()
          setLatestPhotos(data.slice(0, 6)) // Get last 6 photos
        }
      } catch {
        // silent fallback
      }
    }
    if (screen === 'welcome') {
      fetchLatest()
    }
  }, [slug, screen])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      toast.error('No se pudo acceder a la cámara. Intenta subir una foto desde la galería.')
      setScreen('welcome')
    }
  }, [stopCamera])

  const changeScreen = useCallback((target: ScreenState) => {
    if (target === 'camera') {
      setScreen('camera')
      // Start camera streaming
      setTimeout(() => startCamera(facingMode), 100)
    } else {
      stopCamera()
      setScreen(target)
    }
    // Simulate haptics
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(15)
    }
  }, [startCamera, stopCamera, facingMode])

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // If front camera is used, mirror the photo horizontally
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (blob) {
        setFileToUpload(blob)
      }
    }, 'image/jpeg', 0.9)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setPreview(dataUrl)
    changeScreen('preview')
  }, [facingMode, changeScreen])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileToUpload(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
    changeScreen('preview')
  }

  const sendPhoto = useCallback(async () => {
    if (!fileToUpload) return
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('photo', fileToUpload, 'photo.jpg')

      const res = await fetch(`/api/events/${slug}/photos`, { method: 'POST', body: fd })
      let data: any = {}
      try {
        data = await res.json()
      } catch {
        // Non-JSON response
      }

      if (!res.ok) {
        toast.error(data.error ?? `Error al enviar la foto (${res.status})`)
        changeScreen('preview')
      } else {
        setWatermarkedUrl(data.watermarkedUrl ?? null)
        changeScreen('confirmation')
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0d9488', '#86f2e4', '#ffffff', '#ffb703', '#fb8500']
          })
        } catch {
          // ignore confetti error
        }
      }
    } catch (err: any) {
      console.error('Error sending photo:', err)
      toast.error(err?.message ?? 'Error de conexión al enviar la foto.')
      changeScreen('preview')
    } finally {
      setUploading(false)
    }
  }, [fileToUpload, slug, changeScreen])

  const copyEventLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/e/${slug}`
      navigator.clipboard.writeText(url)
      toast.success('¡Enlace del evento copiado!')
    }
  }

  const sharePhoto = () => {
    if (typeof window !== 'undefined' && navigator.share && watermarkedUrl) {
      navigator.share({
        title: eventName,
        text: `Mira mi foto en el evento ${eventName}`,
        url: watermarkedUrl,
      }).catch(() => {})
    } else {
      copyEventLink()
    }
  }

  const reset = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setWatermarkedUrl(null)
    setFileToUpload(null)
    changeScreen('welcome')
  }

  return (
    <div className="w-full min-h-screen bg-[#fcf8fa] text-[#1b1b1d] font-sans antialiased flex flex-col justify-between selection:bg-[#86f2e4] selection:text-[#006f66]">
      {/* SCREEN 1: WELCOME / LANDING */}
      {screen === 'welcome' && (
        <div className="screen-transition flex-1 flex flex-col min-h-screen bg-surface">
          {/* TopNavBar */}
          <header className="fixed top-0 left-0 w-full z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
            <div className="max-w-6xl mx-auto px-6 h-14 flex justify-between items-center">
              <div className="text-[15px] font-black text-black tracking-tight">
                EventSnap
              </div>
              <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
                <a className="text-slate-500 hover:text-black transition-colors" href="#about">Acerca de</a>
                <a className="text-slate-500 hover:text-black transition-colors" href="#how">Cómo funciona</a>
                <a className="text-slate-500 hover:text-black transition-colors" href="#gallery">Galería</a>
              </nav>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => changeScreen('camera')}
                  className="bg-black text-white px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  Unirse en Vivo
                </button>
              </div>
            </div>
          </header>

          <main className="flex-grow pt-14 pb-20 lg:pb-8">
            {/* Hero Section */}
            <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden px-6 bg-[#0f172a] text-white">
              {/* Opulent dark background overlay */}
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0f172a]/90 z-10"></div>
                <div className="w-full h-full bg-cover bg-center transition-transform duration-1000 scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200')" }}></div>
              </div>

              <div className="relative z-20 text-center max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-white/90">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(eventDate)}</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">{eventName}</h1>
                <p className="text-sm text-white/80 font-medium tracking-wide">
                  📸 Comparte tus fotos al instante en la pantalla gigante del salón
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => changeScreen('camera')}
                    className="bg-white text-black px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#f6f3f5] transition-all flex items-center justify-center gap-2 group active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    Tomar Foto en Vivo
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Subir desde Galería
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </section>

            {/* Bento Grid (About Event) */}
            <section className="max-w-6xl mx-auto py-12 px-6" id="about">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 bg-[#f6f3f5] p-6 rounded-2xl border border-[#e5e3dc] flex flex-col justify-center transition-all hover:-translate-y-1">
                  <h2 className="text-lg font-bold text-black mb-2">Sobre el Álbum en Vivo</h2>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Bienvenido a **{eventName}**. En esta ocasión especial, estamos creando una memoria fotográfica colectiva en tiempo real. Utilizando **EventSnap**, cualquier foto que tomes o subas desde esta página se sumará de forma instantánea al carrusel interactivo proyectado en la pantalla del evento.
                  </p>
                </div>
                
                <div className="md:col-span-4 bg-[#dae2fd]/40 p-6 rounded-2xl border border-[#e5e3dc] flex flex-col items-center justify-center text-center transition-all hover:-translate-y-1">
                  <div className="bg-white p-2.5 rounded-full mb-3 shadow-sm border border-[#e5e3dc]">
                    <span className="material-symbols-outlined text-2xl text-black">bolt</span>
                  </div>
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider">Carga Instantánea</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-medium">Sin aplicaciones ni registros. Solo escanea, captura y visualiza tu momento.</p>
                </div>

                <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-[#e5e3dc] transition-all hover:-translate-y-1 space-y-3">
                  <span className="p-2.5 rounded-xl bg-teal-50 border border-[#e5e3dc] inline-block">
                    <Camera className="w-5 h-5 text-[#0d9488]" />
                  </span>
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider">Captura el Momento</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Ayúdanos a capturar cada sonrisa, brindis y baile desde tu perspectiva.</p>
                </div>

                <div className="md:col-span-8 bg-[#f0edef] border border-[#e5e3dc] rounded-2xl overflow-hidden min-h-[180px] relative transition-all hover:-translate-y-1">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200')" }}></div>
                </div>
              </div>
            </section>

            {/* Gallery Preview Grid */}
            <section className="bg-white border-y border-[#e5e3dc] py-12 px-6" id="gallery">
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-end border-b pb-3 border-[#e5e3dc]">
                  <div>
                    <h2 className="text-lg font-bold text-black">Galería del Evento</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Fotos compartidas en vivo desde el salón</p>
                  </div>
                  <Link
                    href={`/e/${slug}/gallery`}
                    className="text-xs font-bold text-black border-b border-black hover:opacity-75 transition-all pb-0.5"
                  >
                    Ver Galería Completa
                  </Link>
                </div>

                {latestPhotos.length === 0 ? (
                  <div className="aspect-[3/1] border border-dashed border-[#e5e3dc] rounded-2xl flex flex-col items-center justify-center p-8 text-center text-xs text-[#76777d]">
                    <span className="material-symbols-outlined text-3xl text-[#c6c6cd] mb-2">image</span>
                    Aún no hay fotos en el álbum. ¡Sé el primero en subir un momento!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {latestPhotos.slice(0, 4).map((photo) => (
                      <div key={photo.id} className="aspect-square bg-[#f6f3f5] border border-[#e5e3dc] rounded-2xl overflow-hidden relative group">
                        <Image
                          src={photo.thumbnailUrl ?? photo.watermarkedUrl ?? ''}
                          alt="Momento"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 400px) 50vw, 25vw"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* How to Participate Section */}
            <section className="max-w-6xl mx-auto py-12 px-6" id="how">
              <div className="text-center mb-10">
                <h2 className="text-lg font-bold text-black">Cómo Participar</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tres sencillos pasos para proyectar tus recuerdos</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-white border border-[#e5e3dc] flex items-center justify-center mb-2 shadow-sm">
                    <span className="material-symbols-outlined text-2xl text-black">qr_code_scanner</span>
                  </div>
                  <h3 className="text-xs font-bold text-black">1. Escanea el Código</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">Encuentra los códigos QR colocados en las mesas del salón.</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-white border border-[#e5e3dc] flex items-center justify-center mb-2 shadow-sm">
                    <span className="material-symbols-outlined text-2xl text-black">photo_camera</span>
                  </div>
                  <h3 className="text-xs font-bold text-black">2. Captura un Momento</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">Toma una foto en tiempo real o selecciona una de tu galería móvil.</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-white border border-[#e5e3dc] flex items-center justify-center mb-2 shadow-sm">
                    <span className="material-symbols-outlined text-2xl text-black">tv</span>
                  </div>
                  <h3 className="text-xs font-bold text-black">3. Mírala en Vivo</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">Listo! Tu foto se estampa y se proyecta en la pantalla gigante.</p>
                </div>
              </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="bg-[#f0edef] border-t border-[#e5e3dc] py-8 px-6 text-center text-xs text-[#76777d] mt-auto">
            <div className="max-w-6xl mx-auto space-y-3">
              <p className="font-semibold text-black">EventSnap Live Platform</p>
              <p className="max-w-sm mx-auto leading-relaxed text-[11px]">Transformamos celebraciones en galerías colaborativas interactivas.</p>
              <div className="pt-2 flex justify-center gap-4 text-[11px] font-bold">
                <Link href={`/e/${slug}/gallery`} className="text-slate-600 hover:text-black">Galería Compartida</Link>
                <span>•</span>
                <Link href={`/e/${slug}/help`} className="text-slate-600 hover:text-black">Ayuda</Link>
              </div>
              <p className="text-[10px] pt-4">© 2026 EventSnap. Todos los derechos reservados.</p>
            </div>
          </footer>

          {/* Bottom Navigation (Mobile Only) */}
          <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-white/90 backdrop-blur-md border-t border-[#e5e3dc] flex justify-around items-center py-2 pb-safe shadow-lg">
            <a className="flex flex-col items-center justify-center text-black font-bold" href="#">
              <span className="material-symbols-outlined text-xl">home</span>
              <span className="text-[9px] uppercase tracking-wider mt-0.5">Inicio</span>
            </a>
            <Link className="flex flex-col items-center justify-center text-slate-500 hover:text-black" href={`/e/${slug}/gallery`}>
              <span className="material-symbols-outlined text-xl">photo_library</span>
              <span className="text-[9px] uppercase tracking-wider mt-0.5">Galería</span>
            </Link>
            <div className="relative -mt-6">
              <button
                onClick={() => changeScreen('camera')}
                className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer border border-[#e5e3dc]"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <a className="flex flex-col items-center justify-center text-slate-500 hover:text-black" href="#how">
              <span className="material-symbols-outlined text-xl">info</span>
              <span className="text-[9px] uppercase tracking-wider mt-0.5">Guía</span>
            </a>
            <Link className="flex flex-col items-center justify-center text-slate-500 hover:text-black" href={`/e/${slug}/help`}>
              <span className="material-symbols-outlined text-xl">help</span>
              <span className="text-[9px] uppercase tracking-wider mt-0.5">Ayuda</span>
            </Link>
          </nav>
        </div>
      )}

      {/* SCREEN 2: CAMERA VIEW FINDER */}
      {screen === 'camera' && (
        <div className="screen-transition fixed inset-0 h-[100dvh] w-full bg-black z-50 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 text-white z-20 bg-gradient-to-b from-black/80 to-transparent shrink-0">
            <button className="p-2 cursor-pointer" onClick={() => changeScreen('welcome')}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold tracking-widest uppercase opacity-90 truncate max-w-[200px]">{eventName}</span>
            <button
              onClick={toggleFacingMode}
              className="p-2 cursor-pointer text-white/90 hover:text-white"
              title="Cambiar cámara"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          {/* Viewfinder */}
          <div className="flex-1 min-h-0 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Watermark Live Overlay Preview */}
            <div className="absolute bottom-4 right-4 glass-dark px-3 py-1.5 rounded-lg border border-white/15 scale-90 origin-bottom-right shadow-lg z-10">
              <p className="text-[10px] font-semibold text-white/90 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488]"></span>
                {eventName}
              </p>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Controls */}
          <div className="bg-black/95 py-5 pb-10 px-8 flex items-center justify-around z-20 border-t border-zinc-900 shrink-0">
            <button
              onClick={toggleFacingMode}
              className="text-white hover:bg-zinc-900 p-3 rounded-full transition-colors cursor-pointer flex flex-col items-center gap-1 text-[10px] font-medium"
              title="Girar cámara"
            >
              <RotateCw className="w-6 h-6" />
              <span>Girar</span>
            </button>
            
            <button
              onClick={capturePhoto}
              className="rounded-full active:scale-95 transition-transform bg-transparent cursor-pointer p-1 border-4 border-white/40 hover:border-white shadow-xl"
              title="Capturar foto"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center active:bg-zinc-200">
                <Camera className="w-7 h-7 text-black" />
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-white hover:bg-zinc-900 p-3 rounded-full transition-colors cursor-pointer flex flex-col items-center gap-1 text-[10px] font-medium"
              title="Subir de galería"
            >
              <ImageIcon className="w-6 h-6" />
              <span>Galería</span>
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: PHOTO PREVIEW */}
      {screen === 'preview' && (
        <div className="screen-transition fixed inset-0 bg-[#fcf8fa] z-50 flex flex-col">
          <div className="h-[60%] relative bg-[#dcd9db] overflow-hidden">
            {preview && (
              <Image
                src={preview}
                alt="Vista previa"
                fill
                className="object-contain"
                priority
              />
            )}
            <button
              onClick={() => changeScreen('camera')}
              className="absolute top-4 left-4 bg-black/45 text-white p-2.5 rounded-full hover:bg-black/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 px-6 py-8 flex flex-col justify-between max-w-sm mx-auto w-full">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold text-[#0f172a]">¿Se ve bien?</h2>
              <p className="text-xs text-[#45464d] leading-relaxed">
                Tu foto se enviará al evento y se aplicará el diseño de marca de agua de manera automática.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={sendPhoto}
                disabled={uploading}
                className="w-full py-4 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-semibold text-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>Enviando...</>
                ) : (
                  <>Enviar foto ✓</>
                )}
              </button>
              
              <button
                onClick={() => changeScreen('camera')}
                disabled={uploading}
                className="w-full py-3.5 text-[#45464d] hover:text-[#0f172a] font-semibold text-xs transition-colors cursor-pointer"
              >
                Tomar otra foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 4: CONFIRMATION */}
      {screen === 'confirmation' && (
        <div className="screen-transition fixed inset-0 bg-[#fcf8fa] z-[60] flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
            {/* Checked checkmark animation */}
            <div className="mb-2">
              <svg className="success-checkmark" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
                <circle className="checkmark__circle" cx="26" cy="26" fill="none" r="25"></circle>
                <path className="checkmark__check" d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none"></path>
              </svg>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-[#0f172a]">¡Foto enviada!</h1>
              <p className="text-xs text-[#45464d] max-w-[280px]">Se proyectará en la pantalla del salón en unos instantes.</p>
            </div>

            {watermarkedUrl && (
              <div className="w-36 aspect-[3/4] rounded-xl border border-[#e5e3dc] overflow-hidden bg-[#f0edef] relative shadow-md">
                <Image
                  src={watermarkedUrl}
                  alt="Tu foto final"
                  fill
                  className="object-cover"
                  sizes="150px"
                />
              </div>
            )}

            <div className="w-full flex flex-col gap-3">
              {watermarkedUrl && (
                <a
                  href={watermarkedUrl}
                  download={`foto-${slug}.webp`}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    "w-full py-4 border border-[#e5e3dc] hover:bg-[#f6f3f5] rounded-xl flex items-center justify-center gap-2 font-semibold text-xs text-[#45464d] cursor-pointer shadow-none"
                  )}
                >
                  <Download className="w-4 h-4" />
                  Descargar foto con marca de agua
                </a>
              )}
              
              <Link
                href={`/e/${slug}/gallery`}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  "w-full py-4 border border-[#e5e3dc] hover:bg-[#f6f3f5] rounded-xl flex items-center justify-center gap-2 font-semibold text-xs text-[#45464d] cursor-pointer shadow-none"
                )}
              >
                <span className="material-symbols-outlined text-[18px]">photo_library</span>
                Ver todas las fotos del evento
              </Link>
              
              <button
                onClick={reset}
                className="w-full py-4 bg-[#0d9488] hover:bg-[#0d9488]/90 text-white rounded-xl font-semibold text-sm active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                Subir otra foto
              </button>
            </div>

            {/* Sharing tools */}
            <div className="w-full pt-4 border-t border-[#e5e3dc] flex flex-col items-center gap-4">
              <p className="text-[10px] font-bold text-[#76777d] tracking-widest uppercase">Compartir el evento</p>
              <div className="flex gap-4">
                <button
                  onClick={sharePhoto}
                  className="w-10 h-10 rounded-full border border-[#e5e3dc] flex items-center justify-center text-[#45464d] hover:bg-[#f6f3f5] transition-colors cursor-pointer"
                  title="Compartir enlace de foto"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={copyEventLink}
                  className="w-10 h-10 rounded-full border border-[#e5e3dc] flex items-center justify-center text-[#45464d] hover:bg-[#f6f3f5] transition-colors cursor-pointer"
                  title="Copiar enlace del evento"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <button
                  onClick={copyEventLink}
                  className="w-10 h-10 rounded-full border border-[#e5e3dc] flex items-center justify-center text-[#45464d] hover:bg-[#f6f3f5] transition-colors cursor-pointer"
                  title="Invitados"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
