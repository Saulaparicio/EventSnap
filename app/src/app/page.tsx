import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-8 text-center">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">EventSnap 📸</h1>
        <p className="text-xl text-muted-foreground">
          Los invitados escanean un QR, suben su foto y aparece en pantalla con tu branding —
          en tiempo real.
        </p>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/auth/register" className={cn(buttonVariants({ size: 'lg' }))}>
          Crear cuenta gratis
        </Link>
        <Link href="/auth/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
          Iniciar sesión
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mt-8 text-left">
        {[
          { icon: '📱', title: 'QR sin login', desc: 'Los invitados solo escanean y suben. Sin registro, sin fricción.' },
          { icon: '🎨', title: 'Watermark automático', desc: 'Logo, nombre del evento y fecha en cada foto, sin esfuerzo.' },
          { icon: '📺', title: 'Slideshow en vivo', desc: 'Abre en cualquier TV del salón y muestra cada foto nueva al instante.' },
        ].map((f) => (
          <div key={f.title} className="border rounded-xl p-5 space-y-2">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
