'use client'

import { useRef, useState, useCallback } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'

type State = 'idle' | 'preview' | 'uploading' | 'done'

export default function CameraUpload({ slug }: { slug: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<State>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [watermarkedUrl, setWatermarkedUrl] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraActive(true)
    } catch {
      toast.error('No se pudo acceder a la cámara. Sube una foto desde tu galería.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setPreview(dataUrl)
    setState('preview')
    stopCamera()
  }, [stopCamera])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    setState('preview')
  }

  const sendPhoto = useCallback(async () => {
    if (!preview) return
    setState('uploading')

    try {
      const canvas = canvasRef.current!
      const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9)
      )

      const fd = new FormData()
      fd.append('photo', blob, 'photo.jpg')

      const res = await fetch(`/api/events/${slug}/photos`, { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Error al enviar la foto')
        setState('preview')
      } else {
        setWatermarkedUrl(data.watermarkedUrl ?? null)
        setState('done')
      }
    } catch {
      toast.error('Error de red. Intenta de nuevo.')
      setState('preview')
    }
  }, [preview, slug])

  const reset = () => {
    setPreview(null)
    setWatermarkedUrl(null)
    setState('idle')
  }

  if (state === 'done') {
    return (
      <div className="flex flex-col items-center gap-6 p-6 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold">¡Foto enviada!</h2>
        <p className="text-gray-400">Aparecerá en pantalla en unos segundos.</p>
        {watermarkedUrl && (
          <div className="space-y-3">
            <Image src={watermarkedUrl} alt="Tu foto" width={300} height={300} className="rounded-lg" />
                <a href={watermarkedUrl} download="mi-foto-evento.webp" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Descargar mi foto
            </a>
          </div>
        )}
        <Button onClick={reset} variant="outline">Tomar otra foto</Button>
      </div>
    )
  }

  if (state === 'preview' || state === 'uploading') {
    return (
      <div className="flex flex-col items-center gap-4 p-4 w-full max-w-md">
        {preview && (
          <Image src={preview} alt="Preview" width={400} height={400} className="rounded-lg w-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={reset} disabled={state === 'uploading'}>Retomar</Button>
          <Button className="flex-1" onClick={sendPhoto} disabled={state === 'uploading'}>
            {state === 'uploading' ? 'Enviando...' : 'Enviar foto ✓'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-md">
      {cameraActive ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-gray-900"
          />
          <canvas ref={canvasRef} className="hidden" />
          <Button onClick={capturePhoto} size="lg" className="w-full">
            📷 Tomar foto
          </Button>
        </>
      ) : (
        <div className="flex flex-col gap-3 w-full pt-4">
          <Button onClick={startCamera} size="lg" className="w-full">
            📷 Abrir cámara
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            🖼️ Elegir de galería
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  )
}
