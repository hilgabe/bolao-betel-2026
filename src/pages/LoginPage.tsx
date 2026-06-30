import { Eye, EyeOff, LogIn, LockKeyhole, UserRound } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth'

const recentParticipantsStorageKey = 'bolao-betel-recent-participants'

function readRecentParticipants() {
  const raw = window.localStorage.getItem(recentParticipantsStorageKey)
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as string[]
  } catch {
    window.localStorage.removeItem(recentParticipantsStorageKey)
    return []
  }
}

function saveRecentParticipant(nome: string) {
  const updated = [nome, ...readRecentParticipants().filter((item) => item !== nome)].slice(0, 12)
  window.localStorage.setItem(recentParticipantsStorageKey, JSON.stringify(updated))
}

export function LoginPage() {
  const { firebaseReady, firebaseUser, loginWithName } = useAuth()
  const location = useLocation()
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const recentParticipants = useMemo(() => readRecentParticipants(), [])

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/home'

  if (firebaseUser) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const participantName = nome.trim()
      await loginWithName(participantName, senha)
      saveRecentParticipant(participantName)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-betel-paper px-4 py-8">
      <div className="pointer-events-none absolute left-0 top-0 h-28 w-52 rotate-[-18deg] bg-betel-red" />
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-48 rotate-12 bg-betel-yellow" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-48 rotate-12 bg-betel-green" />
      <section className="panel relative z-10 w-full max-w-md p-5 sm:p-6">
        <div className="mb-6">
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-betel-ink text-base font-black text-white">
            BB
          </span>
          <h1 className="mt-4 text-3xl font-black text-slate-950">Bolão Betel 2026</h1>
          <p className="mt-2 text-sm text-slate-600">
            Entre com seu nome e uma senha simples para guardar seus palpites.
          </p>
        </div>

        {!firebaseReady ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
            Configure as variáveis do Firebase no arquivo .env para habilitar login por nome e senha.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="label">Nome</span>
            <div className="mt-1 flex rounded-lg border border-slate-300 bg-white px-3 focus-within:border-betel-blue focus-within:ring-4 focus-within:ring-blue-100">
              <UserRound className="mt-2.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <input
                className="w-full border-0 bg-transparent px-2 py-2 text-sm text-slate-950 outline-none"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                list="recent-participants"
                required
                autoComplete="name"
                placeholder="Digite ou selecione seu nome"
              />
              <datalist id="recent-participants">
                {recentParticipants.map((participant) => (
                  <option key={participant} value={participant} />
                ))}
              </datalist>
            </div>
          </label>

          <label className="block">
            <span className="label">Senha</span>
            <div className="mt-1 flex rounded-lg border border-slate-300 bg-white px-3 focus-within:border-betel-blue focus-within:ring-4 focus-within:ring-blue-100">
              <LockKeyhole className="mt-2.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <input
                className="w-full border-0 bg-transparent px-2 py-2 text-sm text-slate-950 outline-none"
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
                placeholder="Exemplo: betel26"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="grid w-9 shrink-0 place-items-center text-slate-500"
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <span className="mt-1 block text-xs font-bold text-slate-500">
              Use uma senha fácil de lembrar, com pelo menos 6 caracteres.
            </span>
          </label>

          {recentParticipants.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentParticipants.map((participant) => (
                <button
                  key={participant}
                  type="button"
                  onClick={() => setNome(participant)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  {participant}
                </button>
              ))}
            </div>
          ) : null}

          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

          <button type="submit" className="btn-primary w-full" disabled={!firebaseReady || submitting}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Entrar no bolão
          </button>
        </form>
      </section>
    </main>
  )
}
