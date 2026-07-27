'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, HelpCircle, ChevronDown, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventData {
  name: string
  slug: string
}

interface Props {
  event: EventData
}

interface FAQItem {
  id: string
  question: string
  answer: React.ReactNode
}

export default function GuestHelpCenter({ event }: Props) {
  const [openId, setOpenId] = useState<string | null>('permissions')

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  const faqs: FAQItem[] = [
    {
      id: 'permissions',
      question: '¿Cómo activo los permisos de la cámara en mi teléfono?',
      answer: (
        <div className="space-y-4 text-xs text-[#45464d] leading-relaxed">
          <p>
            Para tomar fotos directamente desde la aplicación, debes permitir el acceso a tu cámara. Sigue estos pasos según tu sistema:
          </p>
          <div className="border border-[#e5e3dc] rounded-xl p-4 bg-white space-y-3">
            <h4 className="font-bold text-black flex items-center gap-1.5">
              iOS (iPhone - Safari)
            </h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Toca el icono <strong className="text-black">aA</strong> en la barra de direcciones de Safari (esquina inferior o superior izquierda).</li>
              <li>Selecciona <strong className="text-black">Configuración del sitio web</strong>.</li>
              <li>Asegúrate de que el acceso a la <strong className="text-black">Cámara</strong> esté configurado en <strong className="text-black">Permitir</strong>.</li>
              <li>Recarga la página e intenta de nuevo.</li>
            </ol>
          </div>
          <div className="border border-[#e5e3dc] rounded-xl p-4 bg-white space-y-3">
            <h4 className="font-bold text-black flex items-center gap-1.5">
              Android (Chrome)
            </h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Toca los tres puntos <strong className="text-black">⋮</strong> en la esquina superior derecha.</li>
              <li>Ve a <strong className="text-black">Configuración</strong> &gt; <strong className="text-black">Configuración del sitio</strong> &gt; <strong className="text-black">Cámara</strong>.</li>
              <li>Asegúrate de que el acceso esté permitido para este sitio.</li>
              <li>Recarga la página e intenta de nuevo.</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'gallery_upload',
      question: '¿Puedo subir fotos que ya tomé desde mi galería?',
      answer: (
        <p className="text-xs text-[#45464d] leading-relaxed">
          ¡Sí, por supuesto! Si prefieres usar tu aplicación de cámara habitual o si estás experimentando problemas con el visor de cámara en vivo, puedes presionar el botón <strong className="text-black">"Subir desde galería"</strong> en la pantalla de bienvenida. Esto te permitirá seleccionar cualquier foto almacenada en tu dispositivo.
        </p>
      ),
    },
    {
      id: 'slideshow_delay',
      question: '¿Por qué mi foto aún no aparece en la pantalla gigante?',
      answer: (
        <div className="space-y-2 text-xs text-[#45464d] leading-relaxed">
          <p>
            Esto puede deberse a dos razones principales:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-black">Moderación activada</strong>: El organizador del evento puede haber activado la moderación previa. En este caso, un administrador debe aprobar tu foto en su panel antes de que se proyecte en el slideshow.</li>
            <li><strong className="text-black">Tiempo de tránsito</strong>: Dependiendo de la conexión a internet en el salón, la foto puede tardar entre 5 y 15 segundos en aparecer en pantalla.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'costs',
      question: '¿Tiene algún costo descargar mis fotos?',
      answer: (
        <p className="text-xs text-[#45464d] leading-relaxed">
          No. Todas las descargas de fotos dentro de la galería del evento son completamente gratuitas para los invitados. Puedes guardar la imagen procesada con la marca de agua del evento directamente a tu carrete.
        </p>
      ),
    },
  ]

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
            <p className="text-[10px] text-[#76777d] font-semibold tracking-wider uppercase mt-0.5">Soporte al Invitado</p>
          </div>
        </div>

        <Link 
          href={`/e/${event.slug}`} 
          className="bg-black text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0"
        >
          <Camera className="w-3.5 h-3.5" />
          Cámara
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8 space-y-6">
        <div className="text-center space-y-2 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full border border-[#e5e3dc] bg-white flex items-center justify-center mx-auto shadow-sm text-black">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Centro de Ayuda</h2>
          <p className="text-xs text-[#45464d] leading-relaxed">
            Resuelve dudas rápidas sobre cómo usar la cámara del evento y proyectar tus fotos.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id
            return (
              <div 
                key={faq.id}
                className="bg-white border border-[#e5e3dc] rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer group hover:bg-[#f6f3f5]/50 transition-colors"
                >
                  <span className="text-xs font-bold text-[#0f172a] group-hover:text-black pr-4 leading-normal">{faq.question}</span>
                  <ChevronDown className={cn("w-4 h-4 text-[#76777d] shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                </button>
                
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-[#e5e3dc]/50 pt-4 bg-[#fcf8fa]/40 animate-in slide-in-from-top-2 duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Tip Box */}
        <div className="border border-[#e5e3dc] bg-[#86f2e4]/15 rounded-2xl p-5 flex items-start gap-3.5">
          <CheckCircle className="w-5 h-5 text-[#006f66] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#006f66]">Consejo de captura</h4>
            <p className="text-2xs text-[#006f66] leading-relaxed">
              Las mejores fotos se logran en orientación vertical. Asegúrate de tener buena luz y de que los rostros no estén a contraluz para que se proyecten con total claridad.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-[#e5e3dc] bg-white/50">
        <p className="text-[10px] text-[#76777d] font-semibold tracking-wider uppercase">EventSnap © 2026</p>
      </footer>
    </div>
  )
}
