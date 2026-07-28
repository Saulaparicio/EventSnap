import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, cn } from '@/lib/utils'
import { Calendar, Image as ImageIcon, Link as LinkIcon, Plus, Eye, Filter, Grid, BarChart2 } from 'lucide-react'
import QRDownloadButton from '@/components/admin/QRDownloadButton'
import Image from 'next/image'

export default async function DashboardPage() {
  const session = await auth()
  
  // Load events along with their photos and counts
  const events = await prisma.event.findMany({
    where: { orgId: session!.user!.id! },
    include: { 
      photos: {
        orderBy: { uploadedAt: 'desc' },
        take: 1, // To use the latest photo as cover
        select: { watermarkedUrl: true, thumbnailUrl: true }
      },
      _count: { select: { photos: true } } 
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate stats
  const totalEvents = events.length
  const totalPhotos = events.reduce((sum, e) => sum + e._count.photos, 0)
  const activeEvents = events.filter(e => e.status === 'active').length
  
  // Assuming average photo size is 1.2 MB. Limit is 500 MB for free tier.
  const storageLimitMb = 500
  const storageUsedMb = totalPhotos * 1.2
  const storagePercent = Math.min(Math.round((storageUsedMb / storageLimitMb) * 100), 100)

  return (
    <div className="p-6 space-y-8 w-full">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">¡Hola de nuevo, {session!.user!.name}!</h1>
          <p className="text-sm text-[#45464d]">Gestiona tus galerías en vivo y la moderación en tiempo real.</p>
        </div>
        
        <Link href="/events/new" className={cn(buttonVariants(), "bg-black text-white hover:bg-slate-800 rounded-xl px-5 py-6 text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform shrink-0 shadow-sm")}>
          <Plus className="w-4 h-4" />
          Crear Nuevo Evento
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] font-bold text-[#45464d] tracking-widest uppercase mb-1">Total Eventos</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-bold tracking-tight text-black">{totalEvents}</span>
            <span className="text-[#006a61] font-bold text-xs">activos e históricos</span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] font-bold text-[#45464d] tracking-widest uppercase mb-1">Total Fotos</p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-bold tracking-tight text-black">
              {totalPhotos >= 1000 ? `${(totalPhotos / 1000).toFixed(1)}k` : totalPhotos}
            </span>
            <span className="text-[#006a61] font-bold text-xs">subidas</span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] font-bold text-[#45464d] tracking-widest uppercase mb-1">Eventos en Vivo</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-black">{activeEvents}</span>
            {activeEvents > 0 && (
              <span className="bg-[#86f2e4] text-[#006f66] px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase animate-pulse">
                Live
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#e5e3dc] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] font-bold text-[#45464d] tracking-widest uppercase mb-1">Almacenamiento</p>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-lg font-bold text-black">{storagePercent}%</span>
              <span className="text-[#45464d] text-[10px]">{storageUsedMb.toFixed(0)} / {storageLimitMb} MB</span>
            </div>
            <div className="w-full h-1.5 bg-[#f0edef] rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: `${storagePercent}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Events List Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-black tracking-tight">Tus Eventos</h2>
          <div className="flex gap-2">
            <button className="bg-white text-[#45464d] p-2 rounded-xl border border-[#e5e3dc] cursor-pointer hover:bg-[#f6f3f5] transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="bg-white text-[#45464d] p-2 rounded-xl border border-[#e5e3dc] cursor-pointer hover:bg-[#f6f3f5] transition-colors">
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="border border-border bg-white rounded-2xl p-16 text-center space-y-4 shadow-sm">
            <div className="text-5xl">📅</div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-[#0f172a]">Aún no tienes eventos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Crea tu primer evento y genera el código qr para tus invitados.</p>
            </div>
            <Link href="/events/new" className={cn(buttonVariants(), 'rounded-xl text-sm font-semibold bg-black text-white hover:bg-slate-800 px-6 py-5 shadow-none mt-2')}>
              Crear primer evento
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const coverUrl = event.photos[0]?.thumbnailUrl ?? event.photos[0]?.watermarkedUrl ?? null

              return (
                <div key={event.id} className="bg-white border border-[#e5e3dc] rounded-2xl overflow-hidden hover:border-black transition-colors group flex flex-col justify-between shadow-sm">
                  <div className="h-44 relative overflow-hidden bg-neutral-50 border-b border-[#e5e3dc]">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={event.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 30vw"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                        <span className="material-symbols-outlined text-4xl mb-1">celebration</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">Aún sin fotos</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      {event.status === 'active' ? (
                        <span className="bg-[#86f2e4] text-[#006f66] px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase shadow-sm">
                          Live
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
                          Finalizado
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm text-[#0f172a] group-hover:text-black line-clamp-1 leading-tight">{event.name}</h3>
                        <Link
                          href={`/events/${event.id}`}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-[#f6f3f5] border border-[#e5e3dc] text-[#76777d] hover:text-black transition-colors"
                          title="Editar y administrar galería"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </Link>
                      </div>
                      <p className="text-[10px] text-[#76777d] font-semibold tracking-wider uppercase">{formatDate(event.date)}</p>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-[#1b1b1d] border-t border-[#e5e3dc] pt-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0f172a]">{event._count.photos}</span>
                        <span className="text-[10px] text-[#76777d]">Fotos</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0f172a]">{event.slug}</span>
                        <span className="text-[10px] text-[#76777d]">Slug QR</span>
                      </div>
                    </div>

                    {/* Primary CTA: enter gallery management */}
                    <Link
                      href={`/events/${event.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-slate-800 active:scale-[0.98] transition-all rounded-xl py-2.5 text-xs font-bold tracking-wide"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      Administrar Galería
                    </Link>

                    {/* Secondary quick-access actions */}
                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#f6f3f5] transition-colors border border-[#e5e3dc] text-center"
                      >
                        <span className="material-symbols-outlined text-md text-black">photo_library</span>
                        <span className="text-[9px] font-bold text-[#45464d]">Moderar</span>
                      </Link>
                      <a
                        href={`/live/${event.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#f6f3f5] transition-colors border border-[#e5e3dc] text-center"
                      >
                        <span className="material-symbols-outlined text-md text-black">slideshow</span>
                        <span className="text-[9px] font-bold text-[#45464d]">Slideshow</span>
                      </a>
                      <QRDownloadButton eventId={event.id} slug={event.slug} />
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Plan new event placeholder card */}
            <Link
              href="/events/new"
              className="border-2 border-dashed border-[#e5e3dc] rounded-2xl flex flex-col items-center justify-center p-6 min-h-[352px] group cursor-pointer hover:border-black hover:bg-white transition-all text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#f0edef] flex items-center justify-center mb-4 group-hover:bg-[#0f172a] group-hover:text-white transition-colors">
                <Plus className="w-5 h-5 text-black group-hover:text-white" />
              </div>
              <h3 className="font-bold text-sm text-[#0f172a] group-hover:text-black">Planificar nuevo evento</h3>
              <p className="text-xs text-[#76777d] mt-1 max-w-[200px] leading-relaxed">Configura la marca de agua y descarga tu código QR al instante.</p>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
