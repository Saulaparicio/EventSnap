import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { signOut } from '@/lib/auth'
import {
  Bell,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  Images,
  Users,
  LifeBuoy,
  Settings,
  Plus,
} from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U'

  return (
    <div className="min-h-screen bg-[#f7f4f6] text-[#1b1b1d] font-sans flex flex-col">

      {/* ── TOP NAVIGATION BAR ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-[#e5e3dc] h-14 flex items-center px-5 gap-6">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 w-[168px]">
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
            <Images className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-black text-black tracking-tight">EventSnap</span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <Link
            href="/dashboard"
            className="text-[#0f172a] font-semibold text-[13px] px-3 py-1.5 rounded-lg hover:bg-[#f0edef] transition-colors"
          >
            Eventos
          </Link>
          <span className="text-[#76777d] font-medium text-[13px] px-3 py-1.5 rounded-lg cursor-not-allowed opacity-50">
            Moderación
          </span>
          <span className="text-[#76777d] font-medium text-[13px] px-3 py-1.5 rounded-lg cursor-not-allowed opacity-50">
            Analíticas
          </span>
          <span className="text-[#76777d] font-medium text-[13px] px-3 py-1.5 rounded-lg cursor-not-allowed opacity-50">
            Ajustes
          </span>
        </nav>

        {/* Search (visual) */}
        <div className="hidden lg:flex items-center gap-2 bg-[#f7f4f6] border border-[#e5e3dc] rounded-xl px-3 py-1.5 w-56 text-[13px] text-[#76777d]">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          Buscar…
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/events/new"
            className="hidden sm:flex items-center gap-1.5 bg-black text-white text-[12px] font-bold px-3.5 py-1.5 rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Crear Evento
          </Link>
          <button className="p-2 rounded-full hover:bg-[#f6f3f5] text-[#45464d] hover:text-black transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full hover:bg-[#f6f3f5] text-[#45464d] hover:text-black transition-colors cursor-pointer">
            <HelpCircle className="w-4 h-4" />
          </button>
          <form action={async () => {
            'use server'
            await signOut({ redirectTo: '/auth/login' })
          }}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="p-2 rounded-full hover:bg-[#f6f3f5] text-[#45464d] hover:text-black transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
          <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-[11px] font-black text-white shrink-0">
            {initials}
          </div>
        </div>
      </header>

      {/* ── BODY: sidebar + content ── */}
      <div className="flex flex-1 pt-14">

        {/* LEFT SIDEBAR */}
        <aside className="fixed top-14 left-0 bottom-0 w-[176px] bg-white border-r border-[#e5e3dc] flex flex-col z-40 overflow-y-auto">
          <div className="p-4 border-b border-[#e5e3dc]">
            <p className="text-[11px] font-black text-black tracking-wide">EventSnap Admin</p>
            <p className="text-[10px] text-[#76777d] mt-0.5">Gestiona eventos en vivo</p>
          </div>

          <nav className="flex-1 p-3 space-y-0.5">
            <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-[#0f172a] hover:bg-[#f0edef] transition-colors">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold bg-[#86f2e4] text-[#006f66] cursor-default">
              <Images className="w-4 h-4 shrink-0" />
              Galería
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#76777d] cursor-not-allowed opacity-60">
              <Users className="w-4 h-4 shrink-0" />
              Invitados
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#76777d] cursor-not-allowed opacity-60">
              <LifeBuoy className="w-4 h-4 shrink-0" />
              Soporte
            </div>
          </nav>

          {/* Storage + Settings at bottom */}
          <div className="p-3 border-t border-[#e5e3dc] space-y-1">
            <div className="px-3 py-2.5 rounded-xl bg-[#f7f4f6] border border-[#e5e3dc]">
              <p className="text-[10px] font-bold text-[#45464d] uppercase tracking-wider mb-2">Almacenamiento</p>
              <div className="w-full h-1.5 bg-[#e5e3dc] rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-black rounded-full" style={{ width: '2%' }} />
              </div>
              <p className="text-[10px] text-[#76777d]">0 / 500 MB</p>
            </div>
            <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#45464d] hover:bg-[#f0edef] transition-colors">
              <Settings className="w-4 h-4 shrink-0" />
              Ajustes
            </Link>
            <form action={async () => {
              'use server'
              await signOut({ redirectTo: '/auth/login' })
            }}>
              <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#76777d] hover:bg-[#f0edef] hover:text-black transition-colors cursor-pointer">
                <LogOut className="w-4 h-4 shrink-0" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 ml-[176px] min-h-[calc(100vh-3.5rem)] overflow-auto">
          {children}
        </main>

      </div>
    </div>
  )
}
