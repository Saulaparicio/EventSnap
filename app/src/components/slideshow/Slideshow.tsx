'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'

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

export default function Slideshow({ eventId, eventName, slug, initialPhotos, config, qrCodeUrl }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(
    config.order === 'random'
      ? [...initialPhotos].sort(() => Math.random() - 0.5)
      : initialPhotos
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const speed = (config.speed ?? 5) * 1000

  // Poll for new photos every 5 seconds (SSE/Socket.io can replace later)
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
          const existingIds = new Set(prev.map((p) => p.id))
          const added = newPhotos.filter((p) => !existingIds.has(p.id))
          if (added.length === 0) return prev
          const all = config.order === 'random'
            ? [...prev, ...added].sort(() => Math.random() - 0.5)
            : [...prev, ...added]
          return all
        })
      } catch { /* silent */ }
    }, 5000)
    return () => clearInterval(poll)
  }, [slug, config.order])

  // Auto-advance with fade transition
  const advance = useCallback(() => {
    if (photos.length <= 1) return
    setVisible(false)
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % photos.length)
      setVisible(true)
    }, 500)
  }, [photos.length])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(advance, speed)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [advance, speed])

  const currentPhoto = photos[currentIndex]

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-8 text-white">
        <h1 className="text-4xl font-bold">{eventName}</h1>
        <p className="text-xl text-gray-400 animate-pulse">Esperando fotos...</p>
        {qrCodeUrl && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-gray-400">Escanea el QR para subir tu foto</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeUrl} alt="QR" className="w-32 h-32" />
          </div>
        )}
        <p className="text-sm text-gray-600">
          {appUrl}/e/{slug}
        </p>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black cursor-pointer"
      onClick={() => document.documentElement.requestFullscreen?.()}
    >
      {currentPhoto && (
        <Image
          key={currentPhoto.id}
          src={currentPhoto.url}
          alt="foto evento"
          fill
          className={`object-contain transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
          priority
        />
      )}

      {/* Overlay: event name */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <div className="bg-black/50 rounded-lg px-3 py-1.5">
          <p className="text-white font-semibold text-sm">{eventName}</p>
          <p className="text-gray-400 text-xs">{photos.length} foto{photos.length !== 1 ? 's' : ''}</p>
        </div>
        {qrCodeUrl && (
          <div className="bg-white rounded-lg p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeUrl} alt="QR" className="w-20 h-20" />
          </div>
        )}
      </div>
    </div>
  )
}
