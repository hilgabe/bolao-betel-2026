import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Home,
  LogOut,
  Shield,
  Table2,
  Trophy,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { NotificationBell } from './NotificationBell'

const navItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/jogos', label: 'Jogos', icon: CalendarDays },
  { to: '/tabela', label: 'Tabela', icon: Table2 },
  { to: '/regras', label: 'Regras', icon: BookOpen },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
]

function navClass(isActive: boolean) {
  return [
    'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition sm:flex-none sm:text-sm',
    isActive
      ? 'bg-betel-blue text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  ].join(' ')
}

export function AppShell() {
  const { logout, profile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute -left-12 top-0 h-24 w-48 rotate-[-18deg] bg-betel-red opacity-90" />
      <div className="pointer-events-none absolute right-0 top-0 h-20 w-44 rotate-12 bg-betel-yellow opacity-90" />
      <div className="pointer-events-none absolute bottom-12 left-0 h-16 w-40 rotate-12 bg-betel-green opacity-80" />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Ir para home"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-betel-ink text-sm font-black text-white">
              BB
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black text-slate-950">
                Bolao Betel 2026
              </span>
              <span className="block truncate text-xs font-bold text-slate-500">
                {profile?.nome || 'Participante'}
              </span>
            </span>
          </button>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive)}>
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
            {profile?.role === 'admin' ? (
              <NavLink to="/admin" className={({ isActive }) => navClass(isActive)}>
                <Shield className="h-4 w-4" aria-hidden="true" />
                Admin
              </NavLink>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button type="button" onClick={handleLogout} className="btn-secondary px-3" title="Sair">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-2 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-xl gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive)}>
              <item.icon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{item.label}</span>
            </NavLink>
          ))}
          {profile?.role === 'admin' ? (
            <NavLink to="/admin" className={({ isActive }) => navClass(isActive)}>
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Admin</span>
            </NavLink>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
