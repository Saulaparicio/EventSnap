'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Camera, Download, Share2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface Photo {
  id: string
  watermarkedUrl: string | null
  thumbnailUrl: string | null
  originalUrl: string
  uploadedAt: string
}

interface EventData {
  name: string
  slug: string
  date: string
}

interface Props {
  event: EventData
  photos: Photo[]
}

export default function GuestPublicGallery({ event, photos }: Props) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index)
  }

  const closeLightbox = () => {
    setSelectedPhotoIndex(null)
  }

  const navigateLightbox = (dir: 'next' | 'prev') => {
    if (selectedPhotoIndex === null) return
    let nextIndex = selectedPhotoIndex + (dir === 'next' ? 1 : -1)
    if (nextIndex >= photos.length) nextIndex = 0
    if (nextIndex < 0) nextIndex = photos.length - 1
    setSelectedPhotoIndex(nextIndex)
  }

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null

  const sharePhoto = () => {
    if (!selectedPhoto) return
    const url = selectedPhoto.watermarkedUrl ?? selectedPhoto.originalUrl
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: event.name,
        text: `Mira esta foto del evento ${event.name}`,
        url: url,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      toast.success('¡Enlace de la foto copiado!')
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#fcf8fa] text-[#1b1b1d] font-sans antialiased flex flex-col justify-between selection:bg-[#86f2e4] selection:text-[#006f66]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e5e3dc] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/e/${event.slug}`} className="p-2 hover:bg-[#f6f3f5] rounded-full border border-[#e5e3dc] transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-[#45464d]" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-[#0f172a] leading-tight line-clamp-1">{event.name}</h1>
            <p className="text-[10px] text-[#76777d] font-semibold tracking-wider uppercase mt-0.5">{formatDate(event.date)}</p>
          </div>
        </div>
        
        <Link 
          href={`/e/${event.slug}`} 
          className="bg-black text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0"
        >
          <Camera className="w-3.5 h-3.5" />
          Subir Foto
        </Link>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        <div className="text-center space-y-2 max-w-sm mx-auto">
          <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Galería del Evento</h2>
          <p className="text-xs text-[#45464d] leading-relaxed">
            Explora y descarga las fotos subidas por los invitados. Las fotos se actualizan en vivo.
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="border border-dashed border-[#e5e3dc] rounded-2xl p-16 text-center text-xs text-[#76777d] bg-white shadow-none">
            <span className="material-symbols-outlined text-4xl text-[#c6c6cd] mb-2">photo_library</span>
            <p className="font-semibold">Aún no hay fotos aprobadas en la galería.</p>
            <p className="mt-1 text-[#acacb5]">¡Sé el primero en subir un momento especial!</p>
            <Link 
              href={`/e/${event.slug}`}
              className="inline-flex items-center gap-1.5 bg-black text-white hover:bg-slate-800 rounded-xl px-4 py-2.5 font-bold text-xs shadow-none mt-4 transition-transform active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              Tomar mi primera foto
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => {
              const displayUrl = photo.thumbnailUrl ?? photo.watermarkedUrl ?? photo.originalUrl
              return (
                <div 
                  key={photo.id}
                  onClick={() => openLightbox(index)}
                  className="aspect-[3/4] bg-white border border-[#e5e3dc] rounded-2xl overflow-hidden relative cursor-pointer group hover:border-[#76777d] transition-all shadow-none"
                >
                  <Image
                    src={displayUrl}
                    alt="Momento del evento"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 400px) 50vw, 25vw"
                    priority={index < 8}
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 justify-end">
                    <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-md text-black">
                      <Download className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Floating Camera Button on Mobile */}
      {photos.length > 0 && (
        <div className="sticky bottom-6 right-6 self-end mr-6 z-30 lg:hidden">
          <Link 
            href={`/e/${event.slug}`}
            className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
          >
            <Camera className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-[#e5e3dc] bg-white/50">
        <p className="text-[10px] text-[#76777d] font-semibold tracking-wider uppercase">EventSnap © 2026</p>
      </footer>

      {/* Lightbox Modal */}
      {selectedPhoto && selectedPhotoIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-6 select-none animate-in fade-in duration-200">
          {/* Top panel */}
          <div className="flex items-center justify-between text-white z-10">
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-85">
              {selectedPhotoIndex + 1} de {photos.length}
            </span>
            <button 
              onClick={closeLightbox}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation & Image */}
          <div className="flex-1 relative flex items-center justify-center my-4">
            <button 
              onClick={() => navigateLightbox('prev')}
              className="absolute left-0 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors cursor-pointer z-10 active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="relative w-full h-full max-h-[70vh] aspect-[3/4]">
              <Image
                src={selectedPhoto.watermarkedUrl ?? selectedPhoto.originalUrl}
                alt="Vista grande"
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            <button 
              onClick={() => navigateLightbox('next')}
              className="absolute right-0 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors cursor-pointer z-10 active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom actions panel */}
          <div className="w-full max-w-sm mx-auto flex flex-col gap-3 z-10">
            <a
              href={selectedPhoto.watermarkedUrl ?? selectedPhoto.originalUrl}
              download={`foto-${event.slug}-${selectedPhoto.id}.webp`}
              className="w-full py-4 bg-white hover:bg-zinc-100 text-black rounded-xl font-semibold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4" />
              Descargar foto
            </a>
            
            <button
              onClick={sharePhoto}
              className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold text-[10px] tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5" />
              Compartir enlace
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
