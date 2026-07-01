import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Header bar */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">EventSnap 📸</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "text-sm text-muted-foreground hover:text-primary transition-colors")}>
              Iniciar sesión
            </Link>
            <Link href="/auth/register" className={cn(buttonVariants({ size: 'sm' }), "text-sm rounded-md")}>
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-primary max-w-2xl mx-auto leading-tight">
            Fotos en vivo para tus eventos, sin fricción
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Los invitados escanean un código qr, suben sus fotos desde su dispositivo móvil y aparecen en la pantalla del salón con tu marca de agua al instante.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap justify-center pt-2">
          <Link href="/auth/register" className={cn(buttonVariants({ size: 'lg' }), "rounded-md px-8 py-6 text-base font-medium")}>
            Comenzar ahora gratis
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-16 text-left">
          {[
            {
              icon: '📱',
              title: 'Código qr sin registro',
              desc: 'Tus invitados solo escanean y suben fotos. Sin necesidad de descargar aplicaciones ni crear cuentas.',
            },
            {
              icon: '🎨',
              title: 'Marca de agua automática',
              desc: 'Aplica logotipos, texto personalizado y fechas en cada foto de manera automática antes de guardarse.',
            },
            {
              icon: '📺',
              title: 'Presentación en vivo',
              desc: 'Proyecta el slideshow en tiempo real en cualquier televisor o pantalla gigante del salón.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="border border-border bg-white rounded-xl p-6 space-y-3 transition-colors hover:bg-neutral-50/50"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="text-base font-medium text-primary">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} EventSnap. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span className="hover:text-primary transition-colors cursor-pointer">Términos de servicio</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Política de privacidad</span>
          </div>
        </div>
      </footer>
    </main>
  )
}

