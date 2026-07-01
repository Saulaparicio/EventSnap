'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Camera, Image as ImageIcon, RotateCw, X, Download, Share2, Link2, Users } from 'lucide-react'

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
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Error al enviar la foto')
        changeScreen('preview')
      } else {
        setWatermarkedUrl(data.watermarkedUrl ?? null)
        changeScreen('confirmation')
      }
    } catch {
      toast.error('Error de red. Intenta de nuevo.')
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
        <div className="screen-transition flex-1 flex flex-col items-center justify-between py-12 px-6 max-w-md mx-auto w-full">
          <header className="w-full flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full border border-[#e5e3dc] flex items-center justify-center overflow-hidden bg-white shadow-sm">
              <span className="material-symbols-outlined text-4xl text-[#0f172a]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">{eventName}</h1>
              <p className="text-[11px] font-semibold text-[#76777d] tracking-widest uppercase">{formatDate(eventDate)}</p>
            </div>
          </header>

          <main className="w-full flex flex-col gap-8 items-center py-6">
            <button
              onClick={() => changeScreen('camera')}
              className="w-full py-4 px-6 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl flex items-center justify-center gap-2.5 font-semibold text-sm transition-all active:scale-95 duration-100 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">photo_camera</span>
              Tomar una foto
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-6 bg-white hover:bg-[#f6f3f5] text-[#0f172a] border border-[#e5e3dc] rounded-xl flex items-center justify-center gap-2.5 font-semibold text-sm transition-all active:scale-95 duration-100 shadow-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">photo_library</span>
              Subir desde galería
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Collage of latest moments */}
            <div className="w-full space-y-4">
              <h3 className="text-[10px] font-bold text-[#45464d] tracking-widest uppercase text-center">Últimos Momentos</h3>
              
              {latestPhotos.length === 0 ? (
                <div className="aspect-[2/1] border border-dashed border-[#e5e3dc] rounded-xl flex flex-col items-center justify-center p-6 text-center text-xs text-[#76777d]">
                  <span className="material-symbols-outlined text-3xl text-[#c6c6cd] mb-2">image</span>
                  Aún no hay fotos. ¡Sé el primero en subir una!
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {latestPhotos.map((photo, i) => (
                    <div key={photo.id} className="aspect-square bg-[#f0edef] rounded-lg overflow-hidden relative">
                      <Image
                        src={photo.thumbnailUrl ?? photo.watermarkedUrl ?? ''}
                        alt="Momento"
                        fill
                        className="object-cover opacity-80 hover:opacity-100 transition-opacity duration-350"
                        sizes="(max-width: 400px) 30vw"
                      />
                    </div>
                  ))}
                  {/* Fill empty spots to keep structure if less than 6 */}
                  {latestPhotos.length > 0 && latestPhotos.length < 6 && (
                    Array.from({ length: 6 - latestPhotos.length }).map((_, idx) => (
                      <div key={idx} className="aspect-square bg-[#f6f3f5] border border-dashed border-[#e5e3dc] rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg text-[#c6c6cd]">camera_alt</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>

          <footer className="text-center w-full pt-4 border-t border-[#e5e3dc] flex flex-col gap-3">
            <p className="text-xs text-[#76777d] leading-relaxed">Tu foto se proyectará en tiempo real en la pantalla del evento.</p>
            <div className="flex justify-center gap-4 text-xs font-semibold">
              <Link href={`/e/${slug}/gallery`} className="text-[#0f172a] hover:text-black flex items-center gap-1.5 cursor-pointer">
                <span className="material-symbols-outlined text-[15px]">photo_library</span>
                Ver Galería Pública
              </Link>
              <span className="text-[#e5e3dc]">|</span>
              <Link href={`/e/${slug}/help`} className="text-[#45464d] hover:text-black flex items-center gap-1.5 cursor-pointer">
                <span className="material-symbols-outlined text-[15px]">help</span>
                ¿Necesitas ayuda?
              </Link>
            </div>
          </footer>
        </div>
      )}

      {/* SCREEN 2: CAMERA VIEW FINDER */}
      {screen === 'camera' && (
        <div className="screen-transition fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 text-white z-10 bg-gradient-to-b from-black/60 to-transparent">
            <button className="p-2 cursor-pointer" onClick={() => changeScreen('welcome')}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold tracking-widest uppercase opacity-90">{eventName}</span>
            <div className="w-9"></div> {/* balance spacer */}
          </div>

          {/* Viewfinder */}
          <div className="flex-1 relative bg-zinc-950 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Watermark Live Overlay Preview */}
            <div className="absolute bottom-4 right-4 glass-dark px-3 py-1.5 rounded-lg border border-white/15 scale-90 origin-bottom-right shadow-lg">
              <p className="text-[10px] font-semibold text-white/90 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488]"></span>
                {eventName}
              </p>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Controls */}
          <div className="bg-black py-8 px-8 flex items-center justify-between z-10 border-t border-zinc-900">
            <button
              onClick={toggleFacingMode}
              className="text-white hover:bg-zinc-900 p-3 rounded-full transition-colors cursor-pointer"
            >
              <RotateCw className="w-6 h-6 animate-none" />
            </button>
            
            <button
              onClick={capturePhoto}
              className="camera-btn-outer rounded-full active:scale-90 transition-transform bg-transparent cursor-pointer"
            >
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-white hover:bg-zinc-900 p-3 rounded-full transition-colors cursor-pointer"
            >
              <ImageIcon className="w-6 h-6" />
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
